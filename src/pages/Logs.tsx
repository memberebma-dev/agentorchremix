import { useAgentRuns, useLeads } from '@/store/pipeline-store'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  ScrollText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Terminal,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function LogsPage() {
  const { data: leads } = useLeads()
  const { data: runs, isLoading } = useAgentRuns()
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const getLeadName = (leadId?: string) => {
    if (!leadId) return '-'
    return leads?.find(l => l.id === leadId)?.companyName || 'Unknown'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>
      case 'failed': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>
      case 'running': return <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Running</Badge>
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Autonomous Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time system activity and agent execution history</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Terminal className="w-3 h-3 text-teal-500" />
          System Status: <span className="text-emerald-400 font-bold ml-1">OPTIMAL</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Agent</TableHead>
              <TableHead className="text-slate-400">Lead Context</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Progress</TableHead>
              <TableHead className="text-slate-400">Started At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Retrieving logs...</TableCell>
              </TableRow>
            ) : runs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No agent activity logged yet.</TableCell>
              </TableRow>
            ) : (
              runs?.map((run) => (
                <TableRow 
                  key={run.id} 
                  className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                  onClick={() => {
                    setSelectedRun(run)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">{run.agentName}</span>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors font-mono truncate max-w-[200px]">
                        {run.logsText}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {getLeadName(run.leadId)}
                  </TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 w-8">{run.progressPercent}%</span>
                      <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 transition-all duration-500" 
                          style={{ width: `${run.progressPercent}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(run.startedAt).toLocaleString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <Terminal className="w-5 h-5 text-teal-400" />
              Agent Execution Log: {selectedRun?.agentName}
            </DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="py-6 space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-teal-500/80 leading-relaxed max-h-[300px] overflow-y-auto">
                <p className="text-slate-500 mb-2">[{new Date(selectedRun.startedAt).toISOString()}] INITIALIZING_AGENT</p>
                <p className="text-slate-500 mb-2">[{new Date(selectedRun.startedAt).toISOString()}] ATTACHING_CONTEXT: {getLeadName(selectedRun.leadId)}</p>
                <p className="text-white whitespace-pre-wrap">{selectedRun.logsText}</p>
                {selectedRun.status === 'success' && (
                  <p className="text-emerald-500 mt-2">[{selectedRun.finishedAt ? new Date(selectedRun.finishedAt).toISOString() : '...'}] EXECUTION_SUCCESSFUL</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                  <p className={`text-sm font-bold uppercase ${
                    selectedRun.status === 'success' ? 'text-emerald-400' : 'text-teal-400'
                  }`}>{selectedRun.status}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</p>
                  <p className="text-sm font-bold text-white">4.2s</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}