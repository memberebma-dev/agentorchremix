/**
 * PipelineDashboard - Main dashboard for AgentOrch Pipeline Engine
 * Provides high-level overview of the acquisition pipeline
 */

import { TrendingUp, Users, DollarSign, ArrowUpRight, Play, Clock, CheckCircle2, Target, Sparkles, Loader2, Search as SearchIcon, Receipt, RefreshCw, Send } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePipelineStats, usePipelineStages, useActivity, useStartAgent, useStopAgent, useAgentRuns } from '@/store/pipeline-store';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">+{change}%</span>
                <span className="text-xs text-slate-500">vs last week</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10">
            <div className="text-teal-400">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineStageProps {
  name: string;
  count: number;
  color: string;
  onClick: () => void;
}

function PipelineStage({ name, count, color, onClick }: PipelineStageProps) {
  return (
    <div 
      className="flex-shrink-0 w-40 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:border-teal-500/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-white capitalize">{name.replace('_', ' ')}</span>
      </div>
      <p className="text-2xl font-bold text-white">{count}</p>
    </div>
  );
}

export function PipelineDashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = usePipelineStats();
  const { stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: activity, isLoading: activityLoading, refetch: refetchActivity } = useActivity();
  const { data: agentRuns, refetch: refetchRuns } = useAgentRuns();
  const startAgent = useStartAgent();
  const stopAgent = useStopAgent();

  // Auto-refresh logic (20s)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchActivity();
      refetchRuns();
    }, 20000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchActivity, refetchRuns]);

  const handleRunPipeline = async () => {
    toast('Starting acquisition cycle...', { icon: '🚀' });
    try {
      await startAgent.mutateAsync({ agentName: 'Full Pipeline' });
      toast.success('Pipeline running — watch progress below.');
      // Kick an immediate refetch so progress card shows instantly
      refetchRuns();
    } catch (error: any) {
      console.error('Pipeline start error:', error);
      toast.error(`Failed to start pipeline: ${error?.message || 'Unknown error'}`);
    }
  };

  // Only treat a run as "active" if it started within the last 2 minutes
  // This prevents stuck DB records from permanently disabling the button
  const TWO_MINUTES = 2 * 60 * 1000;
  const activeRun = agentRuns?.find(run => 
    run.status === 'running' && 
    (Date.now() - new Date(run.startedAt).getTime()) < TWO_MINUTES
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">AgentOrch Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">Autonomous Acquisition & Passive Revenue Engine for Digital Services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className={activeRun ? "bg-red-600 hover:bg-red-500 gap-2" : "bg-teal-600 hover:bg-teal-500 gap-2"}
            onClick={activeRun ? () => stopAgent.mutate(undefined, { onSuccess: () => toast.success('Agent stopped.') }) : handleRunPipeline}
            disabled={startAgent.isPending}
          >
            {(startAgent.isPending || activeRun) 
              ? <Loader2 className="w-4 h-4 animate-spin" /> 
              : <Play className="w-4 h-4" />}
            {activeRun ? 'Stop' : 'Run Full Cycle'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => onNavigate('leads')}>
          <StatsCard
            title="Total Leads"
            value={statsLoading ? '...' : (stats?.totalLeads || 0).toLocaleString()}
            icon={<Users className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => onNavigate('invoices')}>
          <StatsCard
            title="Passive Revenue"
            value={statsLoading ? '...' : `$${(stats?.passiveRevenue || 0).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => onNavigate('outreach')}>
          <StatsCard
            title="Response Rate"
            value={statsLoading ? '...' : `${(stats?.responseRate || 0).toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => onNavigate('scores')}>
          <StatsCard
            title="Avg Lead Score"
            value={statsLoading ? '...' : `${stats?.avgLeadScore ?? 0}`}
            icon={<Target className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Pipeline Overview */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg italic">Pipeline Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stagesLoading ? (
              <p className="text-slate-500">Loading pipeline...</p>
            ) : (
              stages.map((stage) => (
                <PipelineStage 
                  key={stage.id} 
                  name={stage.name} 
                  count={stage.leads.length} 
                  color={stage.color} 
                  onClick={() => onNavigate('leads')}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Agent Progress */}
      {activeRun && (
        <Card className="bg-teal-900/20 border-teal-800/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                <div>
                  <h3 className="font-semibold text-white">Agent Running: {activeRun.agentName}</h3>
                  <p className="text-sm text-slate-400">{activeRun.logsText}</p>
                </div>
              </div>
              <Badge className="bg-teal-500/20 text-teal-400">{activeRun.progressPercent}%</Badge>
            </div>
            <Progress value={activeRun.progressPercent} className="h-2 bg-slate-800" />
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg italic">System Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-teal-500 hover:text-teal-400" onClick={() => onNavigate('logs')}>
              View Logs <ArrowUpRight className="ml-1 w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              <p className="text-slate-500">Loading activity...</p>
            ) : activity?.length ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <ActivityIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.message}</p>
                    <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No recent activity.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Agent Actions */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg italic">Agent Control Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AgentActionButton name="Lead Discovery" icon={<SearchIcon className="w-4 h-4 text-teal-400" />} />
            <AgentActionButton name="Scoring" icon={<Target className="w-4 h-4 text-amber-400" />} />
            <AgentActionButton name="Asset Generation" icon={<Sparkles className="w-4 h-4 text-emerald-400" />} />
            <AgentActionButton name="Outreach" icon={<Send className="w-4 h-4 text-blue-400" />} />
            <AgentActionButton name="Invoicing" icon={<Receipt className="w-4 h-4 text-purple-400" />} />
            <AgentActionButton name="Repurposing" icon={<RefreshCw className="w-4 h-4 text-orange-400" />} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AgentActionButton({ name, icon }: { name: string; icon: React.ReactNode }) {
  const startAgent = useStartAgent();
  const stopAgent = useStopAgent();
  const { data: agentRuns } = useAgentRuns();
  const TWO_MIN = 2 * 60 * 1000;
  const runningRun = agentRuns?.find(run => 
    run.agentName === name && 
    run.status === 'running' && 
    (Date.now() - new Date(run.startedAt).getTime()) < TWO_MIN
  );

  if (runningRun) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-3 border-red-700 text-red-400 hover:bg-red-900/30"
        onClick={() => stopAgent.mutate(undefined)}
      >
        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
        Stop {name}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800"
      onClick={() => startAgent.mutate({ agentName: name })}
      disabled={startAgent.isPending}
    >
      {icon}
      {name} Agent
    </Button>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'qualified': return <CheckCircle2 className="w-4 h-4" />;
    case 'campaign_started': return <Play className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
}