import Stripe from 'stripe';
import { Hono } from 'hono';

const stripeApp = new Hono<{ Bindings: Record<string, string> }>();

const getStripe = (env: Record<string, string>) =>
  new Stripe(env.STRIPE_SECRET_KEY);

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
    const stripe = getStripe(c.env as Record<string, string>);
    const { customerId, amount, description } = await c.req.json();
    await stripe.invoiceItems.create({ customer: customerId, amount, currency: 'usd', description });
    const invoice = await stripe.invoices.create({ customer: customerId, collection_method: 'send_invoice', days_until_due: 7 });
    return c.json({ invoiceId: invoice.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

stripeApp.post('/webhook', async (c) => {
  const env = c.env as Record<string, string>;
  const stripe = getStripe(env);
  const sig = c.req.header('stripe-signature');
  const body = await c.req.text();
  try {
    const event = stripe.webhooks.constructEvent(body, sig!, env.STRIPE_WEBHOOK_SECRET);
    console.log(`Stripe event: ${event.type}`);
    return c.json({ received: true });
  } catch (err: any) {
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }
});

export default stripeApp;
