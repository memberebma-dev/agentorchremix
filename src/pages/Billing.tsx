import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, Loader2 } from "lucide-react";
import { toast } from 'sonner';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/stripe/products-with-prices');
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

  const handleSubscribe = async (priceId: string) => {
    setIsSubscribing(true);
    try {
      // For demonstration, we'll create a dummy customer first.
      // In a real app, the customer would likely be created during user signup or retrieved from your DB.
      const customerResponse = await fetch('/stripe/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', name: 'Test User' }), // Replace with actual user data
      });
      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerData.error || 'Failed to create customer');
      }
      const customerId = customerData.customerId;

      const subscriptionResponse = await fetch('/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, priceId }),
      });
      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.error || 'Failed to create subscription');
      }

      toast.success('Subscription initiated! Please complete payment.');
      // In a real scenario, you would redirect to Stripe Checkout or handle payment intent confirmation
      console.log('Subscription created:', subscriptionData.subscriptionId);
      console.log('Client Secret:', subscriptionData.clientSecret);

    } catch (e: any) {
      setError(e.message);
      toast.error(`Subscription failed: ${e.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      <p className="ml-3 text-lg text-gray-400">Loading pricing plans...</p>
    </div>
  );
  if (error) return <div className="text-center py-10 text-red-500 text-lg">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-950 text-white min-h-screen">
      <h1 className="text-5xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
        Flexible Plans for Every Agency
      </h1>
      <p className="text-xl text-center text-gray-400 mb-12 max-w-3xl mx-auto">
        Choose the perfect plan to scale your agent orchestration needs. Unlock advanced features and supercharge your agency's growth.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {products.sort((a, b) => {
          // Sort by price for better presentation (e.g., Starter, Pro, Enterprise)
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
                  <Button 
                    onClick={() => handleSubscribe(price.id)}
                    className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-300 ${product.name === 'Pro' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                    disabled={isSubscribing || (product.name === 'Enterprise/Business' && price.unit_amount === 0)}
                  >
                    {isSubscribing ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      product.name === 'Enterprise/Business' && price.unit_amount === 0 ? 'Contact Sales' : `Select ${product.name} (${price.recurring.interval})`
                    )}
                  </Button>
                  {product.name === 'Pro' && price.recurring.interval === 'year' && (
                    <p className="text-sm text-green-400 text-center mt-2">Save ~20% annually!</p>
                  )}
                  {product.name === 'Starter' && price.recurring.interval === 'year' && (
                    <p className="text-sm text-green-400 text-center mt-2">Save ~15% annually!</p>
                  )}
                </div>
              ))}
              <ul className="mt-8 space-y-3 text-gray-300 text-left w-full">
                {/* Placeholder for features - these would ideally come from product metadata or a predefined list */}
                <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> {product.name === 'Starter' ? '500 Pipeline Runs/Month' : product.name === 'Pro' ? '5,000 Pipeline Runs/Month' : '50,000+ Pipeline Runs/Month'}</li>
                <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> {product.name === 'Starter' ? 'Basic Agent Orchestration' : product.name === 'Pro' ? 'Advanced Multi-Agent Pipelines' : 'Custom Agents & Workflows'}</li>
                <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> {product.name === 'Starter' ? 'Core Integrations' : product.name === 'Pro' ? 'More Connectors' : 'SSO & Custom Integrations'}</li>
                <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> {product.name === 'Starter' ? 'Community Support' : product.name === 'Pro' ? 'Priority Support' : 'Dedicated Account Manager'}</li>
                {product.name === 'Pro' && <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> Basic Analytics</li>}
                {product.name === 'Enterprise/Business' && <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> Team Seats & User Management</li>}
                {product.name === 'Enterprise/Business' && <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> White-Label Options</li>}
                {product.name === 'Enterprise/Business' && <li className="flex items-center"><CheckIcon className="text-green-500 mr-3 flex-shrink-0" size={20} /> Priority Feature Requests</li>}
              </ul>
            </CardContent>
            <CardFooter className="text-center text-sm text-gray-500 pt-6">
              {product.name === 'Pro' && <p className="text-blue-400 font-semibold">Our Most Popular Plan!</p>}
              {product.name === 'Enterprise/Business' && product.prices.some(p => p.unit_amount === 0) && <p className="text-teal-400">Contact us for tailored annual solutions.</p>}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-20 text-center p-8 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Beyond Subscriptions: Custom Projects</h2>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
          For one-off custom client projects or done-for-you agency services, we offer flexible invoicing and payment links.
        </p>
        <div className="flex justify-center space-x-4">
          <Button 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
            onClick={() => toast.info('One-off invoice creation not yet implemented in UI.')}
          >
            Request Custom Invoice
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-purple-500 text-purple-400 hover:bg-purple-900 hover:text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
            onClick={() => toast.info('Payment link generation not yet implemented in UI.')}
          >
            Generate Payment Link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
