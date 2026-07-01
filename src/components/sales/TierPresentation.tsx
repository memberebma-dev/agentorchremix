/**
 * TierPresentation - Create tiered pricing presentations for leads
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, Download, Eye, Crown, Zap, Building2 } from 'lucide-react';

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 997,
    icon: Building2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    features: [
      'Up to 50 leads/month',
      'Basic email outreach',
      'Lead scoring',
      'Email support',
    ],
    notIncluded: ['AI phone calls', 'SMS outreach', 'Priority support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1997,
    icon: Zap,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    popular: true,
    features: [
      'Up to 200 leads/month',
      'Full multi-channel outreach',
      'AI voice calls',
      'SMS outreach',
      'Priority support',
    ],
    notIncluded: ['Dedicated account manager'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4997,
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    features: [
      'Unlimited leads',
      'Full automation suite',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      '24/7 phone support',
    ],
    notIncluded: [],
  },
];

export function TierPresentation() {
  const [selectedTier, setSelectedTier] = useState('growth');
  const [companyName, setCompanyName] = useState('');

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Tier Presentation</CardTitle>
          <Badge className="bg-teal-500/20 text-teal-400">
            <Sparkles className="w-3 h-3 mr-1" />
            Customizable
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
          <Input 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Lead's company name"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Tiers */}
        <div className="space-y-2">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                selectedTier === tier.id
                  ? 'bg-teal-500/10 border-teal-500/30'
                  : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${tier.bg}`}>
                    <tier.icon className={`w-4 h-4 ${tier.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{tier.name}</p>
                    <p className="text-xs text-slate-400">${tier.price}/month</p>
                  </div>
                </div>
                {tier.popular && (
                  <Badge className="bg-teal-500/20 text-teal-400 text-xs">Most Popular</Badge>
                )}
                {selectedTier === tier.id && (
                  <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Tier Details */}
        {selectedTier && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">What's included:</p>
            <div className="space-y-1">
              {tiers.find(t => t.id === selectedTier)?.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button className="flex-1 gap-1 bg-teal-600 hover:bg-teal-500">
            <Download className="w-4 h-4" />
            Generate PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
