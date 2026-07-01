import { useState, useMemo } from 'react'
import { ScoredLead, Priority } from '@/agents/types'
import { targetingAgent } from '@/agents/targeting-agent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Star,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react'

interface LeadScoringProps {
  leads: ScoredLead[]
}

export function LeadScoring({ leads }: LeadScoringProps) {
  const [selectedLead, setSelectedLead] = useState<ScoredLead | null>(leads[0] || null)

  const distribution = useMemo(() => targetingAgent.getPriorityDistribution(leads), [leads])
  
  const scoreBreakdown = useMemo(() => {
    if (!selectedLead) return null
    return targetingAgent.getScoringBreakdown(selectedLead)
  }, [selectedLead])

  const topOpportunities = useMemo(() => {
    return [...leads]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [leads])

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'low':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-slate-400'
  }

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-slate-500'
  }

  const totalLeads = distribution.high + distribution.medium + distribution.low

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Lead Scoring</h2>
          <p className="text-slate-400 mt-1">
            Analyze lead quality and identify top opportunities
          </p>
        </div>
        <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30">
          <BarChart3 className="w-3 h-3 mr-1" />
          {leads.length} Leads Scored
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Breakdown Card */}
        <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Score Breakdown
            </CardTitle>
            <CardDescription className="text-slate-400">
              Detailed scoring analysis for selected lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLead && scoreBreakdown ? (
              <div className="space-y-6">
                {/* Selected Lead Info */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedLead.businessName}</h3>
                    <p className="text-sm text-slate-400">{selectedLead.ownerName} • {selectedLead.city}, {selectedLead.state}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(scoreBreakdown.total)}`}>
                      {scoreBreakdown.total}
                    </div>
                    <p className="text-xs text-slate-500">Total Score</p>
                  </div>
                </div>

                {/* Scoring Components */}
                <div className="space-y-4">
                  {/* Website Quality */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="text-slate-300 font-medium">Website Quality</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{scoreBreakdown.websiteQuality.score}/100</span>
                        <span className="text-xs text-slate-500">({scoreBreakdown.websiteQuality.weight.toFixed(0)}% weight)</span>
                      </div>
                    </div>
                    <Progress 
                      value={scoreBreakdown.websiteQuality.score} 
                      className="h-2 bg-slate-700"
                      indicatorClassName="bg-teal-500"
                    />
                    <p className="text-xs text-slate-500">
                      Contribution: <span className="text-teal-400">+{scoreBreakdown.websiteQuality.contribution} points</span>
                    </p>
                  </div>

                  {/* SEO Visibility */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-slate-300 font-medium">SEO Visibility</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{scoreBreakdown.seoVisibility.score}/100</span>
                        <span className="text-xs text-slate-500">({scoreBreakdown.seoVisibility.weight.toFixed(0)}% weight)</span>
                      </div>
                    </div>
                    <Progress 
                      value={scoreBreakdown.seoVisibility.score} 
                      className="h-2 bg-slate-700"
                      indicatorClassName="bg-amber-500"
                    />
                    <p className="text-xs text-slate-500">
                      Contribution: <span className="text-amber-400">+{scoreBreakdown.seoVisibility.contribution} points</span>
                    </p>
                  </div>

                  {/* Competitive Gaps */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-slate-300 font-medium">Competitive Gaps</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{scoreBreakdown.competitiveGaps.score}/100</span>
                        <span className="text-xs text-slate-500">({scoreBreakdown.competitiveGaps.weight.toFixed(0)}% weight)</span>
                      </div>
                    </div>
                    <Progress 
                      value={scoreBreakdown.competitiveGaps.score} 
                      className="h-2 bg-slate-700"
                      indicatorClassName="bg-red-500"
                    />
                    <p className="text-xs text-slate-500">
                      Contribution: <span className="text-red-400">+{scoreBreakdown.competitiveGaps.contribution} points</span>
                    </p>
                  </div>
                </div>

                {/* Competitive Gaps Identified */}
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Identified Opportunities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.competitiveGaps.map((gap, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-red-500/10 text-red-400 border-red-500/30"
                      >
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leads selected for scoring analysis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-400" />
              Priority Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">
              Leads grouped by priority level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* High Priority */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">High Priority</span>
                </div>
                <span className="text-red-400 font-medium">{distribution.high}</span>
              </div>
              <Progress 
                value={totalLeads ? (distribution.high / totalLeads) * 100 : 0} 
                className="h-2 bg-slate-700"
                indicatorClassName="bg-red-500"
              />
              <p className="text-xs text-slate-500">
                {totalLeads ? ((distribution.high / totalLeads) * 100).toFixed(1) : 0}% of total
              </p>
            </div>

            {/* Medium Priority */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Medium Priority</span>
                </div>
                <span className="text-amber-400 font-medium">{distribution.medium}</span>
              </div>
              <Progress 
                value={totalLeads ? (distribution.medium / totalLeads) * 100 : 0} 
                className="h-2 bg-slate-700"
                indicatorClassName="bg-amber-500"
              />
              <p className="text-xs text-slate-500">
                {totalLeads ? ((distribution.medium / totalLeads) * 100).toFixed(1) : 0}% of total
              </p>
            </div>

            {/* Low Priority */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Low Priority</span>
                </div>
                <span className="text-slate-400 font-medium">{distribution.low}</span>
              </div>
              <Progress 
                value={totalLeads ? (distribution.low / totalLeads) * 100 : 0} 
                className="h-2 bg-slate-700"
                indicatorClassName="bg-slate-500"
              />
              <p className="text-xs text-slate-500">
                {totalLeads ? ((distribution.low / totalLeads) * 100).toFixed(1) : 0}% of total
              </p>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Leads</span>
                <span className="text-white font-bold">{totalLeads}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Opportunities */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-teal-400" />
            Top Opportunities
          </CardTitle>
          <CardDescription className="text-slate-400">
            Highest scoring leads ready for outreach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topOpportunities.map((lead, index) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedLead?.id === lead.id
                    ? 'bg-teal-500/10 border-teal-500/30'
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-mono text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{lead.businessName}</h4>
                    <p className="text-sm text-slate-400">
                      {lead.ownerName} • {lead.city}, {lead.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={getPriorityColor(lead.priority)}>
                    {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                  </Badge>
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Score</span>
                      <span className={`font-mono font-bold ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getBarColor(lead.score)}`}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Import Button component
import { Button } from '@/components/ui/button'
