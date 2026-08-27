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
import { ORCHESTRATOR_URL, authedFetch } from '@/lib/api'
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

/**
 * Every table below (leads and everything derived from them) is a shared pool
 * with no platform-level row-level security — Blink's db client does not
 * auto-scope by user. Without this, any authenticated account can read/write
 * every other account's data, which is exactly the cross-account leak this
 * was built to close. Every list/count/create call MUST filter or stamp
 * userId. Throwing when logged out (rather than silently omitting the filter)
 * ensures a query never accidentally runs unscoped.
 */
function currentUserId(): string {
  const id = blink.auth.currentUser()?.id
  if (!id) throw new Error('Not authenticated')
  return id
}

// Resolved (not a function reference) so it's usable as a React Query cache key —
// switching accounts changes this value, which correctly invalidates the cache
// instead of momentarily showing the previous account's cached data.
function currentUserIdKeyPart(): string {
  return blink.auth.currentUser()?.id || 'anon'
}

// React Query hooks
export function useLeads() {
  return useQuery({
    queryKey: ['leads', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      // Leads.tsx search filters this list client-side, so the cap needs to cover
      // the whole pipeline, not just a recent page, or older leads silently become
      // unsearchable. 500 is a stopgap — a real fix is server-side search/pagination.
      const leads = await blink.db.leads.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 500
      })
      return leads as Lead[]
    },
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

export function useScores() {
  return useQuery({
    queryKey: ['leadScores', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const scores = await blink.db.leadScores.list({
        where: { userId },
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
    queryKey: ['generatedAssets', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const assets = await blink.db.generatedAssets.list({
        where: { userId },
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
    queryKey: ['invoices', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const invoices = await blink.db.invoices.list({
        where: { userId },
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
    queryKey: ['campaigns', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const sequences = await blink.db.outreachSequences.list({
        where: { userId },
        limit: 100
      })
      return sequences as OutreachSequence[]
    },
    staleTime: 30000,
  })
}

export function useActivity() {
  return useQuery({
    queryKey: ['activity', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      // Fetching from agent_runs as a proxy for activity
      const runs = await blink.db.agentRuns.list({
        where: { userId },
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
    queryKey: ['pipelineStats', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const [
        totalLeads,
        totalQualified,
        totalClients,
        totalOutreach,
        paidInvoices,
        allScores
      ] = await Promise.all([
        blink.db.leads.count({ where: { userId } }),
        blink.db.leads.count({ where: { userId, status: 'qualified' } }),
        blink.db.leads.count({ where: { userId, status: 'client' } }),
        blink.db.outreachSequences.count({ where: { userId } }),
        blink.db.invoices.list({ where: { userId, status: 'paid' } }),
        blink.db.leadScores.list({ where: { userId }, limit: 500 })
      ])

      const responseCount = await blink.db.leads.count({ where: { userId, status: 'responded' } })
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
        totalProposals: await blink.db.leads.count({ where: { userId, status: 'proposal' } }),
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
    queryKey: ['agentRuns', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const runs = await blink.db.agentRuns.list({
        where: { userId },
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
    queryKey: ['outreachAnalytics', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const events = await blink.db.outreachAnalytics.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 500,
      })
      return events as any[]
    },
    staleTime: 30000,
  })
}

// Affiliates and Subscribers represent AgentOrch's OWN paying customers/referral
// partners (the platform's business, not any one tenant's pipeline) — they are
// intentionally NOT scoped by userId the way pipeline data is. Until real
// admin roles exist, visibility is restricted at the page level (see
// isPlatformOwner in lib/auth.ts) rather than by ownership, since there's no
// single "owner" a subscriber/affiliate row could belong to.
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

export function useSubscribers() {
  return useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const subscribers = await blink.db.subscribers.list({
        orderBy: { createdAt: 'desc' },
        limit: 200,
      })
      return subscribers as any[]
    },
    staleTime: 30000,
  })
}

export function useInvoiceReminders() {
  return useQuery({
    queryKey: ['invoiceReminders', currentUserIdKeyPart()],
    queryFn: async () => {
      const userId = currentUserId()
      const reminders = await blink.db.invoiceReminders.list({
        where: { userId },
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
      const userId = currentUserId()
      // 0. Clean up any stuck runs older than 2 minutes before starting
      try {
        const stuckRuns = await blink.db.agentRuns.list({ where: { userId, status: 'running' } })
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        for (const run of stuckRuns) {
          if (run.startedAt < twoMinAgo) {
            await blink.db.agentRuns.update(run.id, { status: 'failed', logsText: 'Timed out', finishedAt: new Date().toISOString() })
          }
        }
      } catch (_) { /* ignore cleanup errors */ }

      // 1. Create the run record in DB so the UI picks it up immediately
      const run = await blink.db.agentRuns.create({
        userId,
        agentName,
        leadId,
        status: 'running',
        progressPercent: 0,
        logsText: `Starting ${agentName} agent...`,
        startedAt: new Date().toISOString()
      })

      // 2. Fire the orchestrator edge function via authedFetch, so the backend can
      //    verify who's actually calling and scope its own db work to that user —
      //    userId is never sent in the body; the backend never trusts client input
      //    for identity, only the verified session token.
      //    We await just long enough to confirm the backend accepted the request — the
      //    actual agent work still runs in the background on the server — so a network
      //    failure or non-2xx response immediately flips the run to "failed" instead of
      //    leaving a "running" card that spins forever with no user-visible error.
      const config = loadPipelineConfig()
      try {
        const res = await authedFetch(ORCHESTRATOR_URL, {
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
      const userId = currentUserId()
      const running = await blink.db.agentRuns.list({ where: { userId, status: 'running' } }) as AgentRun[]
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
