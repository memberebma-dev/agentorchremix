import { Hono } from "hono";
import { createClient } from "@blinkdotnew/sdk";

const emailWebhookApp = new Hono<{ Bindings: Record<string, string> }>();

// SendGrid Event Webhook -> real outreach engagement tracking (opens/clicks/bounces).
// Configure in SendGrid: Settings > Mail Settings > Event Webhook, HTTP POST URL = <backend>/webhooks/email/sendgrid
const SENDGRID_EVENT_MAP: Record<string, string> = {
  open: "opened",
  click: "clicked",
  bounce: "bounced",
  dropped: "dropped",
  spamreport: "spam_report",
  unsubscribe: "unsubscribed",
};

emailWebhookApp.post("/sendgrid", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const events = (await c.req.json()) as any[];
    let recorded = 0;
    for (const event of Array.isArray(events) ? events : []) {
      const mapped = SENDGRID_EVENT_MAP[event.event];
      if (!mapped || !event.email) continue;
      const leads = (await blink.db.leads.list({ where: { contactEmail: event.email }, limit: 1 })) as any[];
      const lead = leads[0];
      if (!lead) continue;
      const seqs = (await blink.db.outreachSequences.list({ where: { leadId: lead.id }, limit: 1 })) as any[];
      const seq = seqs[0];
      await blink.db.outreachAnalytics.create({
        id: crypto.randomUUID(),
        sequenceId: seq?.id || "",
        leadId: lead.id,
        step: seq?.step || 1,
        eventType: mapped,
        metadata: JSON.stringify({ source: "sendgrid", raw: event.event }),
      });
      recorded++;
    }
    return c.json({ received: true, recorded });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Resend webhook -> same engagement tracking, for accounts using Resend as the email fallback.
// Configure in Resend: Webhooks, endpoint = <backend>/webhooks/email/resend
const RESEND_EVENT_MAP: Record<string, string> = {
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "spam_report",
};

emailWebhookApp.post("/resend", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const body = (await c.req.json()) as any;
    const mapped = RESEND_EVENT_MAP[body.type];
    const email = body.data?.to?.[0];
    if (!mapped || !email) return c.json({ received: true, recorded: 0 });
    const leads = (await blink.db.leads.list({ where: { contactEmail: email }, limit: 1 })) as any[];
    const lead = leads[0];
    if (!lead) return c.json({ received: true, recorded: 0 });
    const seqs = (await blink.db.outreachSequences.list({ where: { leadId: lead.id }, limit: 1 })) as any[];
    const seq = seqs[0];
    await blink.db.outreachAnalytics.create({
      id: crypto.randomUUID(),
      sequenceId: seq?.id || "",
      leadId: lead.id,
      step: seq?.step || 1,
      eventType: mapped,
      metadata: JSON.stringify({ source: "resend", raw: body.type }),
    });
    return c.json({ received: true, recorded: 1 });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default emailWebhookApp;
