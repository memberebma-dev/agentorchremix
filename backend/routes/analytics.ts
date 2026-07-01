import { Hono } from "hono";
import { createClient } from "@blinkdotnew/sdk";

const analyticsApp = new Hono<{ Bindings: Record<string, string> }>();

analyticsApp.get("/", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

  try {
    const [totalLeads, totalOutreach, totalClients, paidInvoices, openInvoices, analyticsEvents, agentRuns] =
      await Promise.all([
        blink.db.leads.count(),
        blink.db.outreachSequences.count(),
        blink.db.leads.count({ where: { status: "client" } }),
        blink.db.invoices.list({ where: { status: "paid" } }),
        blink.db.invoices.list({ where: { status: "open" } }),
        blink.db.outreachAnalytics.list({ orderBy: { createdAt: "asc" }, limit: 500 }),
        blink.db.agentRuns.list({ orderBy: { startedAt: "desc" }, limit: 100 }),
      ]);

    const revenue = (paidInvoices as any[]).reduce((s, i) => s + Number(i.amount), 0);
    const pending = (openInvoices as any[]).reduce((s, i) => s + Number(i.amount), 0);
    const sentCount = (analyticsEvents as any[]).filter((e) => e.eventType === "sent").length;
    const openCount = (analyticsEvents as any[]).filter((e) => e.eventType === "opened").length;
    const repliedCount = (analyticsEvents as any[]).filter((e) => e.eventType === "replied").length;
    const successRuns = (agentRuns as any[]).filter((r) => r.status === "success").length;
    const totalRuns = (agentRuns as any[]).length;

    const now = Date.now();
    const dailyMap: Record<string, any> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[key] = { date: key, leads: 0, outreach: 0, revenue: 0 };
    }

    const allLeads = await blink.db.leads.list({ orderBy: { createdAt: "asc" }, limit: 500 });
    for (const lead of allLeads as any[]) {
      const key = new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyMap[key]) dailyMap[key].leads++;
    }
    const allSeqs = await blink.db.outreachSequences.list({ orderBy: { createdAt: "asc" }, limit: 500 });
    for (const seq of allSeqs as any[]) {
      const key = new Date(seq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyMap[key]) dailyMap[key].outreach++;
    }
    for (const inv of paidInvoices as any[]) {
      const key = new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyMap[key]) dailyMap[key].revenue += Number(inv.amount);
    }

    return c.json({
      summary: {
        totalLeads, totalOutreach, totalClients, revenue, pending,
        sentCount: sentCount || totalOutreach,
        openCount, repliedCount,
        openRate: (sentCount > 0 ? ((openCount / sentCount) * 100) : 0).toFixed(1),
        replyRate: (sentCount > 0 ? ((repliedCount / sentCount) * 100) : 0).toFixed(1),
        conversionRate: (totalLeads > 0 ? ((totalClients / totalLeads) * 100) : 0).toFixed(1),
        agentSuccessRate: (totalRuns > 0 ? ((successRuns / totalRuns) * 100) : 0).toFixed(1),
      },
      dailyData: Object.values(dailyMap),
      outreachFunnel: [
        { stage: "Sent", value: sentCount || totalOutreach },
        { stage: "Opened", value: openCount },
        { stage: "Replied", value: repliedCount },
        { stage: "Clients", value: totalClients },
      ],
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default analyticsApp;
