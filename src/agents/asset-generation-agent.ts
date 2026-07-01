// Asset Generation Agent - AI-powered asset creation for commercial bridge lenders
// Generates websites, videos, and opportunity briefs for lead nurturing

import type { Lead, AuditReport, PrebuiltAsset } from '@/types/pipeline'

export interface AssetConfig {
  leadId: string
  businessName: string
  niche: string
  location: string
  ownerName: string
  contactEmail: string
}

export interface GeneratedAssets {
  websiteUrl: string
  videoUrl: string
  opportunityBriefUrl: string
  screenshots: string[]
}

export interface WebsiteTemplate {
  id: string
  name: string
  description: string
  colorScheme: string
  sections: string[]
  previewGradient: string
  icon: string
  performanceStats?: {
    avgResponseRate: number
    avgConversionRate: number
    timesUsed: number
  }
}

// Pre-built templates for commercial bridge lenders:
export const TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'bridge-elite',
    name: 'Bridge Elite',
    description: 'Professional lender website with case studies, calculator, and testimonials',
    colorScheme: 'navy-gold',
    sections: ['hero', 'services', 'process', 'calculator', 'testimonials', 'contact'],
    previewGradient: 'from-slate-900 via-slate-800 to-amber-900/30',
    icon: '🏛️',
    performanceStats: {
      avgResponseRate: 24.5,
      avgConversionRate: 8.2,
      timesUsed: 127,
    },
  },
  {
    id: 'hard-money-pro',
    name: 'Hard Money Pro',
    description: 'Results-focused lending site with fast approval messaging',
    colorScheme: 'teal-slate',
    sections: ['hero', 'programs', 'qualifications', 'faq', 'contact'],
    previewGradient: 'from-slate-900 via-teal-900/20 to-slate-800',
    icon: '💼',
    performanceStats: {
      avgResponseRate: 28.3,
      avgConversionRate: 9.1,
      timesUsed: 89,
    },
  },
  {
    id: 'private-capital',
  name: 'Private Capital',
  description: 'Trust-focused private lending site with emphasis on discretion',
  colorScheme: 'blue-gray',
  sections: ['hero', 'about', 'lending-criteria', 'reviews', 'contact'],
  previewGradient: 'from-slate-900 via-blue-900/20 to-slate-800',
  icon: '🔐',
  performanceStats: {
    avgResponseRate: 22.1,
    avgConversionRate: 7.5,
    timesUsed: 64,
  },
  },
  {
    id: 'fix-and-flip',
    name: 'Fix & Flip Pro',
    description: 'Dynamic site for renovation and flip financing specialists',
    colorScheme: 'orange-slate',
  sections: ['hero', 'projects', 'financing-options', 'process', 'contact'],
  previewGradient: 'from-slate-900 via-orange-900/20 to-slate-800',
  icon: '🔨',
  performanceStats: {
    avgResponseRate: 31.2,
    avgConversionRate: 10.4,
    timesUsed: 156,
  },
  },
  {
    id: 'construction-loans',
    name: 'Construction Capital',
    description: 'Specialized site for ground-up construction and development',
    colorScheme: 'blue-slate',
    sections: ['hero', 'loan-types', 'portfolio', 'process', 'contact'],
    previewGradient: 'from-slate-900 via-blue-900/30 to-slate-800',
    icon: '🏗️',
    performanceStats: {
      avgResponseRate: 19.8,
      avgConversionRate: 6.3,
    timesUsed: 42,
  },
  },
]

// Template color mapping
const TEMPLATE_COLORS: Record<string, { primary: string; accent: string }> = {
  'navy-gold': { primary: '#1E3A5F', accent: '#D4AF37' },
  'teal-slate': { primary: '#0D9488', accent: '#64748B' },
  'blue-gray': { primary: '#3B82F6', accent: '#6B7280' },
  'orange-slate': { primary: '#EA580C', accent: '#475569' },
  'blue-slate': { primary: '#2563EB', accent: '#4B5563' },
}

// Generation progress stages
export type GenerationStage = 'configuring' | 'generating-website' | 'generating-video' | 'generating-brief' | 'packaging' | 'complete'

export interface GenerationProgress {
  stage: GenerationStage
  progress: number
  message: string
}

// Mock function to generate website URL
function generateWebsiteUrl(businessName: string, templateId: string): string {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `https://preview.${slug}.bridge-lender.com?template=${templateId}`
}

// Mock function to generate video URL
function generateVideoUrl(businessName: string): string {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `https://video.${slug}.bridge-lender.com/intro.mp4`
}

// Mock function to generate opportunity brief URL
function generateBriefUrl(businessName: string): string {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `https://docs.${slug}.bridge-lender.com/brief.pdf`
}

// Generate mock screenshots
function generateScreenshots(templateId: string): string[] {
  return [
    `https://screenshots.bridge-lender.com/${templateId}-home.png`,
    `https://screenshots.bridge-lender.com/${templateId}-services.png`,
    `https://screenshots.bridge-lender.com/${templateId}-contact.png`,
  ]
}

// Asset Generation Agent class
export class AssetGenerationAgent {
  private progressCallbacks: Map<string, (progress: GenerationProgress) => void> = new Map()

  /**
   * Set progress callback for a generation job
   */
  setProgressCallback(jobId: string, callback: (progress: GenerationProgress) => void): void {
    this.progressCallbacks.set(jobId, callback)
  }

  /**
   * Remove progress callback
   */
  removeProgressCallback(jobId: string): void {
    this.progressCallbacks.delete(jobId)
  }

  private emitProgress(jobId: string, stage: GenerationStage, progress: number, message: string): void {
    const callback = this.progressCallbacks.get(jobId)
    if (callback) {
      callback({ stage, progress, message })
    }
  }

  /**
   * Generate website based on config and template
   */
  async generateWebsite(config: AssetConfig, templateId: string): Promise<string> {
    const jobId = `website-${config.leadId}-${Date.now()}`
    
    this.emitProgress(jobId, 'configuring', 5, 'Configuring website template...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    this.emitProgress(jobId, 'generating-website', 15, 'Generating website structure...')
    await new Promise(resolve => setTimeout(resolve, 800))
    
    this.emitProgress(jobId, 'generating-website', 35, 'Personalizing content for ' + config.businessName + '...')
    await new Promise(resolve => setTimeout(resolve, 800))
    
    this.emitProgress(jobId, 'generating-website', 55, 'Applying branding and color scheme...')
    await new Promise(resolve => setTimeout(resolve, 600))
    
    this.emitProgress(jobId, 'generating-website', 75, 'Generating screenshots...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    this.emitProgress(jobId, 'generating-website', 90, 'Finalizing website...')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const websiteUrl = generateWebsiteUrl(config.businessName, templateId)
    this.emitProgress(jobId, 'generating-website', 100, 'Website generated successfully!')
    
    return websiteUrl
  }

  /**
   * Generate AI avatar video
   */
  async generateVideo(config: AssetConfig): Promise<string> {
    const jobId = `video-${config.leadId}-${Date.now()}`
    
    this.emitProgress(jobId, 'generating-video', 10, 'Generating video script...')
    await new Promise(resolve => setTimeout(resolve, 600))
    
    this.emitProgress(jobId, 'generating-video', 30, 'Selecting AI avatar...')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    this.emitProgress(jobId, 'generating-video', 50, 'Synthesizing voiceover...')
    await new Promise(resolve => setTimeout(resolve, 800))
    
    this.emitProgress(jobId, 'generating-video', 75, 'Rendering video...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    this.emitProgress(jobId, 'generating-video', 95, 'Finalizing video...')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const videoUrl = generateVideoUrl(config.businessName)
    this.emitProgress(jobId, 'generating-video', 100, 'Video generated successfully!')
    
    return videoUrl
  }

  /**
   * Generate opportunity brief (PDF)
   */
  async generateOpportunityBrief(config: AssetConfig, auditData?: Partial<AuditReport>): Promise<string> {
    const jobId = `brief-${config.leadId}-${Date.now()}`
    
    this.emitProgress(jobId, 'generating-brief', 10, 'Analyzing business profile...')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    this.emitProgress(jobId, 'generating-brief', 30, 'Compelling narrative for ' + config.niche + ' in ' + config.location + '...')
    await new Promise(resolve => setTimeout(resolve, 600))
    
    this.emitProgress(jobId, 'generating-brief', 50, 'Identifying funding opportunities...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    this.emitProgress(jobId, 'generating-brief', 75, 'Formatting opportunity brief...')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    this.emitProgress(jobId, 'generating-brief', 90, 'Generating PDF...')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const briefUrl = generateBriefUrl(config.businessName)
    this.emitProgress(jobId, 'generating-brief', 100, 'Opportunity brief generated!')
    
    return briefUrl
  }

  /**
   * Package all assets for a lead
   */
  async packageAssets(config: AssetConfig, templateId: string, includeVideo: boolean = true): Promise<GeneratedAssets> {
    const jobId = `package-${config.leadId}-${Date.now()}`
    
    this.emitProgress(jobId, 'packaging', 0, 'Starting asset packaging...')
    
    // Generate website
    this.emitProgress(jobId, 'packaging', 20, 'Generating website...')
    const websiteUrl = await this.generateWebsite(config, templateId)
    
    // Generate video (if requested)
    let videoUrl = ''
    if (includeVideo) {
      this.emitProgress(jobId, 'packaging', 45, 'Generating video...')
      videoUrl = await this.generateVideo(config)
    } else {
      this.emitProgress(jobId, 'packaging', 45, 'Skipping video generation...')
    }
    
    // Generate opportunity brief
    this.emitProgress(jobId, 'packaging', 70, 'Generating opportunity brief...')
    const opportunityBriefUrl = await this.generateOpportunityBrief(config)
    
    // Generate screenshots
    this.emitProgress(jobId, 'packaging', 85, 'Capturing screenshots...')
    const screenshots = generateScreenshots(templateId)
    
    this.emitProgress(jobId, 'packaging', 100, 'All assets packaged successfully!')
    
    return {
      websiteUrl,
      videoUrl,
      opportunityBriefUrl,
      screenshots,
    }
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): WebsiteTemplate | undefined {
    return TEMPLATES.find(t => t.id === templateId)
  }

  /**
   * Get template colors
   */
  getTemplateColors(templateId: string): { primary: string; accent: string } | undefined {
    const template = this.getTemplate(templateId)
    return template ? TEMPLATE_COLORS[template.colorScheme] : undefined
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): WebsiteTemplate[] {
    return TEMPLATES
  }

  /**
   * Get templates sorted by performance
   */
  getTemplatesByPerformance(): WebsiteTemplate[] {
    return [...TEMPLATES].sort((a, b) => {
      const aRate = a.performanceStats?.avgResponseRate || 0
      const bRate = b.performanceStats?.avgResponseRate || 0
      return bRate - aRate
    })
  }
}

// Export singleton instance
export const assetGenerationAgent = new AssetGenerationAgent()

// Helper function to convert AssetConfig from Lead
export function createAssetConfigFromLead(lead: Lead): AssetConfig {
  return {
    leadId: lead.id,
    businessName: lead.businessName,
    niche: lead.niche,
    location: `${lead.city}, ${lead.state}`,
    ownerName: lead.ownerName,
    contactEmail: lead.email,
  }
}
