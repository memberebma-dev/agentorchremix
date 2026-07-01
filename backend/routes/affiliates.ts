import { Hono } from "hono";
import { createClient } from "@blinkdotnew/sdk";

const affiliatesApp = new Hono<{ Bindings: Record<string, string> }>();

affiliatesApp.get("/", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const affiliates = await blink.db.affiliates.list({ orderBy: { createdAt: "desc" }, limit: 100 });
    return c.json(affiliates);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

affiliatesApp.post("/", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const body = await c.req.json();
    const slug = (body.name || "aff").toLowerCase().replace(/[^a-z0-9]/g, "");
    const code = `${slug}${Math.random().toString(36).slice(2, 6)}`;
    const affiliate = await blink.db.affiliates.create({
      id: crypto.randomUUID(), name: body.name, email: body.email,
      referralCode: code, commissionRate: Number(body.commissionRate) || 20.0,
      totalReferrals: 0, totalEarned: 0, status: "active",
    });
    return c.json(affiliate, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

affiliatesApp.delete("/:id", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    await blink.db.affiliates.update(c.req.param("id"), { status: "inactive" });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

affiliatesApp.post("/track", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const body = await c.req.json();
    const { referralCode, leadId, invoiceId, amount } = body;
    const affiliates = await blink.db.affiliates.list({ where: { referralCode }, limit: 1 }) as any[];
    if (!affiliates.length) return c.json({ error: "Affiliate not found" }, 404);
    const affiliate = affiliates[0];
    const commissionAmount = (Number(amount) * affiliate.commissionRate) / 100;
    await blink.db.affiliateReferrals.create({ id: crypto.randomUUID(), affiliateId: affiliate.id,
      leadId, invoiceId, commissionAmount, status: "pending" });
    await blink.db.affiliates.update(affiliate.id, {
      totalReferrals: (affiliate.totalReferrals || 0) + 1,
      totalEarned: (Number(affiliate.totalEarned) || 0) + commissionAmount,
    });
    return c.json({ success: true, commissionAmount });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default affiliatesApp;
