import { useLeads, useCampaigns } from '@/store/pipeline-store'
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
  Send, 
  Mail, 
  MessageSquare, 
  Clock, 
  Play,
  Pause,
  ChevronRight,
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

export function OutreachPage() {
  const { data: leads } = useLeads()
  const { data: campaigns, isLoading } = useCampaigns()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const [selectedSequence, setSelectedSequence] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const isOutreachRunning = agentRuns?.some(run => run.agentName === 'Outreach' && run.status === 'running')

  const handleStartOutreach = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Outreach' })
      toast.success('Autonomous outreach sequence started')
    } catch (error) {
      toast.error('Failed to start outreach')
    }
  }

  const getLeadName = (leadId: string) => {
    return leads?.find(l => l.id === leadId)?.companyName || 'Unknown Lead'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
      case 'replied': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Replied</Badge>
      case 'dead': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Dead</Badge>
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Pending</Badge>
    }
  }

  const sequenceSteps = [
    { step: 1, title: 'Value Drop', desc: 'Audit + Website Preview' },
    { step: 2, title: 'The Ask', desc: 'Retain site + Add services' },
    { step: 3, title: 'Pricing Menu', desc: 'Package options + Invoice' },
    { step: 4, title: 'Final Notice', desc: 'Repurpose alert (48h)' },
    { step: 5, title: 'Repurposed', desc: 'Assets moved to next lead' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Smart Outreach Flow</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-channel value-driven engagement sequences</p>
        </div>
        <Button 
          className="bg-teal-600 hover:bg-teal-500 gap-2"
          onClick={handleStartOutreach}
          disabled={isOutreachRunning || startAgent.isPending}
        >
          {isOutreachRunning || startAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Start New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {sequenceSteps.map((s) => (
          <div key={s.step} className="p-3 rounded-lg bg-slate-900 border border-slate-800 relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 text-slate-800 font-bold text-4xl group-hover:text-teal-500/10 transition-colors">{s.step}</div>
            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mb-1">Step {s.step}</p>
            <p className="text-sm font-semibold text-slate-200">{s.title}</p>
            <p className="text-[10px] text-slate-500 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Lead</TableHead>
              <TableHead className="text-slate-400">Current Step</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Last Activity</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Loading sequences...</TableCell>
              </TableRow>
            ) : campaigns?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No active outreach sequences.</TableCell>
              </TableRow>
            ) : (
              campaigns?.map((seq) => (
                <TableRow 
                  key={seq.id} 
                  className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                  onClick={() => {
                    setSelectedSequence(seq)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">
                    {getLeadName(seq.leadId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div 
                            key={s} 
                            className={`w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold ${
                              s <= seq.step ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 ml-2">Step {seq.step} of 5</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(seq.status)}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {seq.lastSentAt ? new Date(seq.lastSentAt).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Pause className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Outreach Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <Send className="w-5 h-5 text-teal-400" />
              Sequence Intelligence: {getLeadName(selectedSequence?.leadId)}
            </DialogTitle>
          </DialogHeader>
          {selectedSequence && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Step</p>
                  <p className="text-xl font-bold text-white">{selectedSequence.step}/5</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                  <p className="text-sm font-bold text-teal-400 uppercase">{selectedSequence.status}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Response</p>
                  <p className="text-sm font-bold text-slate-400">NONE</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Last Outbound Message</p>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 font-mono leading-relaxed italic">
                  "I just finished building a custom SEO-optimized website for {getLeadName(selectedSequence?.leadId)}. 
                  I noticed some major visibility gaps in your current setup. Would you like to keep the preview site?"
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                <p className="text-[10px] font-bold text-teal-500 uppercase mb-2">Next Automated Action</p>
                <p className="text-sm text-slate-300">
                  {selectedSequence.step < 5 
                    ? `Step ${selectedSequence.step + 1} (Follow-up) will trigger in 42 hours if no response.`
                    : 'Sequence completed. Awaiting final repurpose deadline.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setIsDetailOpen(false)}>Close</Button>
            <Button className="bg-teal-600 hover:bg-teal-500 gap-2">
              <Play className="w-4 h-4" />
              Manual Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
