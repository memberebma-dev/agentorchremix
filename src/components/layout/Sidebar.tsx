import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Sparkles, 
  Send, 
  Receipt, 
  ScrollText, 
  Settings, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  Search,
  TrendingUp,
  UserCheck,
  Bell
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'scores', label: 'Scores', icon: BarChart3 },
  { id: 'assets', label: 'Assets', icon: Sparkles },
  { id: 'outreach', label: 'Outreach', icon: Send },
  { id: 'audits', label: 'Audits', icon: Search },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'affiliates', label: 'Affiliates', icon: UserCheck },
  { id: 'billing', label: 'Billing', icon: Zap },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        "bg-slate-900 border-r border-slate-800",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">AgentOrch</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              activeView === item.id
                ? "bg-teal-500/10 text-teal-400 border-l-2 border-teal-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <item.icon className={cn("w-5 h-5 flex-shrink-0", activeView === item.id && "text-teal-400")} />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Compliance Links */}
      {!collapsed && (
        <div className="px-6 py-2 flex flex-col gap-1">
          <button 
            onClick={() => onViewChange('privacy')}
            className="text-[10px] text-slate-500 hover:text-teal-400 transition-colors text-left"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => onViewChange('terms')}
            className="text-[10px] text-slate-500 hover:text-teal-400 transition-colors text-left"
          >
            Terms & Conditions
          </button>
        </div>
      )}

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20",
          collapsed && "justify-center px-2"
        )}>
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-400">AI Active</p>
              <p className="text-xs text-slate-500 truncate">Processing 47 leads</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}