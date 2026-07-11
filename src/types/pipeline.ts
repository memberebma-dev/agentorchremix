export interface Lead {
  id: string
  userId?: string
  companyName: string
  website: string
  contactEmail: string
  contactName: string
  phone: string
  source: string
  /** How this lead's contact data was sourced. 'ai_estimated' means an LLM guessed it and it is NOT verified accurate. 'intent' means it was surfaced by Intent Discovery from a real public post expressing purchase intent. */
  dataSource?: 'google_maps' | 'ai_estimated' | 'manual' | 'intent'
  /** Affiliate referral code this lead should be credited to on payment, if any. */
  referralCode?: string
  niche?: string
  location?: string
  leadScore?: number
  /** Intent Discovery only: source URL of the public post that surfaced this lead. */
  intentUrl?: string
  /** Intent Discovery only: quoted excerpt expressing the pain point/purchase intent. */
  intentContext?: string
  /** Intent Discovery only: 0-100 AI-assessed intent strength. */
  intentScore?: number
  status: LeadStatus
  /** 0/1. Whether a human has explicitly verified this lead for autonomous outreach/invoicing — never auto-set to true. */
  consentObtained: number
  createdAt: string
  updatedAt: string
}

export type LeadStatus = 'new' | 'scored' | 'audited' | 'outreach_sent' | 'responded' | 'qualified' | 'proposal' | 'onboarded' | 'client' | 'lost'

export interface LeadScore {
  id: string
  leadId: string
  conversionLikelihood: number
  potentialServicesValue: number
  overallScore: number
  /** JSON-stringified string[] of specific issues found for this lead (no website, low reviews, etc). */
  issuesJson?: string
  createdAt: string
}

export interface GeneratedAsset {
  id: string
  leadId: string
  type: 'audit_report' | 'custom_website'
  content?: string
  hostedUrl?: string
  generatedAt: string
}

export interface OutreachSequence {
  id: string
  leadId: string
  step: number
  status: 'pending' | 'sent' | 'replied' | 'dead'
  emailSentAt?: string
  replyText?: string
  lastSentAt?: string
  lastEmailBody?: string
  createdAt: string
}

export interface Invoice {
  id: string
  leadId: string
  stripeInvoiceId?: string
  amount: number
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  createdAt: string
}

export interface AgentRun {
  id: string
  agentName: string
  leadId?: string
  status: 'pending' | 'running' | 'success' | 'failed'
  logsText: string
  progressPercent: number
  startedAt: string
  finishedAt?: string
}

export interface ActivityItem {
  id: string
  type: 'lead_added' | 'outreach_sent' | 'response_received' | 'qualified' | 'proposal_sent' | 'client_won' | 'campaign_started' | 'campaign_paused'
  message: string
  timestamp: string
  leadId?: string
}

export interface PipelineStage {
  id: string
  name: LeadStatus
  leads: Lead[]
  color: string
}

export interface PipelineStats {
  totalLeads: number
  totalOutreach: number
  totalResponses: number
  totalQualified: number
  totalProposals: number
  totalClients: number
  responseRate: number
  conversionRate: number
  passiveRevenue: number
  passiveRevenueMTD: number
  avgLeadScore: number
}
