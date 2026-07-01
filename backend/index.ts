import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@blinkdotnew/sdk";
import { runOrchestration } from "./routes/orchestrator";
import analyticsApp from "./routes/analytics";
import affiliatesApp from "./routes/affiliates";
import remindersApp from "./routes/reminders";

const app = new Hono<{ Bindings: Record<string, string> }>();
app.use("*", cors());

// ─── Orchestrator ─────────────────────────────────────────────────────────────
app.all("/orchestrator", async (c) => {
  const body = await c.req.json();
  c.executionCtx.waitUntil(
    runOrchestration(c.env as Record<string, string>, body).catch(console.error)
  );
  return c.json({ success: true, message: "Pipeline started" });
});

// ─── Smart Follow-up ──────────────────────────────────────────────────────────
app.post("/smart-followup", async (c) => {
  const env = c.env as Record<string, string>;
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });

  try {
    const sequences = await blink.db.outreachSequences.list({ where: { status: "sent" }, limit: 50 }) as any[];
    let advanced = 0;

    for (const seq of sequences) {
      if (seq.step >= 5) continue;
      const hoursAgo = (Date.now() - new Date(seq.lastSentAt || seq.createdAt).getTime()) / 3600000;
      if (hoursAgo < 24) continue;

      const scores = await blink.db.leadScores.list({ where: { leadId: seq.leadId }, limit: 1 }) as any[];
      const score = scores[0]?.overallScore || 50;

      if (score >= 60) {
        const nextStep = seq.step + 1;
        await blink.db.outreachSequences.update(seq.id, { step: nextStep, lastSentAt: new Date().toISOString() });
        await blink.db.outreachAnalytics.create({
          id: crypto.randomUUID(), sequenceId: seq.id, leadId: seq.leadId,
          step: nextStep, eventType: "sent",
          metadata: JSON.stringify({ followUp: true, score }),
        });
        advanced++;
      } else {
        await blink.db.outreachSequences.update(seq.id, { status: "dead" });
      }
    }

    return c.json({ success: true, advanced, message: `Advanced ${advanced} high-score sequences.` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── Sub-routes ───────────────────────────────────────────────────────────────
app.route("/analytics", analyticsApp);
app.route("/affiliates", affiliatesApp);
app.route("/reminders", remindersApp);

import stripeApp from "./stripe";
app.route("/stripe", stripeApp);

export default app;
