// Lead Types
export interface Lead {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  niche: string;
  score: number;
  status: LeadStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface LeadSource {
  id: string;
  name: string;
  type: 'maps' | 'directory' | 'csv' | 'api';
  leadCount: number;
  lastSync: string;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  leads: string[];
  channel: Channel;
  createdAt: string;
  stats: CampaignStats;
}

export type CampaignType = 'outreach' | 'followup' | 'nurture';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type Channel = 'email' | 'sms' | 'voicemail' | 'multi';

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  booked: number;
}

// Asset Types
export interface PrebuiltSite {
  id: string;
  leadId: string;
  niche: string;
  businessName: string;
  template: string;
  content: SiteContent;
  assets: SiteAssets;
  status: 'generating' | 'ready' | 'failed';
  shareUrl: string;
  createdAt: string;
}

export interface SiteContent {
  headline: string;
  subheadline: string;
  services: string[];
  testimonials: string[];
  cta: string;
}

export interface SiteAssets {
  logo: string;
  heroImage: string;
  images: string[];
  video: string;
}

// SEO Audit Types
export interface SEOAudit {
  id: string;
  leadId: string;
  website: string;
  gbpScore: number;
  webScore: number;
  issues: SEOIssue[];
  opportunities: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface SEOIssue {
  category: 'technical' | 'onpage' | 'offpage' | 'content';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

// Proposal Types
export interface Proposal {
  id: string;
  leadId: string;
  tier: 'starter' | 'growth' | 'domination';
  pricing: ProposalPricing;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  createdAt: string;
  sentAt: string;
}

export interface ProposalPricing {
  setup: number;
  monthly: number;
  setupDiscount: number;
  total: number;
}

// Onboarding Types
export interface Onboarding {
  id: string;
  clientId: string;
  status: OnboardingStatus;
  step: number;
  documents: OnboardingDoc[];
  tasks: OnboardingTask[];
  startDate: string;
}

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface OnboardingDoc {
  name: string;
  type: string;
  url: string;
  status: 'pending' | 'ready' | 'sent';
}

export interface OnboardingTask {
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}

// Analytics Types
export interface PipelineMetrics {
  totalLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  revenue: number;
  weeklyGrowth: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsBySource: Record<string, number>;
  outreachPerformance: {
    sent: number;
    openRate: number;
    replyRate: number;
    bookingRate: number;
  };
}
