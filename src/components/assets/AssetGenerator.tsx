/**
 * AssetGenerator - AI-powered asset generation for leads
 * Creates prebuilt sites, copy, and video assets
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Eye, Copy, Play, Check, Clock, Image, Video, FileText, Sparkles } from 'lucide-react';

const mockAssets = [
  { id: '1', business: 'Pacific Bridge Capital', niche: 'Commercial Bridge', template: 'Modern Finance', status: 'ready', createdAt: '2h ago', previewUrl: '#', videoGenerated: true },
  { id: '2', business: 'Coastal Lending Group', niche: 'Hard Money', template: 'Trust & Authority', status: 'ready', createdAt: '5h ago', previewUrl: '#', videoGenerated: true },
  { id: '3', business: 'Sunset Financial', niche: 'Private Money', template: 'Sleek Professional', status: 'generating', createdAt: 'Now', previewUrl: '#', videoGenerated: false },
  { id: '4', business: 'Apex Commercial', niche: 'Fix & Flip', template: 'Modern Finance', status: 'ready', createdAt: '1d ago', previewUrl: '#', videoGenerated: false },
];

const templates = [
  { id: 'modern', name: 'Modern Finance', description: 'Clean, contemporary design', preview: '🎨' },
  { id: 'trust', name: 'Trust & Authority', description: 'Professional, established feel', preview: '🏛️' },
  { id: 'sleek', name: 'Sleek Professional', description: 'Minimalist with bold typography', preview: '✨' },
];

export function AssetGenerator() {
  const [assets] = useState(mockAssets);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Asset Generator</CardTitle>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-500 gap-1">
            <Wand2 className="w-3 h-3" />
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Template</p>
          <div className="grid grid-cols-3 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                }`}
              >
                <span className="text-lg block mb-1">{template.preview}</span>
                <p className="text-xs font-medium text-white">{template.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Asset Types */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-white">Website</span>
            </div>
            <p className="text-xs text-slate-500">Auto-generated</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-white">AI Copy</span>
            </div>
            <p className="text-xs text-slate-500">AI-written</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-white">Video</span>
            </div>
            <p className="text-xs text-slate-500">Optional</p>
          </div>
        </div>

        {/* Recent Assets */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Recent Assets</p>
          <div className="space-y-2">
            {assets.slice(0, 3).map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-sm">
                    🏢
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{asset.business}</p>
                    <p className="text-xs text-slate-500">{asset.template}</p>
                  </div>
                </div>
                <Badge className={
                  asset.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                  asset.status === 'generating' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }>
                  {asset.status === 'ready' && <Check className="w-3 h-3 mr-1" />}
                  {asset.status === 'generating' && <Clock className="w-3 h-3 mr-1" />}
                  {asset.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
