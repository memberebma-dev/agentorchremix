import Stripe from "stripe";

export async function findOrCreateCustomer(
  stripe: Stripe,
  email: string,
  name: string
): Promise<Stripe.Customer> {
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) return existing.data[0];
  }
  return stripe.customers.create({ email: email || undefined, name: name || undefined });
}

/** Create a real Stripe invoice, attach a line item, and finalize it so it's actually payable. */
export async function createAndFinalizeInvoice(
  stripe: Stripe,
  params: { customerId: string; amountCents: number; description: string; daysUntilDue?: number }
): Promise<Stripe.Invoice> {
  await stripe.invoiceItems.create({
    customer: params.customerId,
    amount: params.amountCents,
    currency: "usd",
    description: params.description,
  });
  const draft = await stripe.invoices.create({
    customer: params.customerId,
    collection_method: "send_invoice",
    days_until_due: params.daysUntilDue ?? 7,
    auto_advance: true,
  });
  return stripe.invoices.finalizeInvoice(draft.id!);
}
