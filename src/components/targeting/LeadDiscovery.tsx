import { useState } from 'react'
import { TargetingConfig, ScoredLead, Priority } from '@/agents/types'
import { targetingAgent, NICHE_PRESETS, SOURCE_OPTIONS } from '@/agents/targeting-agent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  MapPin,
  Target,
  Filter,
  Download,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface LeadDiscoveryProps {
  onLeadsPulled?: (leads: ScoredLead[]) => void
}

export function LeadDiscovery({ onLeadsPulled }: LeadDiscoveryProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [leads, setLeads] = useState<ScoredLead[]>([])
  const [config, setConfig] = useState<TargetingConfig>({
    niche: 'commercial-bridge-lenders',
    location: 'Southern California',
    radius: 50,
    minScore: 30,
    sources: ['maps', 'directories', 'niche_lists'],
  })

  const handlePullLeads = async () => {
    setIsLoading(true)
    try {
      const pulledLeads = await targetingAgent.pullLeads(config)
      setLeads(pulledLeads)
      onLeadsPulled?.(pulledLeads)
    } catch (error) {
      console.error('Error pulling leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSourceToggle = (source: string) => {
    setConfig(prev => ({
      ...prev,
      sources: prev.sources.includes(source as any)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source as any],
    }))
  }

  const getPriorityBadge = (priority: Priority) => {
    const variants = {
      high: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
      medium: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
      low: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: CheckCircle2 },
    }
    const { color, icon: Icon } = variants[priority]
    return (
      <Badge variant="outline" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Lead Discovery</h2>
          <p className="text-slate-400 mt-1">
            Find and score commercial bridge lenders in Southern California
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30">
            <Target className="w-3 h-3 mr-1" />
            AI Targeting Active
          </Badge>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-400" />
            Targeting Configuration
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure your lead search parameters for commercial bridge lenders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Niche and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Niche</Label>
              <select
                value={config.niche}
                onChange={(e) => setConfig(prev => ({ ...prev, niche: e.target.value }))}
                className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(NICHE_PRESETS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                Location
              </Label>
              <Input
                value={config.location}
                onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location..."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Lead Count Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Target Lead Count</Label>
              <span className="text-teal-400 font-mono">{config.radius} - {config.radius + 50}</span>
            </div>
            <Slider
              value={[config.radius]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, radius: value }))}
              min={50}
              max={500}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>50</span>
              <span>500</span>
            </div>
          </div>

          {/* Minimum Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Minimum Score Threshold
              </Label>
              <span className="text-teal-400 font-mono">{config.minScore}</span>
            </div>
            <Slider
              value={[config.minScore]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, minScore: value }))}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0 (All leads)</span>
              <span>100 (Only perfect)</span>
            </div>
          </div>

          {/* Source Selection */}
          <div className="space-y-3">
            <Label className="text-slate-300">Data Sources</Label>
            <div className="flex flex-wrap gap-3">
              {SOURCE_OPTIONS.map((source) => (
                <label
                  key={source.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    config.sources.includes(source.id as any)
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Checkbox
                    checked={config.sources.includes(source.id as any)}
                    onCheckedChange={() => handleSourceToggle(source.id)}
                  />
                  <span>{source.icon}</span>
                  <span className="text-sm">{source.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pull Leads Button */}
          <Button
            onClick={handlePullLeads}
            disabled={isLoading || config.sources.length === 0}
            className="w-full h-12 bg-teal-600 hover:bg-teal-500 text-white font-medium"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Pulling {config.radius} leads...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Pull Leads
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {leads.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">
                Discovered Leads ({leads.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Scored and prioritized commercial bridge lenders
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Business Name</TableHead>
                    <TableHead className="text-slate-400">Owner</TableHead>
                    <TableHead className="text-slate-400">Score</TableHead>
                    <TableHead className="text-slate-400">Priority</TableHead>
                    <TableHead className="text-slate-400">Website</TableHead>
                    <TableHead className="text-slate-400">SEO</TableHead>
                    <TableHead className="text-slate-400">Source</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.slice(0, 20).map((lead) => (
                    <TableRow key={lead.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">
                        {lead.businessName}
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lead.address}, {lead.city}
                        </p>
                      </TableCell>
                      <TableCell className="text-slate-300">{lead.ownerName}</TableCell>
                      <TableCell>
                        <span className={`font-mono font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </TableCell>
                      <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{lead.websiteQuality}</span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${lead.websiteQuality}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{lead.seoVisibility}</span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${lead.seoVisibility}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 text-slate-400">
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {leads.length > 20 && (
              <p className="text-center text-slate-500 text-sm mt-4">
                Showing top 20 of {leads.length} leads. Use filters to narrow results.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {leads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">{leads.length}</div>
              <p className="text-sm text-slate-400 mt-1">Total Leads Found</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-400">
                {leads.filter(l => l.priority === 'high').length}
              </div>
              <p className="text-sm text-slate-400 mt-1">High Priority</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-amber-400">
                {leads.filter(l => l.priority === 'medium').length}
              </div>
              <p className="text-sm text-slate-400 mt-1">Medium Priority</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-teal-400">
                {Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length)}
              </div>
              <p className="text-sm text-slate-400 mt-1">Avg. Score</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
