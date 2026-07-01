/**
 * BatchAssetGenerator - Generate assets for multiple leads at once
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wand2, Check, Clock, Play, Layers, AlertCircle } from 'lucide-react';

const mockBatchLeads = [
  { id: '1', business: 'Pacific Bridge Capital', selected: true },
  { id: '2', business: 'Coastal Lending Group', selected: true },
  { id: '3', business: 'Sunset Financial', selected: false },
  { id: '4', business: 'Apex Commercial', selected: true },
  { id: '5', business: 'Harbor View Funding', selected: false },
];

export function BatchAssetGenerator() {
  const [leads, setLeads] = useState(mockBatchLeads);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedCount = leads.filter(l => l.selected).length;

  const toggleLead = (id: string) => {
    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, selected: !l.selected } : l
    ));
  };

  const toggleAll = () => {
    const allSelected = leads.every(l => l.selected);
    setLeads(prev => prev.map(l => ({ ...l, selected: !allSelected })));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Simulate batch generation
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Batch Generator</CardTitle>
          <Badge className="bg-teal-500/20 text-teal-400">
            {selectedCount} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Select leads for batch generation</p>
          <Button variant="outline" size="sm" onClick={toggleAll} className="text-xs border-slate-700 text-slate-300">
            {leads.every(l => l.selected) ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {/* Lead List */}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {leads.map((lead) => (
            <label
              key={lead.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                lead.selected ? 'bg-teal-500/10' : 'hover:bg-slate-800/50'
              }`}
            >
              <input
                type="checkbox"
                checked={lead.selected}
                onChange={() => toggleLead(lead.id)}
                className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-white">{lead.business}</span>
            </label>
          ))}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Generation Options</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-teal-500" />
              <span className="text-xs text-white">Website</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-teal-500" />
              <span className="text-xs text-white">AI Copy</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700 cursor-pointer">
              <input type="checkbox" className="rounded text-teal-500" />
              <span className="text-xs text-white">Video</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700 cursor-pointer">
              <input type="checkbox" className="rounded text-teal-500" />
              <span className="text-xs text-white">Social</span>
            </label>
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Generating assets...</span>
              <span className="text-teal-400">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || selectedCount === 0}
          className="w-full bg-teal-600 hover:bg-teal-500 gap-2"
        >
          {isGenerating ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Generating {selectedCount} assets...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate {selectedCount} Assets
            </>
          )}
        </Button>

        {/* Info */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            Batch generation may take several minutes. You'll receive a notification when complete.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
