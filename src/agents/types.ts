// Types for the Targeting Agent

export interface TargetingConfig {
  niche: string
  location: string
  radius: number
  minScore: number
  sources: ('maps' | 'directories' | 'niche_lists' | 'yelp' | 'google')[]
}

export interface ScoredLead {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  source: string
  score: number
  websiteQuality: number
  seoVisibility: number
  competitiveGaps: string[]
  priority: Priority
}

export type Priority = 'high' | 'medium' | 'low'

export interface ScoringBreakdown {
  websiteQuality: {
    score: number
    weight: number
    contribution: number
  }
  seoVisibility: {
    score: number
    weight: number
    contribution: number
  }
  competitiveGaps: {
    score: number
    weight: number
    contribution: number
  }
  total: number
}

export interface PriorityDistribution {
  high: number
  medium: number
  low: number
}
