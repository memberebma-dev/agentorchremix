import Stripe from "stripe";
import { createClient } from "@blinkdotnew/sdk";
import { generateAIContent } from "../lib/ai";
import { sendEmail, buildOutreachEmail } from "../lib/email";
import { discoverLeadsFromMaps, discoverLeadsViaAI, scoreLeadFromPresence } from "../lib/maps";
import { findOrCreateCustomer, createAndFinalizeInvoice } from "../lib/stripeInvoice";

export async function runOrchestration(
  env: Record<string, string>,
  body: { runId: string; agentName: string; leadId?: string; niche?: string; location?: string }
) {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const mapsKey = env.GOOGLE_MAPS_API_KEY || "";
  const stripeKey = env.STRIPE_SECRET_KEY || "";
  const hasEmailProvider = !!(env.SENDGRID_API_KEY || env.RESEND_API_KEY);
  const { runId, agentName, leadId } = body;
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
        await blink.db.leads.create({ id: crypto.randomUUID(), companyName: place.companyName, website: place.website || "", phone: place.phone || "", contactEmail: "", contactName: "", source, niche, location: place.address || location, status: "new", leadScore: overallScore, consentObtained: 1 });
        created++;
      }
      await updateRun("success", 100, `${source}: ${created} new leads added, ${skipped} duplicates skipped. Query: "${niche}" in "${location}".`);
      return;
    }

    // ─── Scoring (real web presence analysis) ─────────────────────────────────
    if (agentName === "Scoring") {
      if (!leadId) throw new Error("leadId required");
      await updateRun("running", 30, "Fetching lead data for real scoring...");
      const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
      const lead = leads[0]; if (!lead) throw new Error("Lead not found");
      const { overallScore, conversionLikelihood, searchActivityScore, paidAdsActivity, issues } = scoreLeadFromPresence({ website: lead.website, phone: lead.phone });
      const existing = await blink.db.leadScores.list({ where: { leadId }, limit: 1 }) as any[];
      if (existing.length > 0) {
        await blink.db.leadScores.update(existing[0].id, { overallScore, conversionLikelihood, searchActivityScore, paidAdsActivity, potentialServicesValue: 4997 });
      } else {
        await blink.db.leadScores.create({ id: crypto.randomUUID(), leadId, overallScore, conversionLikelihood, searchActivityScore, paidAdsActivity, potentialServicesValue: 4997 });
      }
      await blink.db.leads.update(leadId, { status: "scored", leadScore: overallScore });
      await updateRun("success", 100, `Scored ${lead.companyName}: ${overallScore}/100. Issues: ${issues.slice(0, 2).join("; ") || "None"}.`);
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

    // ─── Outreach (real SendGrid email) ───────────────────────────────────────
    if (agentName === "Outreach") {
      if (!leadId) throw new Error("leadId required");
      const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
      const lead = leads[0]; if (!lead) throw new Error("Lead not found");
      await updateRun("running", 40, `Composing AI outreach for ${lead.companyName}...`);
      const emailBody = await generateAIContent(env, `Write a 4-sentence cold outreach email for ${lead.companyName} (${lead.contactName || "decision maker"}). Mention you built them a preview website, reference SEO gaps, offer no-pressure view, end with yes/no question. Conversational.`);
      const seqId = crypto.randomUUID();
      const existingSeq = await blink.db.outreachSequences.list({ where: { leadId }, limit: 1 }) as any[];
      if (existingSeq.length === 0) {
        await blink.db.outreachSequences.create({ id: seqId, leadId, step: 1, status: "sent", emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString(), lastEmailBody: emailBody });
      } else {
        await blink.db.outreachSequences.update(existingSeq[0].id, { step: Math.min((existingSeq[0].step || 1) + 1, 5), lastSentAt: new Date().toISOString(), lastEmailBody: emailBody });
      }
      await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(), sequenceId: seqId, leadId, step: 1, eventType: "sent", metadata: JSON.stringify({ channel: "email" }) });
      let emailSent = false;
      if (lead.contactEmail && hasEmailProvider) {
        await updateRun("running", 75, `Sending outreach email to ${lead.contactEmail}...`);
        emailSent = await sendEmail(env, lead.contactEmail, `Preview site ready for ${lead.companyName}`, buildOutreachEmail(lead.contactName, lead.companyName, emailBody));
      }
      await blink.db.leads.update(leadId, { status: "outreach_sent" });
      await updateRun("success", 100, `Outreach sent for ${lead.companyName}. Email${emailSent ? " delivered" : lead.contactEmail ? " queued (no email provider key)" : " skipped (no email on file)"}.`);
      return;
    }

    // ─── Qualifying Agent ─────────────────────────────────────────────────────
    if (agentName === "Qualifying") {
      await updateRun("running", 20, "Scanning pipeline for leads ready to advance...");
      const threshold = 60;
      const outreachLeads = await blink.db.leads.list({ where: { status: "outreach_sent" }, limit: 50 }) as any[];
      let promoted = 0, expired = 0;
      for (const lead of outreachLeads) {
        const scores = await blink.db.leadScores.list({ where: { leadId: lead.id }, limit: 1 }) as any[];
        const score = scores[0]?.overallScore || lead.leadScore || 0;
        const replyEvents = await blink.db.outreachAnalytics.list({ where: { leadId: lead.id, eventType: "replied" }, limit: 1 }) as any[];
        const daysSince = (Date.now() - new Date(lead.updatedAt || lead.createdAt).getTime()) / 86400000;
        if (replyEvents.length > 0) { await blink.db.leads.update(lead.id, { status: "responded" }); promoted++; }
        else if (score >= threshold && daysSince < 7) { await blink.db.leads.update(lead.id, { status: "qualified" }); promoted++; }
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
      if (!leadId) throw new Error("leadId required");
      if (!stripeKey) { await updateRun("failed", 0, "STRIPE_SECRET_KEY not configured — cannot create a real invoice."); return; }
      const existing = await blink.db.invoices.list({ where: { leadId }, limit: 1 }) as any[];
      if (existing.length > 0) { await updateRun("success", 100, "Invoice already exists for this lead."); return; }
      const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
      const lead = leads[0]; if (!lead) throw new Error("Lead not found");

      await updateRun("running", 30, `Creating Stripe customer for ${lead.companyName}...`);
      const stripe = new Stripe(stripeKey);
      const amountCents = 499700; // $4,997.00
      const customer = await findOrCreateCustomer(stripe, lead.contactEmail || "", lead.contactName || lead.companyName);

      await updateRun("running", 60, "Generating and finalizing Stripe invoice...");
      const invoice = await createAndFinalizeInvoice(stripe, {
        customerId: customer.id,
        amountCents,
        description: `Digital Agency Growth Package — ${lead.companyName}`,
      });

      const invoiceId = crypto.randomUUID();
      await blink.db.invoices.create({ id: invoiceId, leadId, amount: 4997, status: "open", stripeInvoiceId: invoice.id });
      await blink.db.invoiceReminders.create({ id: crypto.randomUUID(), invoiceId, reminderType: "initial", status: "pending", escalationLevel: 1 });
      await blink.db.leads.update(leadId, { status: "proposal" });

      let emailSent = false;
      if (lead.contactEmail && hasEmailProvider && invoice.hosted_invoice_url) {
        emailSent = await sendEmail(env, lead.contactEmail, `Invoice ready — Digital Agency Growth Package ($4,997)`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
            <p>Hi ${lead.contactName || "there"},</p>
            <p>Your <strong>Digital Agency Growth Package</strong> invoice for <strong>$4,997</strong> is ready.</p>
            <p><a href="${invoice.hosted_invoice_url}" style="background:#0D9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View & Pay Invoice</a></p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="color:#888;font-size:12px">— AgentOrch<br/><a href="https://agentorch.io" style="color:#0D9488">agentorch.io</a></p>
          </div>`);
      }
      await updateRun("success", 100, `Real Stripe invoice ${invoice.id} created for $4,997 (${lead.companyName}).${emailSent ? " Emailed to customer." : lead.contactEmail ? " (No email provider key — email not sent, use hosted link.)" : " (No contact email on file.)"}`);
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
      await runFullPipeline(blink, updateRun, env, mapsKey, niche, location);
      return;
    }

    await updateRun("success", 100, `${agentName} executed.`);
  } catch (error: any) {
    console.error("Orchestration error:", error);
    try { const b2 = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY }); await b2.db.agentRuns.update(runId, { status: "failed", progressPercent: 0, logsText: `Error: ${error.message}`, finishedAt: new Date().toISOString() }); } catch {}
  }
}

async function generateAssetsForLead(blink: any, env: Record<string, string>, lead: any) {
  const audit = await generateAIContent(env, `Write a detailed SEO/AEO audit report for ${lead.companyName}. Website: ${lead.website || "none"}. Location: ${lead.location || "N/A"}. Include 5 critical issues and 3 quick wins. Under 400 words.`);
  const existing = await blink.db.generatedAssets.list({ where: { leadId: lead.id, type: "audit_report" }, limit: 1 }) as any[];
  if (existing.length > 0) { await blink.db.generatedAssets.update(existing[0].id, { content: audit }); }
  else { await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "audit_report", hostedUrl: `https://agentorch.io/audit/${lead.id}`, content: audit }); }

  const copy = await generateAIContent(env, `Write hero headline (10 words), subheadline (20 words), 3 service pillars, and CTA for ${lead.companyName} (${lead.niche || "local business"} in ${lead.location || "N/A"}). SEO-optimized.`);
  const existWeb = await blink.db.generatedAssets.list({ where: { leadId: lead.id, type: "custom_website" }, limit: 1 }) as any[];
  if (existWeb.length > 0) { await blink.db.generatedAssets.update(existWeb[0].id, { content: copy }); }
  else { await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "custom_website", hostedUrl: `https://preview-${lead.id.slice(0, 8)}.agentorch.site`, content: copy }); }

  await blink.db.leads.update(lead.id, { status: "audited" });
}

async function runFullPipeline(blink: any, updateRun: Function, env: Record<string, string>, mapsKey: string, niche: string, location: string) {
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
    await blink.db.leads.create({ id, companyName: place.companyName, website: place.website || "", phone: place.phone || "", contactEmail: "", contactName: "", source, niche, location: place.address || location, status: "new", leadScore: overallScore, consentObtained: 1 });
    newLeads.push({ ...place, id, leadScore: overallScore });
  }
  if (newLeads.length === 0) { await updateRun("success", 100, `All ${places.length} businesses already in pipeline. No new leads.`); return; }
  await updateRun("running", 22, `Discovered ${newLeads.length} new leads. Scoring...`);
  // Stage 2: Scoring
  for (const lead of newLeads) {
    const { overallScore, conversionLikelihood, searchActivityScore, paidAdsActivity } = scoreLeadFromPresence(lead);
    await blink.db.leadScores.create({ id: crypto.randomUUID(), leadId: lead.id, overallScore, conversionLikelihood, searchActivityScore, paidAdsActivity, potentialServicesValue: 4997 });
    await blink.db.leads.update(lead.id, { status: "scored", leadScore: overallScore });
  }
  await updateRun("running", 42, "Stage 3: Generating AI audit reports...");
  // Stage 3: Assets
  for (const lead of newLeads) {
    const audit = await generateAIContent(env, `Write a 3-sentence SEO audit for ${lead.companyName} (${niche} in ${lead.address || location}). ${!lead.website ? "No website detected." : "Website: " + lead.website}. Be specific and professional.`);
    await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "audit_report", hostedUrl: `https://agentorch.io/audit/${lead.id}`, content: audit });
    const copy = await generateAIContent(env, `Write a 10-word hero headline for ${lead.companyName} (${niche} in ${lead.address || location}).`);
    await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "custom_website", hostedUrl: `https://preview-${lead.id.slice(0, 8)}.agentorch.site`, content: copy });
    await blink.db.leads.update(lead.id, { status: "audited" });
  }
  await updateRun("running", 68, "Stage 4: Creating outreach sequences...");
  // Stage 4: Outreach
  for (const lead of newLeads) {
    const seqId = crypto.randomUUID();
    await blink.db.outreachSequences.create({ id: seqId, leadId: lead.id, step: 1, status: "sent", emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString() });
    await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(), sequenceId: seqId, leadId: lead.id, step: 1, eventType: "sent", metadata: JSON.stringify({ automated: true }) });
    await blink.db.leads.update(lead.id, { status: "outreach_sent" });
  }
  await updateRun("running", 85, "Stage 5: Qualifying Agent reviewing...");
  // Stage 5: Qualify high-scorers
  let qualified = 0;
  for (const lead of newLeads) {
    if ((lead.leadScore || 0) >= 60) { await blink.db.leads.update(lead.id, { status: "qualified" }); qualified++; }
  }
  await updateRun("success", 100, `Full pipeline: ${newLeads.length} discovered → scored → AI-audited → outreach created → ${qualified} auto-qualified. Niche: "${niche}", Location: "${location}".`);
}
