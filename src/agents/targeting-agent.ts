// Targeting Agent - Lead Discovery & Scoring System for Commercial Bridge Lenders

import { ScoredLead, TargetingConfig, Priority } from './types'

// Weight configuration for scoring algorithm
const SCORING_WEIGHTS = {
  websiteQuality: 0.35,
  seoVisibility: 0.30,
  competitiveGaps: 0.35,
}

// Predefined niches for commercial bridge lenders
export const NICHE_PRESETS = {
  'commercial-bridge-lenders': {
    name: 'Commercial Bridge Lenders',
    keywords: [
      'commercial bridge loan',
      'hard money lender',
      'private money lending',
      'fix and flip financing',
      'construction loans',
      'short-term commercial loans',
      'bridge financing',
      'asset-based lending',
      'commercial real estate financing',
      'private equity lending',
    ],
    cities: [
      'Los Angeles',
      'Orange County',
      'San Diego',
      'Inland Empire',
      'Beverly Hills',
      'Santa Monica',
      'Irvine',
      'Newport Beach',
      'La Jolla',
      'Pasadena',
    ],
  },
}

// Predefined sources for lead discovery
export const SOURCE_OPTIONS = [
  { id: 'maps', label: 'Google Maps', icon: '📍' },
  { id: 'directories', label: 'Business Directories', icon: '📁' },
  { id: 'niche_lists', label: 'Niche Lists', icon: '🎯' },
  { id: 'yelp', label: 'Yelp', icon: '⭐' },
  { id: 'google', label: 'Google Search', icon: '🔍' },
] as const

// Mock data generator for demonstration
function generateMockLeads(config: TargetingConfig): ScoredLead[] {
  const { location, minScore, sources } = config
  const leads: ScoredLead[] = []
  
  const businessNames = [
    'Pacific Bridge Capital',
    'SoCal Hard Money',
    'Coastal Private Lending',
    'Golden State Funding',
    'Meridian Commercial Loans',
    'Summit Bridge Lenders',
    'Apex Private Capital',
    'Horizon Lending Group',
    'Prime Asset Funding',
    'Velocity Commercial Finance',
    'Titan Lending Solutions',
    'Atlas Private Money',
    'Monarch Capital Group',
    'Platinum Bridge Loans',
    'Elite Commercial Funding',
    'Capital Quest Advisors',
    'Quantum Lending Partners',
    'Sterling Private Capital',
    'Phoenix Rising Finance',
    'Vanguard Commercial Lending',
  ]

  const ownerFirstNames = ['Michael', 'David', 'James', 'Robert', 'John', 'Thomas', 'Daniel', 'William', 'Kevin', 'Brian']
  const ownerLastNames = ['Chen', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez']

  const streets = ['Wilshire Blvd', 'Sunset Blvd', 'Santa Monica Blvd', 'Ocean Ave', 'Broadway', 'Ventura Blvd', 'Fairfax Ave', 'Melrose Ave', 'Rodeo Drive', 'La Cienega Blvd']

  const leadCount = Math.floor(Math.random() * 450) + 50 // 50-500 range

  for (let i = 0; i < Math.min(leadCount, 20); i++) {
    const websiteQuality = Math.floor(Math.random() * 70) + 30 // 30-100
    const seoVisibility = Math.floor(Math.random() * 70) + 30 // 30-100
    const competitiveGaps = Math.floor(Math.random() * 60) + 40 // 40-100
    
    const score = Math.round(
      websiteQuality * SCORING_WEIGHTS.websiteQuality +
      seoVisibility * SCORING_WEIGHTS.seoVisibility +
      competitiveGaps * SCORING_WEIGHTS.competitiveGaps
    )

    if (score >= minScore) {
      const firstName = ownerFirstNames[Math.floor(Math.random() * ownerFirstNames.length)]
      const lastName = ownerLastNames[Math.floor(Math.random() * ownerLastNames.length)]
      const streetNum = Math.floor(Math.random() * 9000) + 100
      const street = streets[Math.floor(Math.random() * streets.length)]
      const city = NICHE_PRESETS['commercial-bridge-lenders'].cities[Math.floor(Math.random() * NICHE_PRESETS['commercial-bridge-lenders'].cities.length)]
      const source = sources[Math.floor(Math.random() * sources.length)]

      // Generate competitive gaps
      const gapOptions = [
        'No Google Business Profile',
        'Missing SEO strategy',
        'No video marketing',
        'Outdated website design',
        'No social media presence',
        'Limited online reviews',
        'No email marketing',
        'Weak call-to-action',
        'No blog/content marketing',
        'Slow website loading',
      ]
      
      const numGaps = Math.floor(Math.random() * 4) + 1
      const selectedGaps = gapOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, numGaps)

      const priority: Priority = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'

      leads.push({
        id: `lead-${i + 1}-${Date.now()}`,
        businessName: `${businessNames[i % businessNames.length]} ${i > 19 ? i - 19 : ''}`.trim(),
        ownerName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${businessNames[i % businessNames.length].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `( ${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        website: `https://www.${businessNames[i % businessNames.length].toLowerCase().replace(/\s+/g, '')}.com`,
        address: `${streetNum} ${street}`,
        city,
        state: 'CA',
        zip: `${Math.floor(Math.random() * 90000) + 90000}`,
        source: source.toString(),
        score,
        websiteQuality,
        seoVisibility,
        competitiveGaps: selectedGaps,
        priority,
      })
    }
  }

  return leads.sort((a, b) => b.score - a.score)
}

// Targeting Agent class
export class TargetingAgent {
  private config: TargetingConfig | null = null

  constructor() {
    // Initialize with default config
    this.config = null
  }

  /**
   * Pull leads based on targeting configuration
   * In production, this would connect to various data sources
   */
  async pullLeads(config: TargetingConfig): Promise<ScoredLead[]> {
    this.config = config
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generate mock leads for demonstration
    const leads = generateMockLeads(config)
    
    return leads
  }

  /**
   * Score a single lead based on weighted factors
   */
  async scoreLead(lead: ScoredLead): Promise<number> {
    // Calculate weighted score
    const score = Math.round(
      lead.websiteQuality * SCORING_WEIGHTS.websiteQuality +
      lead.seoVisibility * SCORING_WEIGHTS.seoVisibility +
      (100 - lead.competitiveGaps.length * 10) * SCORING_WEIGHTS.competitiveGaps
    )
    
    return Math.min(100, score)
  }

  /**
   * Prioritize leads based on score and other factors
   */
  async prioritizeLeads(leads: ScoredLead[]): Promise<ScoredLead[]> {
    // Sort by score descending, then by competitive gaps (more gaps = higher priority)
    const prioritizedLeads = [...leads].sort((a, b) => {
      // First by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      // Then by score
      return b.score - a.score
    })
    
    return prioritizedLeads
  }

  /**
   * Filter leads by niche
   */
  async filterByNiche(leads: ScoredLead[], niche: string): Promise<ScoredLead[]> {
    const preset = NICHE_PRESETS[niche as keyof typeof NICHE_PRESETS]
    
    if (!preset) {
      // If niche not found in presets, return all leads
      return leads
    }

    // Filter leads that match niche keywords (in business name or other fields)
    const keywords = preset.keywords
    
    return leads.filter(lead => {
      const searchText = `${lead.businessName} ${lead.ownerName} ${lead.city}`.toLowerCase()
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
    })
  }

  /**
   * Get scoring breakdown for a lead
   */
  getScoringBreakdown(lead: ScoredLead): {
    websiteQuality: { score: number; weight: number; contribution: number }
    seoVisibility: { score: number; weight: number; contribution: number }
    competitiveGaps: { score: number; weight: number; contribution: number }
    total: number
  } {
    const gapScore = 100 - lead.competitiveGaps.length * 10
    
    return {
      websiteQuality: {
        score: lead.websiteQuality,
        weight: SCORING_WEIGHTS.websiteQuality * 100,
        contribution: Math.round(lead.websiteQuality * SCORING_WEIGHTS.websiteQuality),
      },
      seoVisibility: {
        score: lead.seoVisibility,
        weight: SCORING_WEIGHTS.seoVisibility * 100,
        contribution: Math.round(lead.seoVisibility * SCORING_WEIGHTS.seoVisibility),
      },
      competitiveGaps: {
        score: gapScore,
        weight: SCORING_WEIGHTS.competitiveGaps * 100,
        contribution: Math.round(gapScore * SCORING_WEIGHTS.competitiveGaps),
      },
      total: lead.score,
    }
  }

  /**
   * Get priority distribution from leads
   */
  getPriorityDistribution(leads: ScoredLead[]): { high: number; medium: number; low: number } {
    return leads.reduce(
      (acc, lead) => {
        acc[lead.priority]++
        return acc
      },
      { high: 0, medium: 0, low: 0 }
    )
  }

  /**
   * Export leads to CSV format
   */
  exportToCSV(leads: ScoredLead[]): string {
    const headers = [
      'Business Name',
      'Owner Name',
      'Email',
      'Phone',
      'Website',
      'Address',
      'City',
      'State',
      'ZIP',
      'Source',
      'Score',
      'Priority',
      'Website Quality',
      'SEO Visibility',
      'Competitive Gaps',
    ]

    const rows = leads.map(lead => [
      lead.businessName,
      lead.ownerName,
      lead.email,
      lead.phone,
      lead.website,
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      lead.source,
      lead.score.toString(),
      lead.priority,
      lead.websiteQuality.toString(),
      lead.seoVisibility.toString(),
      lead.competitiveGaps.join('; '),
    ])

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
  }
}

// Export singleton instance
export const targetingAgent = new TargetingAgent()
