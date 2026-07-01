// SendGrid email utilities

export async function sendEmail(
  sgKey: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!sgKey || !to) return false;
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sgKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "pipeline@agentorch.io", name: "AgentOrch" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    return res.status === 202;
  } catch (e) {
    console.error("SendGrid error:", e);
    return false;
  }
}

export function buildOutreachEmail(
  contactName: string,
  companyName: string,
  emailBody: string
): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
  <p>Hi ${contactName || "there"},</p>
  ${emailBody.split("\n").filter(l => l.trim()).map(p => `<p>${p}</p>`).join("")}
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
  <p style="color:#888;font-size:12px">— AgentOrch Acquisition Engine<br/><a href="https://agentorch.io" style="color:#0D9488">agentorch.io</a></p>
</div>`;
}

export function buildReminderHtml(
  contactName: string,
  amount: number,
  level: number
): string {
  const intros: Record<number, string> = {
    1: `Your invoice for the <strong>Digital Agency Growth Package</strong> ($${amount.toLocaleString()}) is ready.`,
    2: `A friendly follow-up on your outstanding invoice of <strong>$${amount.toLocaleString()}</strong>. Services are on hold pending payment.`,
    3: `<strong>Final Notice:</strong> Invoice of <strong>$${amount.toLocaleString()}</strong> is overdue. Pay within 24h or your slot will be reassigned.`,
  };
  return `<div style="font-family:Arial,sans-serif;max-width:600px;color:#333;line-height:1.6">
  <p>Hi ${contactName || "there"},</p>
  <p>${intros[level] || intros[1]}</p>
  <p>Questions? Reply to this email — we're here to help.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
  <p style="color:#888;font-size:12px">— AgentOrch<br/><a href="https://agentorch.io" style="color:#0D9488">agentorch.io</a></p>
</div>`;
}
