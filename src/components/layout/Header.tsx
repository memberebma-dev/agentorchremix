import { Bell, Search, Play, Pause, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads, campaigns..."
              className="h-9 w-64 pl-9 pr-4 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Quick Actions */}
          <Button variant="default" size="sm" className="gap-2 bg-teal-600 hover:bg-teal-500">
            <Plus className="w-4 h-4" />
            New Lead
          </Button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          </button>
        </div>
      </div>
    </header>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs font-medium mt-2 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Pipeline Stage Component
interface PipelineStageProps {
  name: string;
  count: number;
  value: number;
  color: string;
}

export function PipelineStage({ name, count, value, color }: PipelineStageProps) {
  return (
    <div className="flex-1 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-slate-300">{name}</span>
      </div>
      <p className="text-xl font-bold text-white">{count}</p>
      <p className="text-xs text-slate-500 mt-1">${value.toLocaleString()}</p>
    </div>
  );
}

// Activity Item
interface ActivityItemProps {
  type: 'lead' | 'campaign' | 'proposal' | 'onboarding';
  title: string;
  description: string;
  time: string;
}

export function ActivityItem({ type, title, description, time }: ActivityItemProps) {
  const icons = {
    lead: '👤',
    campaign: '📨',
    proposal: '📄',
    onboarding: '✅',
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm flex-shrink-0">
        {icons[type]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-slate-400 truncate">{description}</p>
      </div>
      <span className="text-xs text-slate-500 flex-shrink-0">{time}</span>
    </div>
  );
}
