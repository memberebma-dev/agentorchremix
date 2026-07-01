import { useLeads, useAssets } from '@/store/pipeline-store'
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
  Sparkles, 
  FileText, 
  Globe, 
  ExternalLink, 
  RefreshCw,
  Eye,
  Layout,
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

export function AssetsPage() {
  const { data: leads } = useLeads()
  const { data: assets, isLoading } = useAssets()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const isGenerating = agentRuns?.some(run => run.agentName === 'Asset Generation' && run.status === 'running')

  const handleBatchGenerate = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Asset Generation' })
      toast.success('Batch asset generation started')
    } catch (error) {
      toast.error('Failed to start generation')
    }
  }

  const getLeadName = (leadId: string) => {
    return leads?.find(l => l.id === leadId)?.companyName || 'Unknown Lead'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight italic">Generated Assets</h1>
          <p className="text-sm text-slate-400 mt-1">AI-built reports and custom websites for value-first outreach</p>
        </div>
        <Button 
          className="bg-teal-600 hover:bg-teal-500 gap-2"
          onClick={handleBatchGenerate}
          disabled={isGenerating || startAgent.isPending}
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Batch Generate
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Lead</TableHead>
              <TableHead className="text-slate-400">Asset Type</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Generated At</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Retrieving assets...</TableCell>
              </TableRow>
            ) : assets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No assets generated yet.</TableCell>
              </TableRow>
            ) : (
              assets?.map((asset) => (
                <TableRow 
                  key={asset.id} 
                  className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                  onClick={() => {
                    setSelectedAsset(asset)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">
                    {getLeadName(asset.leadId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {asset.type === 'audit_report' ? (
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-400/5 px-2 py-1 rounded border border-amber-400/20">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">SEO Audit Report</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-teal-400 bg-teal-400/5 px-2 py-1 rounded border border-teal-400/20">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Custom Website</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Live</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(asset.generatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-400 hover:text-white" asChild>
                        <a href={asset.hostedUrl} target="_blank" rel="noreferrer">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Asset Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <Sparkles className="w-5 h-5 text-teal-400" />
              Asset Details: {getLeadName(selectedAsset?.leadId)}
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="py-6 space-y-6">
              <div className="aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                <Globe className="w-12 h-12 text-slate-800 animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Type</p>
                    <p className="text-sm font-semibold text-white capitalize">{selectedAsset.type.replace('_', ' ')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hosting</p>
                    <p className="text-sm font-semibold text-emerald-400">ACTIVE</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Internal Metadata</p>
                  <p className="text-xs text-slate-400 font-mono">{selectedAsset.content || 'System generated AI asset'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setIsDetailOpen(false)}>Close</Button>
            {selectedAsset?.hostedUrl && (
              <Button className="bg-teal-600 hover:bg-teal-500" asChild>
                <a href={selectedAsset.hostedUrl} target="_blank" rel="noreferrer">Open Preview Site</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
