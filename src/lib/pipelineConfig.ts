const PIPELINE_CONFIG_KEY = 'agentorch_pipeline_config'

export interface PipelineConfig {
  leadScoreThreshold: number
  growthPackagePrice: number
  regionFocus: string
  niche: string
  outreachResponseWindowHours: number
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  leadScoreThreshold: 60,
  growthPackagePrice: 4997,
  regionFocus: 'Southern California',
  niche: 'Commercial Bridge Lenders',
  outreachResponseWindowHours: 48,
}

// Curated for high ticket size + urgent/high-intent buyer behavior + proven ad
// spend (most already pay for leads/ads, so they're pre-qualified to pay for
// more) — i.e. short time-to-next-dollar for a lead-gen/SEO offer.
export const SUGGESTED_NICHES = [
  'Commercial Bridge Lenders',
  'Personal Injury Lawyers',
  'Roofing Contractors',
  'HVAC Companies',
  'Emergency Plumbers',
  'Medical Spas & Cosmetic Dermatology',
  'Cosmetic & Implant Dentistry',
  'Drug & Alcohol Rehab Centers',
  'Solar Panel Installers',
  'Home Remodeling / Kitchen & Bath',
  'Water Damage Restoration',
  'Divorce Attorneys',
  'Bankruptcy Attorneys',
  'Criminal Defense Attorneys',
  'Pest Control Companies',
  'Moving Companies',
]

export function loadPipelineConfig(): PipelineConfig {
  try {
    const raw = localStorage.getItem(PIPELINE_CONFIG_KEY)
    if (raw) return { ...DEFAULT_PIPELINE_CONFIG, ...JSON.parse(raw) }
  } catch { /* fall through to defaults */ }
  return DEFAULT_PIPELINE_CONFIG
}

export function savePipelineConfig(config: PipelineConfig): void {
  localStorage.setItem(PIPELINE_CONFIG_KEY, JSON.stringify(config))
}
