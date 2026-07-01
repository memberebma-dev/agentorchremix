export interface Lead {
  id: string
  userId?: string
  companyName: string
  website: string
  contactEmail: string
  contactName: string
  phone: string
  source: string
  status: LeadStatus
  consentObtained: boolean
  createdAt: string
  updatedAt: string
}

export type LeadStatus = 'new' | 'scored' | 'audited' | 'outreach_sent' | 'responded' | 'qualified' | 'proposal' | 'onboarded' | 'client' | 'lost'

export interface LeadScore {
  id: string
  leadId: string
  conversionLikelihood: number
  potentialServicesValue: number
  searchActivityScore: number
  paidAdsActivity: number
  overallScore: number
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
}
