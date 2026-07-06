import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@blinkdotnew/sdk";
import { runOrchestration } from "./routes/orchestrator";
import { generateAIContent } from "./lib/ai";
import { sendEmail, buildOutreachEmail } from "./lib/email";
import analyticsApp from "./routes/analytics";
import affiliatesApp from "./routes/affiliates";
import remindersApp from "./routes/reminders";
import emailWebhookApp from "./routes/emailWebhook";
import previewApp from "./routes/preview";

const app = new Hono<{ Bindings: Record<string, string> }>();
app.use("*", cors());

// ─── Orchestrator ─────────────────────────────────────────────────────────────
app.all("/orchestrator", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch (e: any) {
    return c.json({ success: false, error: `Invalid request body: ${e.message}` }, 400);
  }

  const run = runOrchestration(c.env as Record<string, string>, body).catch(console.error);
  // waitUntil keeps the run alive past this response on runtimes that support it.
  // Guard it — if executionCtx isn't populated by the host runtime, don't let that
  // throw and fail the whole request; the promise still runs regardless.
  try {
    c.executionCtx?.waitUntil(run);
  } catch (e) {
    console.error("waitUntil unavailable:", e);
  }
  return c.json({ success: true, message: "Pipeline started" });
});

// ─── Smart Follow-up ──────────────────────────────────────────────────────────
app.post("/smart-followup", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const body = await c.req.json().catch(() => ({} as any));
  const windowHours = Number(body?.windowHours) > 0 ? Number(body.windowHours) : 24;
  const threshold = Number.isFinite(body?.threshold) ? Number(body.threshold) : 60;

  const hasEmailProvider = !!(env.SENDGRID_API_KEY || env.RESEND_API_KEY);

  try {
    const sequences = await blink.db.outreachSequences.list({ where: { status: "sent" }, limit: 50 }) as any[];
    let advanced = 0, emailed = 0;

    for (const seq of sequences) {
      if (seq.step >= 5) continue;
      const hoursAgo = (Date.now() - new Date(seq.lastSentAt || seq.createdAt).getTime()) / 3600000;
      if (hoursAgo < windowHours) continue;

      const scores = await blink.db.leadScores.list({ where: { leadId: seq.leadId }, limit: 1 }) as any[];
      const score = scores[0]?.overallScore || 50;

      if (score >= threshold) {
        const leads = await blink.db.leads.list({ where: { id: seq.leadId }, limit: 1 }) as any[];
        const lead = leads[0];
        if (!lead || !lead.consentObtained) { continue; } // never auto-email unverified leads
        const nextStep = seq.step + 1;
        const followUpBody = await generateAIContent(env, `Write a short (3-sentence) polite follow-up cold email, step ${nextStep} of 5, for ${lead.companyName} (${lead.contactName || "decision maker"}). Reference the earlier outreach about their preview website/SEO gaps without repeating it verbatim. End with a low-pressure yes/no question.`);
        await blink.db.outreachSequences.update(seq.id, { step: nextStep, lastSentAt: new Date().toISOString(), lastEmailBody: followUpBody });
        let emailSent = false;
        if (lead.contactEmail && hasEmailProvider) {
          emailSent = await sendEmail(env, lead.contactEmail, `Following up — ${lead.companyName}`, buildOutreachEmail(lead.contactName, lead.companyName, followUpBody));
          if (emailSent) emailed++;
        }
        await blink.db.outreachAnalytics.create({
          id: crypto.randomUUID(), sequenceId: seq.id, leadId: seq.leadId,
          step: nextStep, eventType: "sent",
          metadata: JSON.stringify({ followUp: true, score, emailSent }),
        });
        advanced++;
      } else {
        await blink.db.outreachSequences.update(seq.id, { status: "dead" });
      }
    }

    return c.json({ success: true, advanced, emailed, message: `Advanced ${advanced} high-score sequences, ${emailed} real follow-up emails sent.` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── Sub-routes ───────────────────────────────────────────────────────────────
app.route("/analytics", analyticsApp);
app.route("/affiliates", affiliatesApp);
app.route("/reminders", remindersApp);
app.route("/webhooks/email", emailWebhookApp);
app.route("/preview", previewApp);

import stripeApp from "./stripe";
app.route("/stripe", stripeApp);

export default app;
