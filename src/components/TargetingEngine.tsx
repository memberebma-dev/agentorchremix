import { useState, useEffect } from 'react'
import { 
  Search, Plus, Filter, Download, ChevronRight, 
  Target, TrendingUp, Building2, MapPin, Star, AlertCircle,
  CheckCircle, Clock, ArrowUpRight, RefreshCw, Database, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip'
import { useLeads, usePipelineStats, useStartAgent, useAgentRuns } from '@/store/pipeline-store'
import { toast } from 'sonner'
import type { Lead } from '@/types/pipeline'

export default function TargetingEngine() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads()
  const { data: stats } = usePipelineStats()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const isDiscoveryRunning = agentRuns?.some(run => run.agentName === 'Lead Discovery' && run.status === 'running')

  const handleDiscovery = async () => {
    try {
      await startAgent.mutateAsync({ agentName: 'Lead Discovery' });
      toast.success('Lead discovery agent started!');
    } catch (error) {
      toast.error('Failed to start discovery.');
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === '' || 
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/10'
    if (score >= 40) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              Targeting Engine
            </h1>
            <p className="text-muted-foreground mt-1 text-sm italic">
              Autonomous digital agency lead discovery and intelligent scoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleDiscovery}
              disabled={isDiscoveryRunning || startAgent.isPending}
              className="bg-teal-600 hover:bg-teal-500"
            >
              {isDiscoveryRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              {isDiscoveryRunning ? 'Discovering...' : 'Run Discovery Agent'}
            </Button>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="px-6 pb-6 grid grid-cols-4 gap-4">
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">New</p>
                  <p className="text-2xl font-bold text-blue-400">{leads.filter(l => l.status === 'new').length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Qualified</p>
                  <p className="text-2xl font-bold text-green-400">{leads.filter(l => l.status === 'qualified').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
                  <p className="text-2xl font-bold text-teal-400">
                    {leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / leads.length) : 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b bg-card/30">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                </SelectContent>
              </Select>
              
              <Badge variant="outline" className="ml-auto">
                {filteredLeads.length} leads
              </Badge>
            </div>
          </div>

          {/* Leads Table */}
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>
                    <Star className="w-3 h-3 inline mr-1" /> Score
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading leads...</TableCell></TableRow>
                ) : filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-secondary/20"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {lead.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-muted-foreground">{lead.contactEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getScoreColor(lead.leadScore)}`}>
                            {lead.leadScore}
                          </span>
                          <Progress value={lead.leadScore} className="h-1.5 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getScoreBg(70)}`}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Details <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Side Panel - Lead Details */}
        {selectedLead && (
          <div className="w-[400px] border-l bg-card/30 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Lead Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Business</h3>
                  <p className="text-lg font-semibold">{selectedLead.companyName}</p>
                  <p className="text-sm text-slate-400">{selectedLead.contactName}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedLead.location}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
                  <p className="text-sm">{selectedLead.contactEmail}</p>
                  {selectedLead.website && (
                    <a 
                      href={selectedLead.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-teal-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      {selectedLead.website} <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Lead Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(selectedLead.leadScore)}`}>
                      {selectedLead.leadScore}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <AgentButton agentName="Asset Generation" leadId={selectedLead.id} />
                  <AgentButton agentName="SEO Audit" leadId={selectedLead.id} />
                  <AgentButton agentName="Outreach" leadId={selectedLead.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentButton({ agentName, leadId }: { agentName: string; leadId: string }) {
  const startAgent = useStartAgent();
  const { data: agentRuns } = useAgentRuns();
  const isRunning = agentRuns?.some(run => run.agentName === agentName && run.leadId === leadId && run.status === 'running');

  return (
    <Button 
      variant="outline" 
      className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800"
      onClick={() => startAgent.mutate({ agentName, leadId })}
      disabled={startAgent.isPending || isRunning}
    >
      {isRunning ? <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> : <Target className="w-4 h-4" />}
      Run {agentName}
    </Button>
  );
}
