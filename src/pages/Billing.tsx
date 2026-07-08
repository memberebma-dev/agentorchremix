import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { CheckIcon, Loader2, DollarSign, Users, Receipt } from "lucide-react";
import { toast } from 'sonner';
import { useBlinkAuth } from '@blinkdotnew/react';
import { BACKEND_URL } from '@/lib/api';
import { useSubscribers, usePipelineStats, useInvoices } from '@/store/pipeline-store';

interface Price {
  id: string;
  unit_amount: number;
  recurring: { interval: string };
  product: string;
  nickname?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

const BillingPage: React.FC = () => {
  const { user } = useBlinkAuth();
  const { data: subscribers } = useSubscribers();
  const activeSubscribers = subscribers?.filter(s => s.status === 'active') || [];
  const { data: stats } = usePipelineStats();
  const { data: invoices } = useInvoices();
  const recentPaidInvoices = (invoices || []).filter(i => i.status === 'paid').slice(0, 5);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingPriceId, setSubscribingPriceId] = useState<string | null>(null);
  const [customAction, setCustomAction] = useState<'invoice' | 'link' | null>(null);
  const [customForm, setCustomForm] = useState({ description: '', amount: '' });
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/stripe/products-with-prices`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (e: any) {
        setError(e.message);
        toast.error(`Failed to load pricing plans: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubscribe = async (priceId: string, interval: string) => {
    setSubscribingPriceId(priceId);
    try {
      const res = await fetch(`${BACKEND_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode: 'subscription',
          customerEmail: user?.email,
          successUrl: `${window.location.origin}${window.location.pathname}?checkout=success`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?checkout=cancelled`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(`Subscription failed: ${e.message}`);
      setSubscribingPriceId(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast.success('Subscription active! Welcome aboard.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('checkout') === 'cancelled') {
      toast.info('Checkout cancelled.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCustomSubmit = async () => {
    const amountCents = Math.round(Number(customForm.amount) * 100);
    if (!customForm.description || !amountCents || amountCents <= 0) {
      toast.error('Enter a description and a valid amount');
      return;
    }
    setIsSubmittingCustom(true);
    try {
      if (customAction === 'invoice') {
        if (!user?.email) throw new Error('No authenticated email on file');
        const customerRes = await fetch(`${BACKEND_URL}/stripe/create-customer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, name: user.email }),
        });
        const customerData = await customerRes.json();
        if (!customerRes.ok) throw new Error(customerData.error || 'Failed to create customer');

        const invoiceRes = await fetch(`${BACKEND_URL}/stripe/create-one-off-invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customerData.customerId, amount: amountCents, description: customForm.description }),
        });
        const invoiceData = await invoiceRes.json();
        if (!invoiceRes.ok) throw new Error(invoiceData.error || 'Failed to create invoice');
        setResultUrl(invoiceData.hostedInvoiceUrl);
        toast.success('Invoice created and finalized in Stripe');
      } else {
        const linkRes = await fetch(`${BACKEND_URL}/stripe/create-payment-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountCents, description: customForm.description }),
        });
        const linkData = await linkRes.json();
        if (!linkRes.ok) throw new Error(linkData.error || 'Failed to create payment link');
        setResultUrl(linkData.paymentLinkUrl);
        toast.success('Payment link created');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const closeCustomDialog = () => {
    setCustomAction(null);
    setCustomForm({ description: '', amount: '' });
    setResultUrl(null);
  };

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-950 text-white min-h-screen">
      <h1 className="text-5xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
        Billing &amp; Revenue
      </h1>
      <p className="text-xl text-center text-gray-400 mb-10 max-w-3xl mx-auto">
        Real revenue, subscribers, and plans — backed by Stripe.
      </p>

      {/* Revenue Overview — always visible regardless of whether Stripe Products are configured */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">${(stats?.passiveRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500"><DollarSign className="w-5 h-5" /></div>
        </div>
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Subscribers</p>
            <p className="text-2xl font-bold text-white mt-1">{activeSubscribers.length}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-500"><Users className="w-5 h-5" /></div>
        </div>
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Invoices</p>
            <p className="text-2xl font-bold text-white mt-1">{(invoices || []).filter(i => i.status === 'paid').length}</p>
          </div>
          <div className="p-3 rounded-full bg-purple-500/10 text-purple-500"><Receipt className="w-5 h-5" /></div>
        </div>
      </div>

      {recentPaidInvoices.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Paid Invoices</h2>
          <div className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden divide-y divide-gray-700">
            {recentPaidInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-300 font-mono truncate">{inv.stripeInvoiceId || inv.id}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</span>
                  <span className="text-sm font-semibold text-emerald-400">${Number(inv.amount).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubscribers.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-lg font-semibold text-white mb-3">Active Subscribers</h2>
          <div className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden divide-y divide-gray-700">
            {activeSubscribers.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-300">{s.email || 'Unknown'}</span>
                <span className="text-xs text-gray-500 font-mono">{s.stripeSubscriptionId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-center mb-2">Plans</h2>
      <p className="text-gray-500 text-center mb-8">Choose the perfect plan to scale your agent orchestration needs.</p>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="ml-3 text-lg text-gray-400">Loading pricing plans...</p>
        </div>
      ) : error ? (
        <p className="text-center text-red-400 text-sm max-w-xl mx-auto">Couldn't load pricing plans from Stripe: {error}. Custom invoicing below still works independently.</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">No products configured in Stripe yet. Add products in your Stripe Dashboard to see plans here.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {products.sort((a, b) => {
            const priceA = a.prices.find(p => p.recurring.interval === 'month')?.unit_amount || 999999;
            const priceB = b.prices.find(p => p.recurring.interval === 'month')?.unit_amount || 999999;
            return priceA - priceB;
          }).map((product) => (
            <Card
              key={product.id}
              className={`flex flex-col justify-between border-2 ${product.name === 'Pro' ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-gray-700'} hover:border-blue-400 transition-all duration-300 bg-gray-800 rounded-xl p-6`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-400">
                  {product.name}
                </CardTitle>
                <CardDescription className="text-center text-gray-400 text-base leading-relaxed">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center py-6">
                {product.prices.map((price) => (
                  <div key={price.id} className="mb-4 w-full">
                    <p className="text-5xl font-extrabold text-center mb-2">
                      {price.unit_amount === 0 ? 'Custom' : `$${(price.unit_amount / 100).toFixed(0)}`}
                      <span className="text-xl text-gray-400 font-medium">/{price.recurring.interval}</span>
                    </p>
                    {product.name === 'Enterprise/Business' && price.unit_amount === 0 ? (
                      <Button
                        asChild
                        className="w-full py-3 text-lg font-semibold rounded-lg transition-all duration-300 bg-teal-600 hover:bg-teal-700"
                      >
                        <a href={`mailto:${user?.email || ''}?subject=${encodeURIComponent('Enterprise plan inquiry')}`}>
                          Contact Sales
                        </a>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(price.id, price.recurring.interval)}
                        className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-300 ${product.name === 'Pro' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                        disabled={subscribingPriceId === price.id}
                      >
                        {subscribingPriceId === price.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          `Select ${product.name} (${price.recurring.interval})`
                        )}
                      </Button>
                    )}
                    {product.name === 'Pro' && price.recurring.interval === 'year' && (
                      <p className="text-sm text-green-400 text-center mt-2">Save ~20% annually!</p>
                    )}
                    {product.name === 'Starter' && price.recurring.interval === 'year' && (
                      <p className="text-sm text-green-400 text-center mt-2">Save ~15% annually!</p>
                    )}
                  </div>
                ))}
                <ul className="mt-8 space-y-3 text-gray-300 text-left w-full">
                  <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> Full access to the AgentOrch pipeline (Lead Discovery, Scoring, Asset Generation, Outreach, Invoicing)</li>
                  <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> Real-time Analytics dashboard</li>
                </ul>
                {product.description && (
                  <p className="text-xs text-gray-500 mt-4">{product.description}</p>
                )}
              </CardContent>
              <CardFooter className="text-center text-sm text-gray-500 pt-6">
                {product.name === 'Pro' && <p className="text-blue-400 font-semibold">Our Most Popular Plan!</p>}
                {product.name === 'Enterprise/Business' && product.prices.some(p => p.unit_amount === 0) && <p className="text-teal-400">Contact us for tailored annual solutions.</p>}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-20 text-center p-8 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Beyond Subscriptions: Custom Projects</h2>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
          For one-off custom client projects or done-for-you agency services, we offer flexible invoicing and payment links.
        </p>
        <div className="flex justify-center space-x-4">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
            onClick={() => setCustomAction('invoice')}
          >
            Request Custom Invoice
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-900 hover:text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
            onClick={() => setCustomAction('link')}
          >
            Generate Payment Link
          </Button>
        </div>
      </div>

      <Dialog open={customAction !== null} onOpenChange={(open) => !open && closeCustomDialog()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white italic">
              {customAction === 'invoice' ? 'Request Custom Invoice' : 'Generate Payment Link'}
            </DialogTitle>
          </DialogHeader>
          {resultUrl ? (
            <div className="py-4 space-y-4">
              <p className="text-sm text-slate-400">Live Stripe link ready:</p>
              <a href={resultUrl} target="_blank" rel="noreferrer" className="block break-all text-teal-400 text-sm underline">{resultUrl}</a>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</label>
                <input value={customForm.description} onChange={e => setCustomForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Custom landing page build"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Amount (USD)</label>
                <input value={customForm.amount} onChange={e => setCustomForm(f => ({ ...f, amount: e.target.value }))}
                  type="number" min="1" step="0.01" placeholder="4997"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-teal-500" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="text-slate-400" onClick={closeCustomDialog}>Close</Button>
            {!resultUrl && (
              <Button className="bg-teal-600 hover:bg-teal-500" onClick={handleCustomSubmit} disabled={isSubmittingCustom}>
                {isSubmittingCustom ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;
