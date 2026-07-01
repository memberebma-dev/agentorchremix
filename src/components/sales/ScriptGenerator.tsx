/**
 * ScriptGenerator - Generate sales scripts for different scenarios
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Wand2, Copy, RefreshCw, Phone, Video, MessageSquare, FileText, Play, Sparkles } from 'lucide-react';

const scriptTypes = [
  { id: 'discovery', name: 'Discovery Call', icon: Phone, color: 'text-blue-400' },
  { id: 'demo', name: 'Product Demo', icon: Video, color: 'text-purple-400' },
  { id: 'objection', name: 'Objection Handling', icon: MessageSquare, color: 'text-amber-400' },
  { id: 'proposal', name: 'Proposal Review', icon: FileText, color: 'text-teal-400' },
];

const mockScript = `// Discovery Call Script

[INTRO - 30 seconds]
"Hi [Name], thanks for taking the time to chat today. I know you're busy, so I'll keep this brief and valuable.

[BODY - 2 minutes]
"I've been helping commercial lenders in Southern California scale their outreach without the cold calling grind. We use AI to identify and engage qualified leads automatically.

What I'm curious about is - what's your biggest challenge when it comes to generating new commercial bridge lending deals?"

[LISTEN & QUALIFY - 3 minutes]
- Ask about current volume
- Ask about conversion rates  
- Ask about outreach methods
- Identify pain points

[CLOSE - 30 seconds]
"That makes total sense. Based on what you've shared, I think we could help you [specific benefit]. 

Would it make sense to show you exactly how this works with a quick 15-minute demo?"`;

export function ScriptGenerator() {
  const [selectedType, setSelectedType] = useState('discovery');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [context, setContext] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGeneratedScript(mockScript);
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Script Generator</CardTitle>
          <Badge className="bg-teal-500/20 text-teal-400">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Sales Scripts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Script Type Selection */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Script Type</label>
          <div className="grid grid-cols-2 gap-2">
            {scriptTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  selectedType === type.id
                    ? 'bg-teal-500/10 border-teal-500/30'
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <type.icon className={`w-4 h-4 ${type.color}`} />
                <span className="text-xs font-medium text-white">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Lead Name</label>
            <Input 
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="John Smith"
              className="h-8 bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Company</label>
            <Input 
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Acme Lending"
              className="h-8 bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
        </div>

        {/* Additional Context */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Additional Context</label>
          <Textarea 
            placeholder="Any specific objections to address, pain points, or notes about this lead..."
            className="min-h-[60px] bg-slate-800 border-slate-700 text-white text-sm"
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-teal-600 hover:bg-teal-500 gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Script...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Script
            </>
          )}
        </Button>

        {/* Generated Script */}
        {generatedScript && (
          <div className="relative">
            <Textarea 
              value={generatedScript}
              onChange={(e) => setGeneratedScript(e.target.value)}
              className="min-h-[200px] bg-slate-800/50 border-slate-700 text-white text-sm font-mono"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2 border-slate-600 text-slate-300">
                <Copy className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2 border-slate-600 text-slate-300">
                <Play className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
