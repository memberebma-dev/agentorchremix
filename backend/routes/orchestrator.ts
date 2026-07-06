import Stripe from "stripe";
import { createClient } from "@blinkdotnew/sdk";
import { generateAIContent, generateStructuredContent } from "../lib/ai";
import { sendEmail, buildOutreachEmail } from "../lib/email";
import { discoverLeadsFromMaps, discoverLeadsViaAI, scoreLeadFromPresence } from "../lib/maps";
import { findOrCreateCustomer, createAndFinalizeInvoice } from "../lib/stripeInvoice";
import { BACKEND_URL } from "../lib/config";

export async function runOrchestration(
  env: Record<string, string>,
  body: { runId: string; agentName: string; leadId?: string; niche?: string; location?: string; amount?: number; threshold?: number }
) {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const mapsKey = env.GOOGLE_MAPS_API_KEY || "";
  const stripeKey = env.STRIPE_SECRET_KEY || "";
  const hasEmailProvider = !!(env.SENDGRID_API_KEY || env.RESEND_API_KEY);
  const { runId, agentName, leadId } = body;
  const growthPackagePrice = Number(body.amount) > 0 ? Number(body.amount) : 4997;
  const leadScoreThreshold = Number.isFinite(body.threshold) ? Number(body.threshold) : 60;
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const updateRun = async (status: string, progress: number, logs: string) => {
    try { await blink.db.agentRuns.update(runId, { status, progressPercent: progress, logsText: logs, finishedAt: status === "success" || status === "failed" ? new Date().toISOString() : null }); } catch (e) { console.error("updateRun:", e); }
  };

  try {
    // ─── Lead Discovery (Google Maps → AI fallback) ───────────────────────────
    if (agentName === "Lead Discovery") {
      const niche = body.niche || "commercial bridge lender";
      const location = body.location || "Southern California";
      await updateRun("running", 10, `Searching for "${niche}" in "${location}"...`);
      let places = await discoverLeadsFromMaps(mapsKey, niche, location, 10);
      let source = "Google Maps API";
      if (places.length === 0) {
        await updateRun("running", 20, `Maps unavailable. Falling back to AI discovery for "${niche}" in "${location}"...`);
        places = await discoverLeadsViaAI(env, niche, location, 10);
        source = "AI Discovery";
      }
      if (places.length === 0) { await updateRun("failed", 0, `Could not find leads for "${niche}" in "${location}". Try a broader niche or location.`); return; }
      await updateRun("running", 50, `Found ${places.length} businesses via ${source}. Scoring & deduplicating...`);
      let created = 0, skipped = 0;
      for (const place of places) {
        const existing = await blink.db.leads.list({ where: { companyName: place.companyName }, limit: 1 }) as any[];
        if (existing.length > 0) { skipped++; continue; }
        const { overallScore } = scoreLeadFromPresence(place);
        const dataSource = source === "Google Maps API" ? "google_maps" : "ai_estimated";
        await blink.db.leads.create({ id: crypto.randomUUID(), companyName: place.companyName, website: place.website || "", phone: place.phone || "", contactEmail: "", contactName: "", source, dataSource, niche, location: place.address || location, status: "new", leadScore: overallScore, consentObtained: 0 });
        created++;
      }
      await updateRun("success", 100, `${source}: ${created} new leads added, ${skipped} duplicates skipped. Query: "${niche}" in "${location}".`);
      return;
    }

    // ─── Scoring (real web presence analysis) ─────────────────────────────────
    if (agentName === "Scoring") {
      if (leadId) {
        await updateRun("running", 30, "Fetching lead data for real scoring...");
        const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
        const lead = leads[0]; if (!lead) throw new Error("Lead not found");
        await scoreLead(blink, lead, growthPackagePrice);
        await updateRun("success", 100, `Scored ${lead.companyName}.`);
        return;
      }
      // Batch mode: score every newly discovered lead that hasn't been scored yet
      await updateRun("running", 10, "Scanning pipeline for unscored leads...");
      const candidates = await blink.db.leads.list({ where: { status: "new" }, limit: 25 }) as any[];
      if (candidates.length === 0) { await updateRun("success", 100, "No new leads pending scoring."); return; }
      let done = 0;
      for (const lead of candidates) {
        await updateRun("running", 10 + Math.round((done / candidates.length) * 85), `Scoring ${lead.companyName} (${done + 1}/${candidates.length})...`);
        await scoreLead(blink, lead, growthPackagePrice);
        done++;
      }
      await updateRun("success", 100, `Batch complete: scored ${done} lead(s).`);
      return;
    }

    // ─── Asset Generation (real Groq AI) ──────────────────────────────────────
    if (agentName === "Asset Generation") {
      if (leadId) {
        const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
        const lead = leads[0]; if (!lead) throw new Error("Lead not found");
        await updateRun("running", 40, `Generating AI audit for ${lead.companyName}...`);
        await generateAssetsForLead(blink, env, lead);
        await updateRun("success", 100, `AI assets generated for ${lead.companyName}.`);
        return;
      }
      // Batch mode: generate assets for every lead that doesn't have them yet
      await updateRun("running", 10, "Scanning pipeline for leads without generated assets...");
      const candidates = await blink.db.leads.list({ where: { status: "scored" }, limit: 10 }) as any[];
      if (candidates.length === 0) { await updateRun("success", 100, "No scored leads pending asset generation."); return; }
      let done = 0;
      for (const lead of candidates) {
        await updateRun("running", 10 + Math.round((done / candidates.length) * 85), `Generating AI assets for ${lead.companyName} (${done + 1}/${candidates.length})...`);
        await generateAssetsForLead(blink, env, lead);
        done++;
      }
      await updateRun("success", 100, `Batch complete: AI assets generated for ${done} lead(s).`);
      return;
    }

    // ─── Outreach (real SendGrid/Resend email) ────────────────────────────────
    if (agentName === "Outreach") {
      if (leadId) {
        const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
        const lead = leads[0]; if (!lead) throw new Error("Lead not found");
        if (!lead.consentObtained) { await updateRun("failed", 0, `Blocked: ${lead.companyName} has not been verified for outreach yet. Verify the lead on the Leads page first.`); return; }
        await updateRun("running", 40, `Composing AI outreach for ${lead.companyName}...`);
        const emailSent = await runOutreachForLead(blink, env, lead, hasEmailProvider);
        await updateRun("success", 100, `Outreach sent for ${lead.companyName}. Email${emailSent ? " delivered" : lead.contactEmail ? " queued (no email provider key)" : " skipped (no email on file)"}.`);
        return;
      }
      // Batch mode: send to every verified lead that's ready but hasn't been contacted yet
      await updateRun("running", 10, "Scanning pipeline for verified leads ready for outreach...");
      const audited = await blink.db.leads.list({ where: { status: "audited" }, limit: 10 }) as any[];
      const candidates = audited.filter((l: any) => !!l.consentObtained);
      if (candidates.length === 0) { await updateRun("success", 100, "No verified leads pending outreach. Verify a lead on the Leads page first."); return; }
      let done = 0;
      for (const lead of candidates) {
        await updateRun("running", 10 + Math.round((done / candidates.length) * 85), `Sending outreach to ${lead.companyName} (${done + 1}/${candidates.length})...`);
        await runOutreachForLead(blink, env, lead, hasEmailProvider);
        done++;
      }
      await updateRun("success", 100, `Batch complete: outreach sent to ${done} verified lead(s).`);
      return;
    }

    // ─── Qualifying Agent ─────────────────────────────────────────────────────
    if (agentName === "Qualifying") {
      await updateRun("running", 20, "Scanning pipeline for leads ready to advance...");
      const threshold = leadScoreThreshold;
      const outreachLeads = await blink.db.leads.list({ where: { status: "outreach_sent" }, limit: 50 }) as any[];
      let promoted = 0, expired = 0;
      for (const lead of outreachLeads) {
        const scores = await blink.db.leadScores.list({ where: { leadId: lead.id }, limit: 1 }) as any[];
        const score = scores[0]?.overallScore || lead.leadScore || 0;
        const replyEvents = await blink.db.outreachAnalytics.list({ where: { leadId: lead.id, eventType: "replied" }, limit: 1 }) as any[];
        const daysSince = (Date.now() - new Date(lead.updatedAt || lead.createdAt).getTime()) / 86400000;
        if (replyEvents.length > 0) { await blink.db.leads.update(lead.id, { status: "responded" }); promoted++; }
        // No dead zone: any high-scorer still within the 14-day window qualifies,
        // not just ones scored in the first 7 days. Only past 14 days with no
        // reply and no qualifying score does a lead actually expire.
        else if (score >= threshold && daysSince <= 14) { await blink.db.leads.update(lead.id, { status: "qualified" }); promoted++; }
        else if (daysSince > 14) { await blink.db.leads.update(lead.id, { status: "lost" }); expired++; }
      }
      const respondedLeads = await blink.db.leads.list({ where: { status: "responded" }, limit: 50 }) as any[];
      for (const lead of respondedLeads) {
        const scores = await blink.db.leadScores.list({ where: { leadId: lead.id }, limit: 1 }) as any[];
        if ((scores[0]?.overallScore || 0) >= threshold) { await blink.db.leads.update(lead.id, { status: "proposal" }); promoted++; }
      }
      await updateRun("success", 100, `Qualifying complete: ${promoted} advanced, ${expired} expired. Threshold: ${threshold}/100.`);
      return;
    }

    // ─── Invoicing (real Stripe invoice) ───────────────────────────────────────
    if (agentName === "Invoicing") {
      if (!stripeKey) { await updateRun("failed", 0, "STRIPE_SECRET_KEY not configured — cannot create a real invoice."); return; }
      const stripe = new Stripe(stripeKey);

      if (leadId) {
        const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
        const lead = leads[0]; if (!lead) throw new Error("Lead not found");
        const result = await invoiceLead(blink, env, stripe, lead, growthPackagePrice, hasEmailProvider);
        await updateRun(result.ok ? "success" : "failed", result.ok ? 100 : 0, result.message);
        return;
      }
      // Batch mode: invoice every verified, qualified lead that doesn't have an open/paid invoice yet
      await updateRun("running", 10, "Scanning pipeline for qualified leads ready to invoice...");
      const candidates = (await blink.db.leads.list({ where: { status: "qualified" }, limit: 10 }) as any[])
        .filter((l: any) => !!l.consentObtained);
      if (candidates.length === 0) { await updateRun("success", 100, "No verified, qualified leads pending invoicing."); return; }
      let invoiced = 0, skipped = 0;
      for (const lead of candidates) {
        await updateRun("running", 10 + Math.round((invoiced / candidates.length) * 85), `Invoicing ${lead.companyName}...`);
        const result = await invoiceLead(blink, env, stripe, lead, growthPackagePrice, hasEmailProvider);
        if (result.ok) invoiced++; else skipped++;
      }
      await updateRun("success", 100, `Batch complete: ${invoiced} invoice(s) created, ${skipped} skipped.`);
      return;
    }

    // ─── Repurposing ──────────────────────────────────────────────────────────
    if (agentName === "Repurposing") {
      if (!leadId) throw new Error("leadId required");
      await blink.db.leads.update(leadId, { status: "lost" });
      await updateRun("success", 100, "Lead marked lost. Assets freed for repurposing.");
      return;
    }

    // ─── Full Pipeline ────────────────────────────────────────────────────────
    if (agentName === "Full Pipeline" || agentName === "Coordinator") {
      const niche = body.niche || "commercial bridge lender";
      const location = body.location || "Southern California";
      await runFullPipeline(blink, updateRun, env, mapsKey, niche, location, growthPackagePrice, hasEmailProvider);
      return;
    }

    await updateRun("success", 100, `${agentName} executed.`);
  } catch (error: any) {
    console.error("Orchestration error:", error);
    try { const b2 = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY }); await b2.db.agentRuns.update(runId, { status: "failed", progressPercent: 0, logsText: `Error: ${error.message}`, finishedAt: new Date().toISOString() }); } catch {}
  }
}

async function invoiceLead(blink: any, env: Record<string, string>, stripe: Stripe, lead: any, growthPackagePrice: number, hasEmailProvider: boolean): Promise<{ ok: boolean; message: string }> {
  // Only an open/paid invoice blocks re-invoicing — a voided/uncollectible one should not.
  const existing = await blink.db.invoices.list({ where: { leadId: lead.id }, limit: 5 }) as any[];
  if (existing.some((inv: any) => inv.status === "open" || inv.status === "paid")) {
    return { ok: true, message: `Invoice already exists for ${lead.companyName}.` };
  }
  if (!lead.consentObtained) {
    return { ok: false, message: `Blocked: ${lead.companyName} has not been verified yet. Verify the lead on the Leads page first.` };
  }

  const amountCents = Math.round(growthPackagePrice * 100);
  const customer = await findOrCreateCustomer(stripe, lead.contactEmail || "", lead.contactName || lead.companyName);
  const invoice = await createAndFinalizeInvoice(stripe, {
    customerId: customer.id,
    amountCents,
    description: `Digital Agency Growth Package — ${lead.companyName}`,
  });

  const invoiceId = crypto.randomUUID();
  await blink.db.invoices.create({ id: invoiceId, leadId: lead.id, amount: growthPackagePrice, status: "open", stripeInvoiceId: invoice.id });
  await blink.db.invoiceReminders.create({ id: crypto.randomUUID(), invoiceId, reminderType: "initial", status: "pending", escalationLevel: 1 });
  await blink.db.leads.update(lead.id, { status: "proposal" });

  const formattedPrice = growthPackagePrice.toLocaleString();
  let emailSent = false;
  if (lead.contactEmail && hasEmailProvider && invoice.hosted_invoice_url) {
    emailSent = await sendEmail(env, lead.contactEmail, `Invoice ready — Digital Agency Growth Package ($${formattedPrice})`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
        <p>Hi ${lead.contactName || "there"},</p>
        <p>Your <strong>Digital Agency Growth Package</strong> invoice for <strong>$${formattedPrice}</strong> is ready.</p>
        <p><a href="${invoice.hosted_invoice_url}" style="background:#0D9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View & Pay Invoice</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#888;font-size:12px">— AgentOrch<br/><a href="https://agentorch.io" style="color:#0D9488">agentorch.io</a></p>
      </div>`);
  }
  return { ok: true, message: `Real Stripe invoice ${invoice.id} created for $${formattedPrice} (${lead.companyName}).${emailSent ? " Emailed to customer." : lead.contactEmail ? " (No email provider key — email not sent, use hosted link.)" : " (No contact email on file.)"}` };
}

async function scoreLead(blink: any, lead: any, growthPackagePrice: number) {
  const { overallScore, conversionLikelihood, issues } = scoreLeadFromPresence({ website: lead.website, phone: lead.phone });
  const issuesJson = JSON.stringify(issues);
  const existing = await blink.db.leadScores.list({ where: { leadId: lead.id }, limit: 1 }) as any[];
  if (existing.length > 0) {
    await blink.db.leadScores.update(existing[0].id, { overallScore, conversionLikelihood, issuesJson, potentialServicesValue: growthPackagePrice });
  } else {
    await blink.db.leadScores.create({ id: crypto.randomUUID(), leadId: lead.id, overallScore, conversionLikelihood, issuesJson, potentialServicesValue: growthPackagePrice });
  }
  await blink.db.leads.update(lead.id, { status: "scored", leadScore: overallScore });
}

async function runOutreachForLead(blink: any, env: Record<string, string>, lead: any, hasEmailProvider: boolean): Promise<boolean> {
  const emailBody = await generateAIContent(env, `Write a 4-sentence cold outreach email for ${lead.companyName} (${lead.contactName || "decision maker"}). Mention you built them a preview website, reference SEO gaps, offer no-pressure view, end with yes/no question. Conversational.`);
  const existingSeq = await blink.db.outreachSequences.list({ where: { leadId: lead.id }, limit: 1 }) as any[];
  let sequenceId: string;
  let step: number;
  if (existingSeq.length === 0) {
    sequenceId = crypto.randomUUID();
    step = 1;
    await blink.db.outreachSequences.create({ id: sequenceId, leadId: lead.id, step, status: "sent", emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString(), lastEmailBody: emailBody });
  } else {
    sequenceId = existingSeq[0].id;
    step = Math.min((existingSeq[0].step || 1) + 1, 5);
    await blink.db.outreachSequences.update(sequenceId, { step, lastSentAt: new Date().toISOString(), lastEmailBody: emailBody });
  }
  await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(), sequenceId, leadId: lead.id, step, eventType: "sent", metadata: JSON.stringify({ channel: "email" }) });
  let emailSent = false;
  if (lead.contactEmail && hasEmailProvider) {
    emailSent = await sendEmail(env, lead.contactEmail, `Preview site ready for ${lead.companyName}`, buildOutreachEmail(lead.contactName, lead.companyName, emailBody));
  }
  await blink.db.leads.update(lead.id, { status: "outreach_sent" });
  return emailSent;
}

async function generateAssetsForLead(blink: any, env: Record<string, string>, lead: any) {
  const audit = JSON.stringify(await buildAuditReportData(env, lead));
  const existing = await blink.db.generatedAssets.list({ where: { leadId: lead.id, type: "audit_report" }, limit: 1 }) as any[];
  if (existing.length > 0) { await blink.db.generatedAssets.update(existing[0].id, { content: audit }); }
  else { await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "audit_report", hostedUrl: `${BACKEND_URL}/preview/audit/${lead.id}`, content: audit }); }

  const site = JSON.stringify(await buildWebsitePreviewData(env, lead));
  const existWeb = await blink.db.generatedAssets.list({ where: { leadId: lead.id, type: "custom_website" }, limit: 1 }) as any[];
  if (existWeb.length > 0) { await blink.db.generatedAssets.update(existWeb[0].id, { content: site }); }
  else { await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "custom_website", hostedUrl: `${BACKEND_URL}/preview/site/${lead.id}`, content: site }); }

  await blink.db.leads.update(lead.id, { status: "audited" });
}

interface AuditReportData {
  headline: string;
  overallImpression: string;
  criticalIssues: string[];
  quickWins: string[];
  closingPitch: string;
}

interface WebsitePreviewData {
  heroHeadline: string;
  heroSubheadline: string;
  pillars: { title: string; description: string }[];
  cta: string;
}

async function buildAuditReportData(env: Record<string, string>, lead: any): Promise<AuditReportData> {
  const prompt = `You are a senior digital marketing consultant writing a compelling, specific SEO/AEO audit for ${lead.companyName}, a ${lead.niche || "local"} business in ${lead.location || "N/A"}. Their website: ${lead.website || "no website found"}.
Return JSON matching exactly this schema:
{
  "headline": "a punchy 8-12 word headline naming the biggest opportunity",
  "overallImpression": "2-3 sentences summarizing their current online presence, specific and non-generic",
  "criticalIssues": ["5 specific, punchy issue statements — each naming a concrete, believable problem (e.g. missing schema markup, slow mobile load, no Google Business reviews strategy, weak local keyword targeting, thin service pages) — not vague filler"],
  "quickWins": ["3 specific, concrete quick wins they could see results from within 30 days"],
  "closingPitch": "2 sentences making a confident, non-pushy case for booking a strategy call"
}`;
  const data = await generateStructuredContent<AuditReportData>(env, prompt);
  if (data && Array.isArray(data.criticalIssues) && Array.isArray(data.quickWins)) return data;
  // Fallback keeps the page non-empty even if every AI provider is down/unparseable.
  return {
    headline: `Growth Opportunities for ${lead.companyName}`,
    overallImpression: "A full audit is pending — check back shortly, or contact us to accelerate this report.",
    criticalIssues: [],
    quickWins: [],
    closingPitch: "Book a free strategy call to see the full breakdown.",
  };
}

async function buildWebsitePreviewData(env: Record<string, string>, lead: any): Promise<WebsitePreviewData> {
  const prompt = `You are an elite copywriter building a high-converting landing page preview for ${lead.companyName}, a ${lead.niche || "local"} business in ${lead.location || "N/A"}. This preview is used as a sales asset to win them as a client — it must look and read like a real, polished, professional website, not generic filler.
Return JSON matching exactly this schema:
{
  "heroHeadline": "a punchy, specific 6-10 word hero headline (not generic — reference their actual niche/location)",
  "heroSubheadline": "a compelling 15-25 word subheadline that builds credibility and urgency",
  "pillars": [{"title": "3-4 word title", "description": "one specific, benefit-driven sentence"} — exactly 3 of these, each a distinct service/value pillar relevant to their niche],
  "cta": "a punchy 2-5 word call to action button label"
}`;
  const data = await generateStructuredContent<WebsitePreviewData>(env, prompt);
  if (data && Array.isArray(data.pillars) && data.pillars.length > 0) return data;
  return {
    heroHeadline: `${lead.companyName} — Built to Grow`,
    heroSubheadline: "A modern, high-converting web presence tailored to your business.",
    pillars: [],
    cta: "Get Started",
  };
}

async function runFullPipeline(blink: any, updateRun: Function, env: Record<string, string>, mapsKey: string, niche: string, location: string, growthPackagePrice: number, hasEmailProvider: boolean) {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  // Stage 1: Discovery (Maps → AI fallback)
  await updateRun("running", 8, `Stage 1: Searching "${niche}" in "${location}"...`);
  let places = await discoverLeadsFromMaps(mapsKey, niche, location, 5);
  let source = "Google Maps API";
  if (places.length === 0) {
    await updateRun("running", 12, `Maps unavailable. Using AI discovery for "${niche}" in "${location}"...`);
    places = await discoverLeadsViaAI(env, niche, location, 5);
    source = "AI Discovery";
  }
  if (places.length === 0) { await updateRun("failed", 0, `No leads found for "${niche}" in "${location}". Try a broader query.`); return; }
  const newLeads: any[] = [];
  for (const place of places) {
    const existing = await blink.db.leads.list({ where: { companyName: place.companyName }, limit: 1 }) as any[];
    if (existing.length > 0) continue;
    const { overallScore } = scoreLeadFromPresence(place);
    const id = crypto.randomUUID();
    const dataSource = source === "Google Maps API" ? "google_maps" : "ai_estimated";
    await blink.db.leads.create({ id, companyName: place.companyName, website: place.website || "", phone: place.phone || "", contactEmail: "", contactName: "", source, dataSource, niche, location: place.address || location, status: "new", leadScore: overallScore, consentObtained: 0 });
    newLeads.push({ ...place, id, leadScore: overallScore });
  }
  if (newLeads.length === 0) { await updateRun("success", 100, `All ${places.length} businesses already in pipeline. No new leads.`); return; }
  await updateRun("running", 22, `Discovered ${newLeads.length} new leads. Scoring...`);
  // Stage 2: Scoring
  for (const lead of newLeads) {
    const { overallScore, conversionLikelihood, issues } = scoreLeadFromPresence(lead);
    await blink.db.leadScores.create({ id: crypto.randomUUID(), leadId: lead.id, overallScore, conversionLikelihood, issuesJson: JSON.stringify(issues), potentialServicesValue: growthPackagePrice });
    await blink.db.leads.update(lead.id, { status: "scored", leadScore: overallScore });
  }
  await updateRun("running", 42, "Stage 3: Generating AI audit reports & website previews...");
  // Stage 3: Assets — same structured generators as the standalone Asset
  // Generation agent, so Full Pipeline output looks identical (real, sellable
  // pages, not a bare paragraph of text).
  for (const lead of newLeads) {
    const audit = JSON.stringify(await buildAuditReportData(env, { ...lead, location: lead.address || location, niche }));
    await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "audit_report", hostedUrl: `${BACKEND_URL}/preview/audit/${lead.id}`, content: audit });
    const site = JSON.stringify(await buildWebsitePreviewData(env, { ...lead, location: lead.address || location, niche }));
    await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "custom_website", hostedUrl: `${BACKEND_URL}/preview/site/${lead.id}`, content: site });
    await blink.db.leads.update(lead.id, { status: "audited" });
  }
  await updateRun("running", 68, "Stage 4: Creating outreach sequences (consented leads only)...");
  // Stage 4: Outreach — freshly discovered leads default to consentObtained: 0, so
  // this stage only sends for leads a human has already verified via the Leads page.
  // Un-consented leads stay at "audited" so they show up for manual review/verification.
  let outreachSent = 0, outreachSkipped = 0;
  for (const lead of newLeads) {
    const freshLead = (await blink.db.leads.list({ where: { id: lead.id }, limit: 1 }) as any[])[0];
    if (!freshLead?.consentObtained) { outreachSkipped++; continue; }
    const seqId = crypto.randomUUID();
    const emailBody = await generateAIContent(env, `Write a 4-sentence cold outreach email for ${lead.companyName} (${niche} in ${lead.address || location}). Mention you built them a preview website, reference SEO gaps, offer no-pressure view, end with yes/no question. Conversational.`);
    await blink.db.outreachSequences.create({ id: seqId, leadId: lead.id, step: 1, status: "sent", emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString(), lastEmailBody: emailBody });
    await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(), sequenceId: seqId, leadId: lead.id, step: 1, eventType: "sent", metadata: JSON.stringify({ automated: true }) });
    if (freshLead.contactEmail && hasEmailProvider) {
      await sendEmail(env, freshLead.contactEmail, `Preview site ready for ${lead.companyName}`, buildOutreachEmail(freshLead.contactName, lead.companyName, emailBody));
    }
    await blink.db.leads.update(lead.id, { status: "outreach_sent" });
    outreachSent++;
  }
  await updateRun("running", 85, "Stage 5: Qualifying Agent reviewing...");
  // Stage 5: Qualify high-scorers
  let qualified = 0;
  for (const lead of newLeads) {
    if ((lead.leadScore || 0) >= 60) { await blink.db.leads.update(lead.id, { status: "qualified" }); qualified++; }
  }
  await updateRun("success", 100, `Full pipeline: ${newLeads.length} discovered → scored → AI-audited → ${outreachSent} outreach sent (${outreachSkipped} awaiting verification) → ${qualified} auto-qualified. Niche: "${niche}", Location: "${location}".`);
}
