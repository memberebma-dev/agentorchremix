/**
 * SequenceBuilder - Build outreach sequences with multiple touchpoints
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, GripVertical, Trash2, Mail, MessageSquare, Phone, Clock, ArrowRight } from 'lucide-react';

const mockSequence = [
  { id: '1', type: 'email', subject: 'Introduction', delay: 'Day 0', status: 'active' },
  { id: '2', type: 'email', subject: 'Follow up', delay: 'Day 3', status: 'active' },
  { id: '3', type: 'sms', subject: 'Quick check-in', delay: 'Day 5', status: 'active' },
  { id: '4', type: 'voicemail', subject: 'Voice mail', delay: 'Day 7', status: 'pending' },
  { id: '5', type: 'email', subject: 'Final attempt', delay: 'Day 10', status: 'pending' },
];

export function SequenceBuilder() {
  const [sequence] = useState(mockSequence);
  const [sequenceName, setSequenceName] = useState('SoCal Nurture Sequence');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-3 h-3" />;
      case 'sms': return <MessageSquare className="w-3 h-3" />;
      case 'voicemail': return <Phone className="w-3 h-3" />;
      default: return <Mail className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'sms': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'voicemail': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Sequence Builder</CardTitle>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-500 gap-1">
            <Plus className="w-3 h-3" />
            Add Step
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sequence Name */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Sequence Name</label>
          <Input 
            value={sequenceName}
            onChange={(e) => setSequenceName(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-lg font-bold text-white">{sequence.length}</p>
            <p className="text-xs text-slate-400">Steps</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-lg font-bold text-white">10</p>
            <p className="text-xs text-slate-400">Days</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-lg font-bold text-emerald-400">3</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
        </div>

        {/* Sequence Steps */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Sequence Steps</p>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-slate-700" />
            
            {sequence.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 mb-2">
                {/* Drag handle */}
                <button className="p-1 rounded hover:bg-slate-700 text-slate-500">
                  <GripVertical className="w-4 h-4" />
                </button>
                
                {/* Step card */}
                <div className="flex-1 flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  {/* Type icon */}
                  <div className={`p-1.5 rounded ${getTypeColor(step.type)}`}>
                    {getTypeIcon(step.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{step.subject}</p>
                      <Badge className={step.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 text-xs' : 'bg-slate-500/20 text-slate-400 text-xs'}>
                        {step.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {step.delay}
                    </div>
                  </div>
                  
                  {/* Delete */}
                  <button className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Arrow */}
                {index < sequence.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            Save Draft
          </Button>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-500">
            Activate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
