import { useLeads, useInvoices, usePipelineStats } from '@/store/pipeline-store'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  ExternalLink, 
  DollarSign, 
  CreditCard,
  Plus,
  Eye,
  Loader2
} from 'lucide-react'
import { useState } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { useStartAgent, useAgentRuns } from '@/store/pipeline-store'
import { toast } from 'sonner'

export function InvoicesPage() {
  const { data: leads } = useLeads()
  const { data: invoices, isLoading } = useInvoices()
  const { data: stats } = usePipelineStats()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const isInvoicingRunning = agentRuns?.some(run => run.agentName === 'Invoicing' && run.status === 'running')

  const handleCreateInvoice = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Invoicing' })
      toast.success('Autonomous invoicing started')
    } catch (error) {
      toast.error('Failed to start invoicing')
    }
  }

  const getLeadName = (leadId: string) => {
    return leads?.find(l => l.id === leadId)?.companyName || 'Unknown Lead'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Paid</Badge>
      case 'open': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open</Badge>
      case 'void': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Void</Badge>
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 capitalize">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Financials & Invoicing</h1>
          <p className="text-sm text-slate-400 mt-1">Stripe-powered passive revenue tracking</p>
        </div>
        <Button 
          className="bg-teal-600 hover:bg-teal-500 gap-2"
          onClick={handleCreateInvoice}
          disabled={isInvoicingRunning || startAgent.isPending}
        >
          {isInvoicingRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passive Revenue (MTD)</p>
            <p className="text-3xl font-bold text-white mt-1">${(stats?.passiveRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Collection</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${(invoices?.filter(i => i.status === 'open').reduce((sum, i) => sum + i.amount, 0) || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Lead</TableHead>
              <TableHead className="text-slate-400">Amount</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Created At</TableHead>
              <TableHead className="text-slate-400 text-right">Stripe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Loading invoices...</TableCell>
              </TableRow>
            ) : invoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No invoices generated yet.</TableCell>
              </TableRow>
            ) : (
              invoices?.map((inv) => (
                <TableRow 
                  key={inv.id} 
                  className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                  onClick={() => {
                    setSelectedInvoice(inv)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">
                    {getLeadName(inv.leadId)}
                  </TableCell>
                  <TableCell className="text-slate-200 font-mono">
                    ${inv.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(inv.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {inv.stripeInvoiceId ? (
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-teal-500 hover:text-teal-400" asChild>
                        <a href={`https://dashboard.stripe.com/invoices/${inv.stripeInvoiceId}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No link</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <Receipt className="w-5 h-5 text-teal-400" />
              Financial Transaction: {getLeadName(selectedInvoice?.leadId)}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Invoice Amount</p>
                <p className="text-5xl font-bold text-white">${selectedInvoice.amount.toLocaleString()}</p>
                <Badge className={`mt-4 ${
                  selectedInvoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                } uppercase tracking-widest px-4 py-1`}>
                  {selectedInvoice.status}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Stripe Reference</p>
                    <p className="text-xs text-slate-300 font-mono truncate">{selectedInvoice.stripeInvoiceId || 'LOCAL_DRAFT'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Issue Date</p>
                    <p className="text-xs text-slate-300">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Service Package</p>
                  <p className="text-sm text-slate-300 font-medium">Digital Agency Growth Package (Monthly Subscription)</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setIsDetailOpen(false)}>Close</Button>
            {selectedInvoice?.stripeInvoiceId && (
              <Button className="bg-teal-600 hover:bg-teal-500 gap-2" asChild>
                <a href={`https://dashboard.stripe.com/invoices/${selectedInvoice.stripeInvoiceId}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" /> Open in Stripe
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
