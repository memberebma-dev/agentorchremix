import { useState, useEffect } from 'react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Users, Plus, Copy, Loader2, Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const BACKEND_URL = 'https://s5ksm5ty.backend.blink.new'

interface Affiliate {
  id: string
  name: string
  email: string
  referralCode: string
  commissionRate: number
  totalReferrals: number
  totalEarned: number
  status: 'active' | 'inactive'
  createdAt: string
}

export function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', commissionRate: '20' })

  const fetchAffiliates = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/affiliates`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Affiliate[]
      setAffiliates(data)
    } catch (e: any) {
      toast.error('Failed to load affiliates: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAffiliates() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return }
    setIsSubmitting(true)
    try {
      const res = await fetch(`${BACKEND_URL}/affiliates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Affiliate created successfully')
      setIsCreateOpen(false)
      setForm({ name: '', email: '', commissionRate: '20' })
      await fetchAffiliates()
    } catch (e: any) {
      toast.error('Failed to create affiliate: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/affiliates/${id}`, { method: 'DELETE' })
      toast.success('Affiliate deactivated')
      await fetchAffiliates()
    } catch {
      toast.error('Failed to deactivate affiliate')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(`https://agentorch.io?ref=${code}`)
    toast.success('Referral link copied!')
  }

  const totalRevenue = affiliates.reduce((s, a) => s + Number(a.totalEarned), 0)
  const activeCount = affiliates.filter(a => a.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Affiliate Program</h1>
          <p className="text-sm text-slate-400 mt-1">Referral tracking and commission management</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-500 gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Add Affiliate
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Affiliates</p>
          <p className="text-3xl font-bold text-white">{activeCount}</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Referrals</p>
          <p className="text-3xl font-bold text-white">{affiliates.reduce((s, a) => s + (a.totalReferrals || 0), 0)}</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Commissions Paid</p>
          <p className="text-3xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Affiliate</TableHead>
              <TableHead className="text-slate-400">Referral Code</TableHead>
              <TableHead className="text-slate-400">Commission</TableHead>
              <TableHead className="text-slate-400">Referrals</TableHead>
              <TableHead className="text-slate-400">Earned</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : affiliates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                  <p className="font-medium">No affiliates yet</p>
                  <p className="text-xs mt-1">Add your first affiliate to start the referral program</p>
                </TableCell>
              </TableRow>
            ) : (
              affiliates.map((aff) => (
                <TableRow key={aff.id} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-200">{aff.name}</p>
                      <p className="text-xs text-slate-500">{aff.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-teal-400 bg-teal-400/5 border border-teal-400/20 px-2 py-1 rounded">
                        {aff.referralCode}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white"
                        onClick={() => copyCode(aff.referralCode)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{aff.commissionRate}%</TableCell>
                  <TableCell className="text-slate-300">{aff.totalReferrals || 0}</TableCell>
                  <TableCell className="font-mono text-emerald-400">${Number(aff.totalEarned).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={aff.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}>
                      {aff.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => copyCode(aff.referralCode)}>
                        <Link2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400"
                        onClick={() => handleDeactivate(aff.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white italic flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" /> Add New Affiliate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com" type="email"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Commission Rate (%)</label>
              <input value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                type="number" min="5" max="50"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-slate-400" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-500" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Affiliate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
