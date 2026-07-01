/**
 * OutreachComposer - Compose outreach messages for leads
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Wand2, Copy, RefreshCw, Mail, MessageSquare, Phone, Send, Sparkles, Check } from 'lucide-react';

const templates = [
  { id: 'initial', name: 'Initial Outreach', type: 'email' },
  { id: 'follow', name: 'Follow Up', type: 'email' },
  { id: 'intro', name: 'Introduction', type: 'call' },
];

const mockGeneratedContent = `Subject: Helping ${'[Business Name]'} Scale Their Commercial Lending

Hi ${'[First Name]'},

I came across ${'[Business Name]'} and was impressed by what you're doing in the ${'[Niche]'} space here in ${'[Location]'}.

We help commercial bridge lenders like yourself generate more qualified leads through our automated outreach system - without the cold calling grind.

Would you be open to a quick 15-minute call this week to see if there's a fit?

Best,
[Your Name]

P.S. - I've attached a quick case study that might be relevant to your situation.`;

export function OutreachComposer() {
  const [selectedTemplate, setSelectedTemplate] = useState('initial');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState('professional');

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGeneratedContent(mockGeneratedContent);
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Outreach Composer</CardTitle>
          <Badge className="bg-teal-500/20 text-teal-400">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Template</label>
          <div className="flex gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                  selectedTemplate === template.id
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                    : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <p className="text-xs font-medium">{template.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Tone</label>
          <select 
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          >
            <option value="professional">Professional & Direct</option>
            <option value="friendly">Friendly & Casual</option>
            <option value="authoritative">Authoritative & Expert</option>
          </select>
        </div>

        {/* Context */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Lead Name</label>
            <Input placeholder="John Smith" className="h-8 bg-slate-800 border-slate-700 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Business</label>
            <Input placeholder="Acme Lending" className="h-8 bg-slate-800 border-slate-700 text-white text-sm" />
          </div>
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
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Outreach
            </>
          )}
        </Button>

        {/* Generated Content */}
        {generatedContent && (
          <div className="relative">
            <Textarea 
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[180px] bg-slate-800/50 border-slate-700 text-white text-sm"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2 border-slate-600 text-slate-300">
                <Copy className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2 border-slate-600 text-slate-300">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Send Options */}
        {generatedContent && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button variant="outline" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
              <MessageSquare className="w-4 h-4" />
              SMS
            </Button>
            <Button variant="outline" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
              <Phone className="w-4 h-4" />
              Call Script
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
