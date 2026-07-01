import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Users, Send, DollarSign, Target, Bot, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const BACKEND_URL = 'https://s5ksm5ty.backend.blink.new'

interface AnalyticsSummary {
  totalLeads: number
  totalOutreach: number
  totalClients: number
  revenue: number
  pending: number
  sentCount: number
  openCount: number
  repliedCount: number
  openRate: string
  replyRate: string
  conversionRate: string
  agentSuccessRate: string
}

interface DailyPoint { date: string; leads: number; outreach: number; revenue: number }
interface FunnelPoint { stage: string; value: number }

const KPI = ({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) => (
  <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
)

export function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyData, setDailyData] = useState<DailyPoint[]>([])
  const [funnelData, setFunnelData] = useState<FunnelPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/analytics`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as any
      setSummary(data.summary)
      setDailyData(data.dailyData || [])
      setFunnelData(data.outreachFunnel || [])
    } catch (e: any) {
      toast.error('Failed to load analytics: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [])

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
        <p className="text-slate-400 mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Pipeline Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time acquisition engine performance</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading} variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total Leads" value={summary?.totalLeads || 0} icon={Users} color="bg-blue-500/10 text-blue-400" />
        <KPI label="Outreach Sent" value={summary?.sentCount || 0} sub={`${summary?.replyRate || 0}% reply rate`} icon={Send} color="bg-teal-500/10 text-teal-400" />
        <KPI label="Revenue Collected" value={`$${(summary?.revenue || 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-400" />
        <KPI label="Clients Won" value={summary?.totalClients || 0} sub={`${summary?.conversionRate || 0}% conversion`} icon={Target} color="bg-amber-500/10 text-amber-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Open Rate" value={`${summary?.openRate || 0}%`} icon={TrendingUp} color="bg-purple-500/10 text-purple-400" />
        <KPI label="Reply Rate" value={`${summary?.replyRate || 0}%`} icon={TrendingUp} color="bg-pink-500/10 text-pink-400" />
        <KPI label="Pending Revenue" value={`$${(summary?.pending || 0).toLocaleString()}`} icon={DollarSign} color="bg-orange-500/10 text-orange-400" />
        <KPI label="AI Success Rate" value={`${summary?.agentSuccessRate || 0}%`} icon={Bot} color="bg-teal-500/10 text-teal-400" />
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">Daily Leads & Outreach (14 Days)</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outreachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#0D9488" fill="url(#leadsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="outreach" name="Outreach" stroke="#3B82F6" fill="url(#outreachGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">Revenue Timeline</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="w-5 h-5 text-teal-400 animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip content={customTooltip} />
                <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">Outreach Funnel</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="w-5 h-5 text-teal-400 animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="value" name="Count" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
