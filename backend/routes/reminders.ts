import { Hono } from "hono";
import { createClient } from "@blinkdotnew/sdk";
import { sendEmail } from "../lib/email";

const remindersApp = new Hono<{ Bindings: Record<string, string> }>();

remindersApp.post("/run", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const sgKey = env.SENDGRID_API_KEY || "";

  try {
    const openInvoices = await blink.db.invoices.list({ where: { status: "open" } }) as any[];
    let processed = 0; let emailsSent = 0;

    for (const inv of openInvoices) {
      const existing = await blink.db.invoiceReminders.list({ where: { invoiceId: inv.id } }) as any[];
      const ageHours = (Date.now() - new Date(inv.createdAt).getTime()) / 3600000;
      let level = 1; let reminderType = "initial";
      if (ageHours > 168) { level = 3; reminderType = "final_notice"; }
      else if (ageHours > 72) { level = 2; reminderType = "follow_up"; }
      const alreadySentAtLevel = existing.some((r: any) => r.escalationLevel === level && r.status === "sent");
      if (alreadySentAtLevel) continue;

      const reminderId = crypto.randomUUID();
      await blink.db.invoiceReminders.create({ id: reminderId, invoiceId: inv.id, reminderType, status: "pending", escalationLevel: level });

      const leads = await blink.db.leads.list({ where: { id: inv.leadId }, limit: 1 }) as any[];
      const lead = leads[0];
      if (lead?.contactEmail && sgKey) {
        const subjects: Record<number, string> = {
          1: `Invoice ready — ${Number(inv.amount).toLocaleString()} | ${lead.companyName}`,
          2: `Follow-up: Outstanding invoice for ${lead.companyName}`,
          3: `⚠️ Final Notice: Overdue invoice — action required`,
        };
        const bodies: Record<number, string> = {
          1: `<p>Hi ${lead.contactName || "there"},</p><p>Your <strong>Digital Agency Growth Package</strong> invoice of <strong>${Number(inv.amount).toLocaleString()}</strong> is ready.</p>`,
          2: `<p>Hi ${lead.contactName || "there"},</p><p>Follow-up on your outstanding invoice of <strong>${Number(inv.amount).toLocaleString()}</strong>. Services on hold pending payment.</p>`,
          3: `<p>Hi ${lead.contactName || "there"},</p><p><strong>Final Notice:</strong> Invoice of <strong>${Number(inv.amount).toLocaleString()}</strong> is overdue. Pay within 24h or slot reassigned.</p>`,
        };
        const sent = await sendEmail(sgKey, lead.contactEmail, subjects[level] || subjects[1], bodies[level] || bodies[1]);
        await blink.db.invoiceReminders.update(reminderId, { status: sent ? "sent" : "failed", sentAt: new Date().toISOString() });
        if (sent) emailsSent++;
      }
      processed++;
    }
    return c.json({ success: true, processed, emailsSent, message: `Processed ${processed} reminders, ${emailsSent} emails sent.` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

remindersApp.get("/", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const reminders = await blink.db.invoiceReminders.list({ orderBy: { createdAt: "desc" }, limit: 100 });
    return c.json(reminders);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default remindersApp;
