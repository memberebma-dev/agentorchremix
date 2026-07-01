import { useLeads, useScores } from '@/store/pipeline-store'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, DollarSign, Search, Target, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useStartAgent, useAgentRuns } from '@/store/pipeline-store'
import { toast } from 'sonner'

export function ScoresPage() {
  const { data: leads } = useLeads()
  const { data: scores, isLoading } = useScores()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const isScoringRunning = agentRuns?.some(run => run.agentName === 'Scoring' && run.status === 'running')

  const handleBatchScore = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Scoring' })
      toast.success('Batch lead scoring started')
    } catch (error) {
      toast.error('Failed to start scoring')
    }
  }

  const getLeadName = (leadId: string) => {
    return leads?.find(l => l.id === leadId)?.companyName || 'Unknown Lead'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-teal-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Lead Analysis & Scoring</h1>
          <p className="text-sm text-slate-400 mt-1">Algorithmic prioritization based on digital maturity and potential value</p>
        </div>
        <Button 
          className="bg-teal-600 hover:bg-teal-500 gap-2"
          onClick={handleBatchScore}
          disabled={isScoringRunning || startAgent.isPending}
        >
          {isScoringRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Run Batch Scoring
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-teal-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Avg Likelihood</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {scores && scores.length > 0
              ? `${Math.round(scores.reduce((s, sc) => s + sc.conversionLikelihood, 0) / scores.length)}%`
              : '—'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Value</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${scores
              ? scores.reduce((s, sc) => s + (Number(sc.potentialServicesValue) || 0), 0).toLocaleString()
              : '0'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">High Intent</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {scores ? `${scores.filter(sc => sc.conversionLikelihood >= 70).length} Leads` : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Lead</TableHead>
              <TableHead className="text-slate-400">Overall Score</TableHead>
              <TableHead className="text-slate-400">Services Value</TableHead>
              <TableHead className="text-slate-400">Digital Maturity</TableHead>
              <TableHead className="text-slate-400">Conversion Likelihood</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Calculating scores...</TableCell>
              </TableRow>
            ) : scores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No scored leads yet.</TableCell>
              </TableRow>
            ) : (
              scores?.map((score) => {
                const lead = leads?.find(l => l.id === score.leadId)
                return (
                  <TableRow 
                    key={score.id} 
                    className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                    onClick={() => {
                      if (lead) {
                        setSelectedLead(lead)
                        setIsDetailOpen(true)
                      }
                    }}
                  >
                    <TableCell className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">
                      {lead?.companyName || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getScoreColor(score.overallScore)}`}>{score.overallScore}</span>
                        <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-teal-500" 
                            style={{ width: `${score.overallScore}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono">
                      ${score.potentialServicesValue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase">
                          <span>SEO/Ads</span>
                          <span>{score.searchActivityScore}%</span>
                        </div>
                        <Progress value={score.searchActivityScore} className="h-1 bg-slate-800" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getScoreColor(score.conversionLikelihood)} border-current bg-current/5`}>
                        {score.conversionLikelihood}% Likely
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <Target className="w-5 h-5 text-teal-400" />
              Lead Score Intelligence: {selectedLead?.companyName}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Intent Score</p>
                  <p className="text-2xl font-bold text-white">82</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Likelihood</p>
                  <p className="text-2xl font-bold text-teal-400">75%</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">Analysis Breakdown</p>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 space-y-2">
                  <p>• High search visibility gap identified in "SEO Services" keywords.</p>
                  <p>• No active Generative Engine Optimization (GEO) footprint detected.</p>
                  <p>• Recent job postings for marketing roles suggest growth intent.</p>
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
