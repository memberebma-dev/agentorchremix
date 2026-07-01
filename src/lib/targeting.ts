import { blink } from './blink'

// Lead generation sources for commercial bridge lenders in Southern California
const SOUTHERN_CALIFORNIA_CITIES = [
  'Los Angeles', 'San Diego', 'Orange County', 'Riverside', 'San Bernardino',
  'Santa Ana', 'Irvine', 'Long Beach', 'Anaheim', 'Bakersfield',
  'Fresno', 'Oxnard', 'Ventura', 'Pasadena', 'Santa Monica',
  'Beverly Hills', 'Newport Beach', 'Costa Mesa', 'La Jolla', 'Carlsbad'
]

const NICHE_KEYWORDS = [
  'commercial bridge lender',
  'hard money lender',
  'private money lending',
  'commercial real estate financing',
  'bridge loan',
  'construction lending',
  'fix and flip financing',
  'multi-family lending',
  'mixed use financing',
  'investment property loans'
]

export interface Lead {
  id: string
  business_name: string
  owner_name?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  google_business_url?: string
  gmb_verified?: number
  niche?: string
  location?: string
  source?: string
  status?: string
  priority_score?: number
  website_score?: number
  seo_visibility_score?: number
  competitive_gaps_score?: number
  created_at?: string
  updated_at?: string
}

// Generate unique ID
function generateId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Simulated lead generation - in production this would pull from maps, directories
export async function generateLeads(count: number = 50): Promise<Lead[]> {
  const leads: Lead[] = []
  
  // Sample business names for commercial bridge lenders (simulated)
  const businessPrefixes = ['Pacific', 'Southern', 'Coastal', 'Golden State', 'Elite', 'Premier', 'Capital', 'Bridge', 'Strategic', ' Meridian']
  const businessTypes = ['Capital Group', 'Funding Solutions', 'Financial Services', 'Lending Partners', 'Investment Group', 'Real Estate Finance', 'Asset Management', 'Mortgage Group']
  const cities = SOUTHERN_CALIFORNIA_CITIES
  
  for (let i = 0; i < count; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const prefix = businessPrefixes[Math.floor(Math.random() * businessPrefixes.length)]
    const type = businessTypes[Math.floor(Math.random() * businessTypes.length)]
    
    const lead: Lead = {
      id: generateId(),
      business_name: `${prefix} ${type}`,
      owner_name: generateOwnerName(),
      email: generateEmail(prefix),
      phone: generatePhone(),
      website: generateWebsite(prefix),
      address: generateAddress(city),
      city: city,
      state: 'CA',
      zip_code: generateZipCode(),
      google_business_url: `https://maps.google.com/${generateId()}`,
      gmb_verified: Math.random() > 0.3 ? 1 : 0,
      niche: 'commercial_bridge_lender',
      location: 'Southern California',
      source: 'targeting_engine',
      status: 'new',
      priority_score: 0,
      website_score: 0,
      seo_visibility_score: 0,
      competitive_gaps_score: 0
    }
    leads.push(lead)
  }
  
  return leads
}

function generateOwnerName(): string {
  const firstNames = ['John', 'Michael', 'David', 'Robert', 'James', 'William', 'Daniel', 'Thomas', 'Carlos', 'Juan']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

function generateEmail(prefix: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'business.com']
  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z]/g, '')
  return `${cleanPrefix}${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`
}

function generatePhone(): string {
  const areaCodes = ['310', '213', '424', '562', '626', '714', '818', '858', '909', '951']
  return `(${areaCodes[Math.floor(Math.random() * areaCodes.length)]}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
}

function generateWebsite(prefix: string): string {
  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z]/g, '')
  const domains = ['.com', '.com', '.com', '.net', '.io']
  return `https://www.${cleanPrefix}lending${domains[Math.floor(Math.random() * domains.length)]}`
}

function generateAddress(city: string): string {
  const streetNames = ['Main St', 'Business Pkwy', 'Financial Way', 'Capital Dr', 'Market St', 'Commerce Blvd', 'Executive Dr']
  const streetNumber = Math.floor(Math.random() * 9000) + 1000
  return `${streetNumber} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`
}

function generateZipCode(): string {
  const zipCodes = ['90001', '90210', '90212', '90247', '90402', '90501', '90620', '90703', '90731', '90802', '91001', '91101', '91201', '91302', '91401', '91502', '91601', '91701', '91801', '91901', '92001', '92101', '92201', '92301', '92401', '92501', '92601', '92701', '92801', '93001', '93101', '93301', '93401', '93501']
  return zipCodes[Math.floor(Math.random() * zipCodes.length)]
}

// Scoring algorithm for leads
export interface LeadScore {
  websiteScore: number
  seoVisibilityScore: number
  competitiveGapsScore: number
  priorityScore: number
}

export function calculateLeadScore(lead: Lead): LeadScore {
  let websiteScore = 50 // Base score
  let seoVisibilityScore = 50
  let competitiveGapsScore = 50
  
  // Website quality scoring
  if (lead.website) {
    // Has website = good
    websiteScore += 20
    
    // Check for professional indicators
    const website = lead.website.toLowerCase()
    if (website.includes('bridge') || website.includes('lending') || website.includes('capital')) {
      websiteScore += 10 // Niche relevant
    }
    if (website.includes('.com')) {
      websiteScore += 5
    }
    if (website.includes('www.')) {
      websiteScore += 5
    }
  } else {
    websiteScore -= 20 // No website = opportunity
  }
  
  // SEO visibility scoring
  if (lead.gmb_verified === 1) {
    seoVisibilityScore += 25
  } else {
    seoVisibilityScore -= 15 // No GMB = opportunity
  }
  
  // If no email, that's a gap
  if (!lead.email) {
    seoVisibilityScore -= 10
  }
  
  // Competitive gaps - lower scores mean more opportunity
  if (!lead.email) {
    competitiveGapsScore += 15 // Email marketing opportunity
  }
  if (!lead.phone) {
    competitiveGapsScore += 10
  }
  if (lead.website_score && lead.website_score < 50) {
    competitiveGapsScore += 20
  }
  
  // Calculate priority score (weighted average)
  const priorityScore = Math.round(
    (websiteScore * 0.3) + 
    (seoVisibilityScore * 0.35) + 
    (competitiveGapsScore * 0.35)
  )
  
  return {
    websiteScore: Math.min(100, Math.max(0, websiteScore)),
    seoVisibilityScore: Math.min(100, Math.max(0, seoVisibilityScore)),
    competitiveGapsScore: Math.min(100, Math.max(0, competitiveGapsScore)),
    priorityScore: Math.min(100, Math.max(0, priorityScore))
  }
}

// Save leads to database
export async function saveLeads(leads: Lead[]): Promise<number> {
  let savedCount = 0
  
  for (const lead of leads) {
    const scores = calculateLeadScore(lead)
    
    try {
      await blink.db.leads.create({
        id: lead.id,
        business_name: lead.business_name,
        owner_name: lead.owner_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        website: lead.website || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || 'CA',
        zip_code: lead.zip_code || '',
        google_business_url: lead.google_business_url || '',
        gmb_verified: lead.gmb_verified || 0,
        niche: lead.niche || 'commercial_bridge_lender',
        location: lead.location || 'Southern California',
        source: lead.source || 'targeting_engine',
        status: 'new',
        priority_score: scores.priorityScore,
        website_score: scores.websiteScore,
        seo_visibility_score: scores.seoVisibilityScore,
        competitive_gaps_score: scores.competitiveGapsScore
      })
      savedCount++
    } catch (error) {
      console.error(`Failed to save lead ${lead.id}:`, error)
    }
  }
  
  return savedCount
}

// Fetch leads from database
export async function getLeads(filters?: {
  status?: string
  city?: string
  minScore?: number
  limit?: number
}): Promise<Lead[]> {
  let query = 'SELECT * FROM leads'
  const conditions: string[] = []
  const params: Record<string, any> = {}
  
  if (filters?.status) {
    conditions.push('status = :status')
    params.status = filters.status
  }
  
  if (filters?.city) {
    conditions.push('city = :city')
    params.city = filters.city
  }
  
  if (filters?.minScore) {
    conditions.push('priority_score >= :minScore')
    params.minScore = filters.minScore
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  
  query += ' ORDER BY priority_score DESC'
  
  if (filters?.limit) {
    query += ' LIMIT :limit'
    params.limit = filters.limit
  }
  
  try {
    const result = await blink.db.leads.list({ ...params, limit: filters?.limit || 100 })
    return result as unknown as Lead[]
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return []
  }
}

// Get lead by ID
export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const result = await blink.db.leads.get({ id })
    return result as unknown as Lead
  } catch (error) {
    console.error(`Failed to fetch lead ${id}:`, error)
    return null
  }
}

// Update lead status
export async function updateLeadStatus(id: string, status: string): Promise<boolean> {
  try {
    await blink.db.leads.update({ id }, { status, updated_at: new Date().toISOString() })
    return true
  } catch (error) {
    console.error(`Failed to update lead ${id}:`, error)
    return false
  }
}

// Get targeting statistics
export async function getTargetingStats() {
  try {
    const totalLeads = await blink.db.leads.count()
    
    // Get counts by status
    const newLeads = await blink.db.leads.list({ status: 'new', limit: 1000 })
    const contactedLeads = await blink.db.leads.list({ status: 'contacted', limit: 1000 })
    const qualifiedLeads = await blink.db.leads.list({ status: 'qualified', limit: 1000 })
    const convertedLeads = await blink.db.leads.list({ status: 'converted', limit: 1000 })
    
    // Calculate average scores
    const allLeads = await blink.db.leads.list({ limit: 1000 })
    const leads = allLeads as unknown as Lead[]
    
    const avgPriorityScore = leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + (l.priority_score || 0), 0) / leads.length)
      : 0
    
    return {
      totalLeads,
      newLeads: newLeads.length,
      contactedLeads: contactedLeads.length,
      qualifiedLeads: qualifiedLeads.length,
      convertedLeads: convertedLeads.length,
      avgPriorityScore
    }
  } catch (error) {
    console.error('Failed to get stats:', error)
    return {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      avgPriorityScore: 0
    }
  }
}
