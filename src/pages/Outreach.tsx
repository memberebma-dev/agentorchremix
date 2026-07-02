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
  ChevronRight,
  Eye,
  Loader2,
  ListChecks
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
import { blink } from '@/lib/blink'
import { useQueryClient } from '@tanstack/react-query'

export function OutreachPage() {
  const { data: leads } = useLeads()
  const { data: campaigns, isLoading, isError, error } = useCampaigns()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const queryClient = useQueryClient()
  const [selectedSequence, setSelectedSequence] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isMarkingReplied, setIsMarkingReplied] = useState(false)

  const isOutreachRunning = agentRuns?.some(run => run.agentName === 'Outreach' && run.status === 'running')
  const isQualifyingRunning = agentRuns?.some(run => run.agentName === 'Qualifying' && run.status === 'running')

  const handleStartOutreach = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Outreach' })
      toast.success('Sending outreach to verified leads')
    } catch (error) {
      toast.error('Failed to start outreach')
    }
  }

  const handleRunQualifying = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Qualifying' })
      toast.success('Qualifying agent running — advancing replied/high-score leads')
    } catch (error) {
      toast.error('Failed to start Qualifying agent')
    }
  }

  const getLeadName = (leadId: string) => {
    return leads?.find(l => l.id === leadId)?.companyName || 'Unknown Lead'
  }

  const handleMarkReplied = async () => {
    if (!selectedSequence) return
    setIsMarkingReplied(true)
    try {
      await blink.db.outreachSequences.update(selectedSequence.id, { status: 'replied' })
      await blink.db.outreachAnalytics.create({
        id: crypto.randomUUID(),
        sequenceId: selectedSequence.id,
        leadId: selectedSequence.leadId,
        step: selectedSequence.step,
        eventType: 'replied',
        metadata: JSON.stringify({ manual: true }),
      })
      setSelectedSequence((s: any) => s ? { ...s, status: 'replied' } : s)
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['outreachAnalytics'] })
      toast.success('Marked as replied — click "Run Qualifying" above to advance it')
    } catch {
      toast.error('Failed to mark as replied')
    } finally {
      setIsMarkingReplied(false)
    }
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white gap-2"
            onClick={handleRunQualifying}
            disabled={isQualifyingRunning || startAgent.isPending}
            title="Advance replied/high-score leads toward Proposal, expire stale ones"
          >
            {isQualifyingRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
            Run Qualifying
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-500 gap-2"
            onClick={handleStartOutreach}
            disabled={isOutreachRunning || startAgent.isPending}
            title="Sends real outreach email to every verified, audited lead not yet contacted"
          >
            {isOutreachRunning || startAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start New Sequence
          </Button>
        </div>
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
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-red-400">Failed to load sequences: {(error as Error)?.message || 'Unknown error'}</TableCell>
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-slate-400 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); setSelectedSequence(seq); setIsDetailOpen(true) }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
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
                  <p className={`text-sm font-bold ${selectedSequence.status === 'replied' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedSequence.status === 'replied' ? 'REPLIED' : 'NONE YET'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Last Outbound Message (AI-generated)</p>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {selectedSequence.lastEmailBody || 'No stored email body for this sequence yet — it was created before message logging was added, or is still queued.'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                <p className="text-[10px] font-bold text-teal-500 uppercase mb-2">Next Automated Action</p>
                <p className="text-sm text-slate-300">
                  {selectedSequence.status === 'dead'
                    ? 'Sequence marked dead by the Qualifying agent — no further steps will run.'
                    : selectedSequence.step < 5
                    ? `Step ${selectedSequence.step + 1} (Follow-up) will trigger the next time Smart Follow-up runs, if the lead has been quiet 24h+.`
                    : 'Sequence completed. Awaiting final repurpose deadline.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setIsDetailOpen(false)}>Close</Button>
            {selectedSequence?.status !== 'replied' && selectedSequence?.status !== 'dead' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 gap-2"
                onClick={handleMarkReplied}
                disabled={isMarkingReplied}
              >
                {isMarkingReplied ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Mark as Replied
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
