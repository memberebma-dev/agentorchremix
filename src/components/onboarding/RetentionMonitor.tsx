/**
 * RetentionMonitor - Monitor client retention and health scores
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Mail, Phone, MessageSquare, MoreHorizontal, Eye, Star } from 'lucide-react';

const mockClients = [
  { 
    id: '1', 
    name: 'Sunset Financial Services', 
    healthScore: 92,
    trend: 'up',
    mrr: 1997,
    lastActive: '2h ago',
    nps: 9,
    risk: 'low',
    engagement: 85,
  },
  { 
    id: '2', 
    name: 'Coastal Lending Group', 
    healthScore: 78,
    trend: 'stable',
    mrr: 997,
    lastActive: '1d ago',
    nps: 7,
    risk: 'medium',
    engagement: 62,
  },
  { 
    id: '3', 
    name: 'Pacific Bridge Capital', 
    healthScore: 45,
    trend: 'down',
    mrr: 4997,
    lastActive: '5d ago',
    nps: 4,
    risk: 'high',
    engagement: 28,
  },
];

export function RetentionMonitor() {
  const [clients] = useState(mockClients);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Retention Monitor</CardTitle>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
            <Eye className="w-3 h-3 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">Avg Health Score</p>
            <p className="text-lg font-bold text-emerald-400">78%</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">At Risk</p>
            <p className="text-lg font-bold text-red-400">1</p>
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Client Health</p>
          {clients.map((client) => (
            <div key={client.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-white text-sm">{client.name}</p>
                    <p className="text-xs text-slate-500">${client.mrr}/mo • {client.lastActive}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRiskBadge(client.risk)}>
                    {client.risk}
                  </Badge>
                  <button className="p-1 rounded hover:bg-slate-700 text-slate-500">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Health Metrics */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-bold ${getHealthColor(client.healthScore)}`}>
                    {client.healthScore}
                  </span>
                  <span className="text-xs text-slate-500">health</span>
                  {getTrendIcon(client.trend)}
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-white">{client.nps} NPS</span>
                </div>
              </div>
              
              {/* Engagement Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Engagement</span>
                  <span className="text-slate-400">{client.engagement}%</span>
                </div>
                <Progress 
                  value={client.engagement} 
                  className={`h-1.5 ${
                    client.engagement >= 70 ? 'bg-emerald-500/20' :
                    client.engagement >= 40 ? 'bg-amber-500/20' :
                    'bg-red-500/20'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Mail className="w-3 h-3" />
            Reach Out
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <MessageSquare className="w-3 h-3" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
