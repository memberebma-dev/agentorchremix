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

affiliatesApp.patch("/:id/deactivate", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    await blink.db.affiliates.update(c.req.param("id"), { status: "inactive" });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

affiliatesApp.delete("/:id", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const id = c.req.param("id");
  try {
    const referrals = (await blink.db.affiliateReferrals.list({ where: { affiliateId: id }, limit: 500 })) as any[];
    for (const r of referrals) {
      await blink.db.affiliateReferrals.delete(r.id);
    }
    await blink.db.affiliates.delete(id);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

/**
 * Records a conversion against an affiliate's referral code and credits their commission.
 * Shared by the public /track endpoint and the Stripe invoice.paid webhook, so a real
 * payment automatically credits the affiliate who's referralCode is stored on the lead —
 * no manual /track call needed once a lead is tagged with a referralCode.
 */
export async function trackAffiliateConversion(
  blink: any,
  params: { referralCode: string; leadId?: string; invoiceId?: string; amount: number }
): Promise<{ success: boolean; commissionAmount?: number; error?: string }> {
  const { referralCode, leadId, invoiceId, amount } = params;
  if (!referralCode) return { success: false, error: "No referral code" };
  // Idempotency guard: Stripe fires invoice.paid AND invoice.payment_succeeded for the
  // same payment (and can redeliver either on retry). Without this check, concurrent or
  // duplicate webhook deliveries would double-credit the affiliate for one real payment.
  if (invoiceId) {
    const alreadyTracked = (await blink.db.affiliateReferrals.list({ where: { invoiceId }, limit: 1 })) as any[];
    if (alreadyTracked.length > 0) return { success: true, commissionAmount: alreadyTracked[0].commissionAmount };
  }
  const affiliates = (await blink.db.affiliates.list({ where: { referralCode }, limit: 1 })) as any[];
  if (!affiliates.length) return { success: false, error: "Affiliate not found" };
  const affiliate = affiliates[0];
  const commissionAmount = (Number(amount) * affiliate.commissionRate) / 100;
  await blink.db.affiliateReferrals.create({
    id: crypto.randomUUID(), affiliateId: affiliate.id,
    leadId, invoiceId, commissionAmount, status: "pending",
  });
  await blink.db.affiliates.update(affiliate.id, {
    totalReferrals: (affiliate.totalReferrals || 0) + 1,
    totalEarned: (Number(affiliate.totalEarned) || 0) + commissionAmount,
  });
  return { success: true, commissionAmount };
}

affiliatesApp.post("/track", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  try {
    const body = await c.req.json();
    const result = await trackAffiliateConversion(blink, body);
    if (!result.success) return c.json({ error: result.error }, 404);
    return c.json({ success: true, commissionAmount: result.commissionAmount });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default affiliatesApp;
