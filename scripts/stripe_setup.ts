import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia',
});

async function createStripeProductsAndPrices() {
  console.log('Creating Stripe Products and Prices...');

  // Starter Tier
  const starterProduct = await stripe.products.create({
    name: 'Starter',
    description: 'For freelancers/solo users. Limited pipelines/executions per month (e.g., 500 pipeline runs). Basic agent orchestration. Core integrations. Community support.',
  });

  await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 3700, // $37.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 33000, // $330.00
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  // Pro Tier
  const proProduct = await stripe.products.create({
    name: 'Pro',
    description: 'For small agencies. Higher execution limits (e.g., 5,000 pipeline runs). Advanced multi-agent pipelines. Priority support. More connectors. Basic analytics.',
  });

  await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 8900, // $89.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 85000, // $850.00
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  // Enterprise/Business Tier
  const enterpriseProduct = await stripe.products.create({
    name: 'Enterprise/Business',
    description: 'For larger teams/agencies. Unlimited or very high executions (e.g., 50,000 pipeline runs). Custom agents. Team seats. SSO. Dedicated support. White-label options. Priority feature requests.',
  });

  await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 24900, // $249.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // For custom annual pricing, we'll create a placeholder price. Actual custom pricing will be handled via one-off invoices or custom price creation.
  await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 0, // Custom annual pricing will be set manually or via negotiation
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Custom Annual (Placeholder)',
  });

  console.log('Stripe Products and Prices created successfully!');
}

createStripeProductsAndPrices().catch(console.error);
