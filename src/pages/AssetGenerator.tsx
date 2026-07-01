import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Eye, Copy, Play, Check, Clock, ExternalLink, Image, Video, FileText, Sparkles, Loader2, Globe } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { useLeads, useStartAgent, useAgentRuns } from '@/store/pipeline-store';
import { toast } from 'sonner';
import type { PrebuiltAsset } from '@/types/pipeline';

const templates = [
  { id: 'seo', name: 'SEO Authority', description: 'Optimized for search rankings and visibility', preview: '📈' },
  { id: 'aeo', name: 'Answer Engine', description: 'Focused on Perplexity/ChatGPT citations', preview: '🤖' },
  { id: 'geo', name: 'Generative Edge', description: 'High-conversion AI-generated content layout', preview: '✨' },
  { id: 'custom', name: 'Custom Agency', description: 'Bespoke agency design with automated posting', preview: '🏢' },
];

export function AssetGeneratorPage() {
  const queryClient = useQueryClient();
  const { data: leads = [] } = useLeads();
  const { data: agentRuns } = useAgentRuns();
  const startAgent = useStartAgent();
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const result = await blink.db.generatedAssets.list({ orderBy: { generatedAt: 'desc' } });
      return result as PrebuiltAsset[];
    }
  });

  const handleGenerate = async () => {
    if (!selectedLeadId) {
      toast.error('Please select a lead first');
      return;
    }
    try {
      await startAgent.mutateAsync({ agentName: 'Asset Generation', leadId: selectedLeadId });
      toast.success('Asset generation started!');
    } catch (error) {
      toast.error('Failed to start generation.');
    }
  };

  const isGenerating = agentRuns?.some(run => run.agentName === 'Asset Generation' && run.status === 'running');

  return (
    <div className="min-h-screen bg-slate-950">
      <Header 
        title="Asset Generator" 
        subtitle="AI-powered audits, SEO websites, and GEO-optimized assets"
      />

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <select 
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
            >
              <option value="">Select a lead to generate assets for...</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.companyName}</option>
              ))}
            </select>
            <Button 
              className="gap-2 bg-teal-600 hover:bg-teal-500 whitespace-nowrap"
              onClick={handleGenerate}
              disabled={!selectedLeadId || isGenerating}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generate Assets
            </Button>
          </div>
        </div>

        {/* Template Selection */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Choose Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{template.preview}</span>
                  <p className="font-medium text-white">{template.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generated Assets */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Generated Assets</h2>
          <p className="text-sm text-slate-400">{assets.length} assets total</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetsLoading ? (
            <p className="text-slate-500">Loading assets...</p>
          ) : assets.map((asset) => (
            <Card key={asset.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors overflow-hidden">
              <CardContent className="p-4">
                <div className="aspect-video rounded-lg bg-slate-800 mb-4 flex items-center justify-center overflow-hidden relative">
                  {asset.contentUrl ? (
                    <img src={asset.contentUrl} alt={asset.name} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <Globe className="w-12 h-12 text-slate-600" />
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-teal-500 text-white uppercase text-[10px]">{asset.type}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-white truncate">{asset.name}</h3>
                    <p className="text-xs text-slate-400">
                      Lead: {leads.find(l => l.id === asset.leadId)?.companyName || 'Unknown'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                      <Check className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                    <span className="text-[10px] text-slate-500">{new Date(asset.generatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                      <Copy className="w-3 h-3" />
                      Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
