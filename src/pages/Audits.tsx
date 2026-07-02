import { useState } from 'react'
import { useLeads, useAssets, useScores, useStartAgent, useAgentRuns } from '@/store/pipeline-store'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Search, FileText, Sparkles, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function AuditsPage() {
  const { data: leads, isLoading, isError, error } = useLeads()
  const { data: assets } = useAssets()
  const { data: scores } = useScores()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const isBatchRunning = agentRuns?.some(run => run.agentName === 'Asset Generation' && run.status === 'running' && !run.leadId)

  const getAudit = (leadId: string) => assets?.find(a => a.leadId === leadId && a.type === 'audit_report')
  const getScore = (leadId: string) => scores?.find(s => s.leadId === leadId)?.overallScore

  const isRunningFor = (leadId: string) =>
    agentRuns?.some(run => run.agentName === 'Asset Generation' && run.leadId === leadId && run.status === 'running')

  const handleRunAudit = async (leadId: string) => {
    try {
      await startAgent.mutateAsync({ agentName: 'Asset Generation', leadId })
      toast.success('AI audit started for this lead')
    } catch {
      toast.error('Failed to start audit')
    }
  }

  const handleBatchAudit = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Asset Generation' })
      toast.success('Batch audit started for scored leads')
    } catch {
      toast.error('Failed to start batch audit')
    }
  }

  const selectedLead = leads?.find(l => l.id === selectedLeadId)
  const selectedAudit = selectedLeadId ? getAudit(selectedLeadId) : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">SEO Audit Engine</h1>
          <p className="text-sm text-slate-400 mt-1">AI-generated SEO/AEO audit reports (Groq) for every lead in the pipeline</p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-500 gap-2"
          onClick={handleBatchAudit}
          disabled={isBatchRunning || startAgent.isPending}
        >
          {isBatchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Run Batch Audits
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Lead</TableHead>
              <TableHead className="text-slate-400">Website</TableHead>
              <TableHead className="text-slate-400">Score</TableHead>
              <TableHead className="text-slate-400">Audit Status</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Loading leads...</TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-red-400">Failed to load leads: {(error as Error)?.message || 'Unknown error'}</TableCell>
              </TableRow>
            ) : leads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No leads yet. Run Lead Discovery first.</TableCell>
              </TableRow>
            ) : (
              leads?.map((lead) => {
                const audit = getAudit(lead.id)
                const score = getScore(lead.id)
                const running = isRunningFor(lead.id)
                return (
                  <TableRow
                    key={lead.id}
                    className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                    onClick={() => audit && setSelectedLeadId(lead.id)}
                  >
                    <TableCell className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">
                      <div className="flex items-center gap-2">
                        {lead.companyName}
                        {lead.dataSource === 'ai_estimated' && (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Unverified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{lead.website || '—'}</TableCell>
                    <TableCell className="text-slate-300 font-mono">{score ?? '—'}</TableCell>
                    <TableCell>
                      {audit ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                          <FileText className="w-3 h-3" /> Audited
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 gap-2 text-slate-400 hover:text-white"
                        onClick={() => handleRunAudit(lead.id)}
                        disabled={running || startAgent.isPending}
                      >
                        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {audit ? 'Re-run' : 'Run Audit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLeadId} onOpenChange={(open) => !open && setSelectedLeadId(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <FileText className="w-5 h-5 text-teal-400" />
              SEO Audit: {selectedLead?.companyName}
            </DialogTitle>
          </DialogHeader>
          {selectedAudit && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lead Score</p>
                  <p className="text-2xl font-bold text-white">{getScore(selectedLead!.id) ?? '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Generated</p>
                  <p className="text-sm font-semibold text-slate-300">{new Date(selectedAudit.generatedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI-Generated Audit (Groq Llama 3.3-70b)</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedAudit.content}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setSelectedLeadId(null)}>Close</Button>
            {selectedAudit?.hostedUrl && (
              <Button className="bg-teal-600 hover:bg-teal-500 gap-2" asChild>
                <a href={selectedAudit.hostedUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" /> Open Hosted Report
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
