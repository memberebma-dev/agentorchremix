import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  Lead, 
  LeadScore, 
  OutreachSequence, 
  ActivityItem, 
  PipelineStats, 
  LeadStatus, 
  PipelineStage, 
  GeneratedAsset, 
  Invoice, 
  AgentRun 
} from '@/types/pipeline'
import { blink } from '@/lib/blink'
import { ORCHESTRATOR_URL } from '@/lib/api'
import { loadPipelineConfig } from '@/lib/pipelineConfig'

// Pipeline stages configuration
export const PIPELINE_STAGES: { name: LeadStatus; color: string; label: string }[] = [
  { name: 'new', color: '#64748B', label: 'New Leads' },
  { name: 'scored', color: '#3B82F6', label: 'Scored' },
  { name: 'audited', color: '#8B5CF6', label: 'Audited' },
  { name: 'outreach_sent', color: '#F59E0B', label: 'Outreach Sent' },
  { name: 'responded', color: '#10B981', label: 'Responded' },
  { name: 'qualified', color: '#14B8A6', label: 'Qualified' },
  { name: 'proposal', color: '#F97316', label: 'Proposal' },
  { name: 'onboarded', color: '#0D9488', label: 'Onboarded' },
  { name: 'client', color: '#22C55E', label: 'Clients' },
  { name: 'lost', color: '#EF4444', label: 'Lost' },
]

// React Query hooks
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const leads = await blink.db.leads.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      })
      return leads as Lead[]
    },
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

export function useScores() {
  return useQuery({
    queryKey: ['leadScores'],
    queryFn: async () => {
      const scores = await blink.db.leadScores.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      })
      return scores as LeadScore[]
    },
    staleTime: 30000,
  })
}

export function useAssets() {
  return useQuery({
    queryKey: ['generatedAssets'],
    queryFn: async () => {
      const assets = await blink.db.generatedAssets.list({
        orderBy: { generatedAt: 'desc' },
        limit: 100
      })
      return assets as GeneratedAsset[]
    },
    staleTime: 30000,
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const invoices = await blink.db.invoices.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      })
      return invoices as Invoice[]
    },
    staleTime: 30000,
  })
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const sequences = await blink.db.outreachSequences.list({
        limit: 100
      })
      return sequences as OutreachSequence[]
    },
    staleTime: 30000,
  })
}

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      // Fetching from agent_runs as a proxy for activity
      const runs = await blink.db.agentRuns.list({
        orderBy: { startedAt: 'desc' },
        limit: 10
      })
      return runs.map(run => ({
        id: run.id,
        type: run.status === 'success' ? 'qualified' : 'campaign_started',
        message: `${run.agentName}: ${run.status}`,
        timestamp: run.startedAt,
        leadId: run.leadId
      })) as ActivityItem[]
    },
    staleTime: 15000,
  })
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['pipelineStats'],
    queryFn: async () => {
      const [
        totalLeads,
        totalQualified,
        totalClients,
        totalOutreach,
        paidInvoices,
        allScores
      ] = await Promise.all([
        blink.db.leads.count(),
        blink.db.leads.count({ where: { status: 'qualified' } }),
        blink.db.leads.count({ where: { status: 'client' } }),
        blink.db.outreachSequences.count(),
        blink.db.invoices.list({ where: { status: 'paid' } }),
        blink.db.leadScores.list({ limit: 500 })
      ])

      const responseCount = await blink.db.leads.count({ where: { status: 'responded' } })
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      // Invoices don't carry a separate "paid at" timestamp, so createdAt is the
      // closest approximation available for month-to-date revenue.
      const passiveRevenueMTD = (paidInvoices as Invoice[])
        .filter(inv => new Date(inv.createdAt) >= monthStart)
        .reduce((sum, inv) => sum + Number(inv.amount), 0)
      const passiveRevenue = (paidInvoices as Invoice[]).reduce((sum, inv) => sum + Number(inv.amount), 0)
      const scores = (allScores as LeadScore[])
      const avgLeadScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + Number(s.overallScore), 0) / scores.length)
        : 0

      return {
        totalLeads,
        totalOutreach,
        totalResponses: responseCount,
        totalQualified,
        totalProposals: await blink.db.leads.count({ where: { status: 'proposal' } }),
        totalClients,
        responseRate: totalOutreach > 0 ? (responseCount / totalOutreach) * 100 : 0,
        conversionRate: totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0,
        passiveRevenue,
        passiveRevenueMTD,
        avgLeadScore
      } as PipelineStats
    },
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

export function usePipelineStages() {
  const { data: leads, isLoading, error } = useLeads()
  
  const stages: PipelineStage[] = PIPELINE_STAGES.map(stage => ({
    id: stage.name,
    name: stage.name,
    color: stage.color,
    leads: leads?.filter(lead => lead.status === stage.name) || [],
  }))
  
  return { stages, isLoading, error }
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      return await blink.db.leads.update(leadId, { 
        status, 
        updatedAt: new Date().toISOString() 
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['pipelineStats'] })
    },
  })
}

export function useAgentRuns() {
  return useQuery({
    queryKey: ['agentRuns'],
    queryFn: async () => {
      const runs = await blink.db.agentRuns.list({
        orderBy: { startedAt: 'desc' },
        limit: 50
      })
      return runs as AgentRun[]
    },
    staleTime: 5000,
    refetchInterval: 5000, // Poll more frequently for runs
  })
}

export function useOutreachAnalytics() {
  return useQuery({
    queryKey: ['outreachAnalytics'],
    queryFn: async () => {
      const events = await blink.db.outreachAnalytics.list({
        orderBy: { createdAt: 'desc' },
        limit: 500,
      })
      return events as any[]
    },
    staleTime: 30000,
  })
}

export function useAffiliates() {
  return useQuery({
    queryKey: ['affiliates'],
    queryFn: async () => {
      const affiliates = await blink.db.affiliates.list({
        orderBy: { createdAt: 'desc' },
        limit: 100,
      })
      return affiliates as any[]
    },
    staleTime: 30000,
  })
}

export function useInvoiceReminders() {
  return useQuery({
    queryKey: ['invoiceReminders'],
    queryFn: async () => {
      const reminders = await blink.db.invoiceReminders.list({
        orderBy: { createdAt: 'desc' },
        limit: 200,
      })
      return reminders as any[]
    },
    staleTime: 30000,
  })
}

export function useStartAgent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ agentName, leadId, niche, location }: { agentName: string; leadId?: string; niche?: string; location?: string }) => {
      // 0. Clean up any stuck runs older than 2 minutes before starting
      try {
        const stuckRuns = await blink.db.agentRuns.list({ where: { status: 'running' } })
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        for (const run of stuckRuns) {
          if (run.startedAt < twoMinAgo) {
            await blink.db.agentRuns.update(run.id, { status: 'failed', logsText: 'Timed out', finishedAt: new Date().toISOString() })
          }
        }
      } catch (_) { /* ignore cleanup errors */ }

      // 1. Create the run record in DB so the UI picks it up immediately
      const run = await blink.db.agentRuns.create({
        agentName,
        leadId,
        status: 'running',
        progressPercent: 0,
        logsText: `Starting ${agentName} agent...`,
        startedAt: new Date().toISOString()
      })
      
      // 2. Fire the orchestrator edge function via direct fetch.
      //    Using direct fetch because blink.functions.invoke may wrap payload differently.
      //    Always include the user's saved pipeline config so price/threshold changes in
      //    Settings actually affect what the backend does, instead of being local-only.
      //    We await just long enough to confirm the backend accepted the request — the
      //    actual agent work still runs in the background on the server — so a network
      //    failure or non-2xx response immediately flips the run to "failed" instead of
      //    leaving a "running" card that spins forever with no user-visible error.
      const config = loadPipelineConfig()
      try {
        const res = await fetch(ORCHESTRATOR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: run.id, agentName, leadId, niche, location,
            amount: config.growthPackagePrice,
            threshold: config.leadScoreThreshold,
          }),
        })
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText)
          await blink.db.agentRuns.update(run.id, { status: 'failed', logsText: `Backend rejected request: ${text}`, finishedAt: new Date().toISOString() })
        }
      } catch (err: any) {
        await blink.db.agentRuns.update(run.id, { status: 'failed', logsText: `Could not reach backend: ${err.message}`, finishedAt: new Date().toISOString() })
      }

      return run
    },
    onSuccess: (_data, variables) => {
      // Invalidate immediately so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ['agentRuns'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      // Start aggressive polling for 30s after a run starts
      const pollId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['agentRuns'] })
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        queryClient.invalidateQueries({ queryKey: ['pipelineStats'] })
        queryClient.invalidateQueries({ queryKey: ['generatedAssets'] })
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        queryClient.invalidateQueries({ queryKey: ['activity'] })
        queryClient.invalidateQueries({ queryKey: ['leadScores'] })
      }, 3000)
      setTimeout(() => clearInterval(pollId), 35000)
    },
  })
}

export function useStopAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const running = await blink.db.agentRuns.list({ where: { status: 'running' } }) as AgentRun[]
      for (const run of running) {
        await blink.db.agentRuns.update(run.id, {
          status: 'failed',
          logsText: run.logsText ? run.logsText + ' [STOPPED]' : 'Stopped by user',
          finishedAt: new Date().toISOString()
        })
      }
      return running.length
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentRuns'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}