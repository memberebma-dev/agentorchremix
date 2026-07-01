import { useState } from 'react'
import { useInvoices, useLeads } from '@/store/pipeline-store'
import { blink } from '@/lib/blink'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Play, DollarSign, AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const BACKEND_URL = 'https://s5ksm5ty.backend.blink.new'

function useReminders() {
  return useQuery({
    queryKey: ['invoiceReminders'],
    queryFn: async () => {
      const reminders = await blink.db.invoiceReminders.list({
        orderBy: { createdAt: 'desc' },
        limit: 200,
      }) as any[]
      return reminders
    },
    staleTime: 30000,
  })
}

const EscalationBadge = ({ level }: { level: number }) => {
  const configs = {
    1: { label: 'Initial', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    2: { label: 'Follow-up', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    3: { label: 'Final Notice', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  }
  const cfg = configs[level as keyof typeof configs] || configs[1]
  return <Badge className={cfg.cls}>{cfg.label}</Badge>
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, string> = {
    sent: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return <Badge className={configs[status] || configs.pending}>{status}</Badge>
}

export function InvoiceRemindersPage() {
  const { data: invoices, isLoading: invLoading, refetch: refetchInvoices } = useInvoices()
  const { data: leads } = useLeads()
  const { data: reminders, isLoading: remLoading, refetch: refetchReminders } = useReminders()
  const [isRunning, setIsRunning] = useState(false)
  const queryClient = useQueryClient()

  const openInvoices = invoices?.filter(i => i.status === 'open') || []
  const pendingAmount = openInvoices.reduce((s, i) => s + Number(i.amount), 0)
  const sentReminders = reminders?.filter(r => r.status === 'sent') || []
  const finalNotices = reminders?.filter(r => r.escalationLevel === 3) || []

  const getLeadName = (leadId: string) =>
    leads?.find(l => l.id === leadId)?.companyName || 'Unknown Lead'

  const getInvoiceLead = (invoiceId: string) => {
    const inv = invoices?.find(i => i.id === invoiceId)
    return inv ? getLeadName(inv.leadId) : 'Unknown'
  }

  const handleRunReminders = async () => {
    setIsRunning(true)
    try {
      const res = await fetch(`${BACKEND_URL}/reminders/run`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as any
      toast.success(`Processed ${data.processed} reminders${data.emailsSent > 0 ? `, ${data.emailsSent} emails sent` : ''}`)
      await refetchReminders()
      await refetchInvoices()
      queryClient.invalidateQueries({ queryKey: ['invoiceReminders'] })
    } catch (e: any) {
      toast.error('Failed to run reminders: ' + e.message)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunSmartFollowup = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/smart-followup`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as any
      toast.success(`Smart follow-up: ${data.advanced} sequences advanced`)
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    } catch (e: any) {
      toast.error('Smart follow-up failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Invoice Reminders</h1>
          <p className="text-sm text-slate-400 mt-1">Automated follow-up + SendGrid email escalation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
            onClick={handleRunSmartFollowup}>
            <RefreshCw className="w-4 h-4" /> Smart Follow-up
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-500 gap-2" onClick={handleRunReminders} disabled={isRunning}>
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Reminders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Open Invoices</p>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{openInvoices.length}</p>
          <p className="text-xs text-slate-500 mt-1">${pendingAmount.toLocaleString()} pending</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Reminders Sent</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{sentReminders.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Final Notices</p>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{finalNotices.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{reminders?.filter(r => r.status === 'pending').length || 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-300">Reminder Activity Log</h2>
        </div>
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Lead / Invoice</TableHead>
              <TableHead className="text-slate-400">Type</TableHead>
              <TableHead className="text-slate-400">Escalation</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {remLoading || invLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !reminders?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                  <p className="font-medium">No reminders yet</p>
                  <p className="text-xs mt-1">Click "Run Reminders" to auto-create and send reminders for open invoices</p>
                </TableCell>
              </TableRow>
            ) : (
              reminders.map((r: any) => (
                <TableRow key={r.id} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell className="text-slate-200 font-medium">{getInvoiceLead(r.invoiceId)}</TableCell>
                  <TableCell className="text-slate-400 capitalize text-sm">{r.reminderType?.replace('_', ' ')}</TableCell>
                  <TableCell><EscalationBadge level={r.escalationLevel || 1} /></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {openInvoices.length > 0 && (
        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Open Invoices Awaiting Payment
          </h3>
          <div className="space-y-2">
            {openInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{getLeadName(inv.leadId)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-amber-400">${Number(inv.amount).toLocaleString()}</span>
                  <span className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
