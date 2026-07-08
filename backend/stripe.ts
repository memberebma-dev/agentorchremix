import Stripe from 'stripe';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';
import { createAndFinalizeInvoice } from './lib/stripeInvoice';
import { trackAffiliateConversion } from './routes/affiliates';

const stripeApp = new Hono<{ Bindings: Record<string, string> }>();

const getStripe = (env: Record<string, string>) =>
  new Stripe(env.STRIPE_SECRET_KEY);

// Dedicated status check — separate from /products-with-prices, which depends
// on the account actually having Products configured AND the key having
// Products-read scope. balance.retrieve() only needs basic read access, which
// every valid secret/restricted key has, so this distinguishes "key missing"
// from "key set but invalid/insufficient permissions" from "genuinely connected."
stripeApp.get('/status', async (c) => {
  const env = c.env as Record<string, string>;
  const configured = !!env.STRIPE_SECRET_KEY;
  if (!configured) return c.json({ configured: false, verified: false, error: 'STRIPE_SECRET_KEY is not set on the backend.' });
  try {
    const stripe = getStripe(env);
    const balance = await stripe.balance.retrieve();
    return c.json({ configured: true, verified: true, livemode: balance.livemode });
  } catch (error: any) {
    return c.json({ configured: true, verified: false, error: error.message });
  }
});

stripeApp.get('/products-with-prices', async (c) => {
  try {
    const stripe = getStripe(c.env as Record<string, string>);
    const products = await stripe.products.list({ active: true });
    const prices = await stripe.prices.list({ active: true, limit: 100 });
    const productsWithPrices = products.data.map((product) => ({
      ...product,
      prices: prices.data.filter((p) => p.product === product.id),
    }));
    return c.json(productsWithPrices);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

stripeApp.post('/create-customer', async (c) => {
  try {
    const stripe = getStripe(c.env as Record<string, string>);
    const { email, name } = await c.req.json();
    const customer = await stripe.customers.create({ email, name });
    return c.json({ customerId: customer.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

stripeApp.post('/create-subscription', async (c) => {
  try {
    const stripe = getStripe(c.env as Record<string, string>);
    const { customerId, priceId } = await c.req.json();
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    const inv = subscription.latest_invoice as Stripe.Invoice;
    return c.json({ subscriptionId: subscription.id, clientSecret: (inv.payment_intent as any)?.client_secret });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Hosted Stripe Checkout — the real, working way to collect payment (redirect, no card element needed)
stripeApp.post('/create-checkout-session', async (c) => {
  try {
    const stripe = getStripe(c.env as Record<string, string>);
    const { priceId, mode, customerEmail, successUrl, cancelUrl } = await c.req.json();
    const session = await stripe.checkout.sessions.create({
      mode: mode === 'payment' ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return c.json({ url: session.url });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

stripeApp.post('/create-payment-link', async (c) => {
  try {
    const stripe = getStripe(c.env as Record<string, string>);
    const { amount, description } = await c.req.json();
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price_data: { currency: 'usd', product_data: { name: description }, unit_amount: amount }, quantity: 1 }],
    });
    return c.json({ paymentLinkUrl: paymentLink.url });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

stripeApp.post('/create-one-off-invoice', async (c) => {
  try {
    const env = c.env as Record<string, string>;
    const stripe = getStripe(env);
    const { customerId, amount, description, leadId } = await c.req.json();
    const invoice = await createAndFinalizeInvoice(stripe, { customerId, amountCents: amount, description });

    // Persist locally so ad-hoc invoices show up on the Invoices page, get picked
    // up by /reminders/run, and get marked paid by the Stripe webhook — otherwise
    // they only exist in Stripe and are invisible to the rest of the app.
    try {
      const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
      await blink.db.invoices.create({
        id: crypto.randomUUID(),
        leadId: leadId || '',
        amount: amount / 100,
        status: 'open',
        stripeInvoiceId: invoice.id,
      });
    } catch (dbErr) {
      console.error('Failed to persist ad-hoc invoice locally:', dbErr);
    }

    return c.json({ invoiceId: invoice.id, hostedInvoiceUrl: invoice.hosted_invoice_url });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

stripeApp.post('/webhook', async (c) => {
  const env = c.env as Record<string, string>;
  const stripe = getStripe(env);
  const sig = c.req.header('stripe-signature');
  const body = await c.req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  try {
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const stripeInvoice = event.data.object as Stripe.Invoice;
      const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
      const matches = await blink.db.invoices.list({ where: { stripeInvoiceId: stripeInvoice.id }, limit: 1 }) as any[];
      const localInvoice = matches[0];
      if (localInvoice && localInvoice.status !== 'paid') {
        await blink.db.invoices.update(localInvoice.id, { status: 'paid' });
        await blink.db.leads.update(localInvoice.leadId, { status: 'client' });

        // Credit the referring affiliate, if this lead was tagged with one.
        const leadMatches = await blink.db.leads.list({ where: { id: localInvoice.leadId }, limit: 1 }) as any[];
        const lead = leadMatches[0];
        if (lead?.referralCode) {
          const result = await trackAffiliateConversion(blink, {
            referralCode: lead.referralCode,
            leadId: localInvoice.leadId,
            invoiceId: localInvoice.id,
            amount: localInvoice.amount,
          });
          if (!result.success) console.error('Affiliate tracking failed:', result.error);
        }
      }
    } else if (event.type === 'checkout.session.completed') {
      // Records that a real Billing-page subscription purchase happened. Full
      // per-tenant plan gating/dashboards is future work (not built yet) — this
      // just makes the subscription visible/queryable instead of only existing in Stripe.
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
        await blink.db.subscribers.create({
          id: crypto.randomUUID(),
          email: session.customer_details?.email || session.customer_email || '',
          stripeCustomerId: String(session.customer || ''),
          stripeSubscriptionId: String(session.subscription || ''),
          status: 'active',
        });
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
      const matches = await blink.db.subscribers.list({ where: { stripeSubscriptionId: subscription.id }, limit: 1 }) as any[];
      if (matches[0]) {
        await blink.db.subscribers.update(matches[0].id, { status: event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status });
      }
    } else if (event.type === 'invoice.voided' || event.type === 'invoice.marked_uncollectible') {
      const stripeInvoice = event.data.object as Stripe.Invoice;
      const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
      const matches = await blink.db.invoices.list({ where: { stripeInvoiceId: stripeInvoice.id }, limit: 1 }) as any[];
      const localInvoice = matches[0];
      if (localInvoice) {
        await blink.db.invoices.update(localInvoice.id, { status: event.type === 'invoice.voided' ? 'void' : 'uncollectible' });
      }
    }
    console.log(`Stripe event handled: ${event.type}`);
    return c.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return c.json({ received: true, processingError: err.message });
  }
});

export default stripeApp;
