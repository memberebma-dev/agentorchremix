/**
 * OnboardingDashboard - Track and manage client onboarding
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserPlus, CheckCircle2, Clock, AlertCircle, ChevronRight, Play, FileText, Settings, Mail } from 'lucide-react';

const onboardingClients = [
  { 
    id: '1', 
    name: 'Sunset Financial Services', 
    progress: 85, 
    status: 'active',
    currentStep: 'Campaign Setup',
    daysLeft: 2,
    steps: ['Account Created', 'Lead Data Import', 'Template Selection', 'Campaign Setup', 'Launch'],
  },
  { 
    id: '2', 
    name: 'Coastal Lending Group', 
    progress: 45, 
    status: 'active',
    currentStep: 'Lead Data Import',
    daysLeft: 5,
    steps: ['Account Created', 'Lead Data Import', 'Template Selection', 'Campaign Setup', 'Launch'],
  },
  { 
    id: '3', 
    name: 'Pacific Bridge Capital', 
    progress: 20, 
    status: 'pending',
    currentStep: 'Account Setup',
    daysLeft: 7,
    steps: ['Account Created', 'Lead Data Import', 'Template Selection', 'Campaign Setup', 'Launch'],
  },
];

export function OnboardingDashboard() {
  const [clients] = useState(onboardingClients);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStepStatus = (clientProgress: number, stepIndex: number) => {
    const stepThreshold = (stepIndex + 1) * 20;
    if (clientProgress >= stepThreshold) return 'completed';
    if (clientProgress >= stepThreshold - 20 && clientProgress < stepThreshold) return 'current';
    return 'pending';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Onboarding Dashboard</CardTitle>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-500 gap-1">
            <UserPlus className="w-3 h-3" />
            New Client
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-lg font-bold text-white">{clients.length}</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-lg font-bold text-emerald-400">12</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <p className="text-lg font-bold text-amber-400">2</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
        </div>

        {/* Active Onboardings */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Active Onboardings</p>
          {clients.map((client) => (
            <div key={client.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-white text-sm">{client.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                    <span className="text-xs text-slate-500">{client.currentStep}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{client.progress}%</p>
                  <p className="text-xs text-slate-500">{client.daysLeft} days left</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <Progress value={client.progress} className="h-1.5 bg-slate-700" />
              
              {/* Steps */}
              <div className="flex items-center justify-between mt-2">
                {client.steps.map((step, i) => {
                  const stepStatus = getStepStatus(client.progress, i);
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        stepStatus === 'completed' ? 'bg-emerald-500' :
                        stepStatus === 'current' ? 'bg-teal-500' :
                        'bg-slate-600'
                      }`} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <FileText className="w-3 h-3" />
            Templates
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Mail className="w-3 h-3" />
            Send Guide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
