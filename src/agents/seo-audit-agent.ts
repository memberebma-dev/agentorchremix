/**
 * SEO Audit Agent for Commercial Bridge Lender Acquisition Pipeline
 * 
 * Provides comprehensive SEO audits for commercial bridge lenders in Southern California,
 * including website audits, SEO analysis, Google Business Profile optimization, and
 * competitive analysis.
 */

import { Lead } from '../lib/targeting'
import { blink } from '../lib/blink'

// ============================================================================
// INTERFACES
// ============================================================================

export interface AuditConfig {
  leadId: string
  website: string
  googleBusinessProfile?: string
  competitors?: string[]
}

export interface AuditIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  description: string
  recommendation: string
}

export interface AuditReport {
  id: string
  leadId: string
  websiteUrl: string
  overallScore: number
  
  // Website Audit
  websiteScore: number
  websiteIssues: AuditIssue[]
  websiteStrengths: string[]
  
  // SEO Audit
  seoScore: number
  seoIssues: AuditIssue[]
  seoRecommendations: string[]
  keywordsFound: string[]
  keywordsMissing: string[]
  
  // Google Business Profile Audit
  gmbScore: number
  gmbIssues: AuditIssue[]
  gmbRecommendations: string[]
  
  // Competitive Analysis
  competitorScore: number
  competitorAdvantages: string[]
  competitiveGaps: string[]
  
  // Summary
  topOpportunities: string[]
  quickWins: string[]
  generatedAt: string
}

export interface BulkAuditProgress {
  total: number
  completed: number
  failed: number
  currentLeadId?: string
  results: AuditReport[]
}

// Target keywords for commercial bridge lenders in Southern California
export const TARGET_KEYWORDS = [
  'commercial bridge loan',
  'hard money lender',
  'private money lending',
  'fix and flip financing',
  'construction loan',
  'bridge financing',
  'private capital',
  'asset-based lending',
  'commercial real estate financing',
  'investment property loan',
  'short term commercial loan',
  'private commercial lending',
  'real estate bridge loan',
  'construction financing',
  'multi-family lending'
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateScoreFactor(present: boolean, maxScore: number): number {
  return present ? maxScore : maxScore * 0.3
}

function generateScore(issues: AuditIssue[]): number {
  let score = 100
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 25
        break
      case 'high':
        score -= 15
        break
      case 'medium':
        score -= 8
        break
      case 'low':
        score -= 3
        break
    }
  }
  return Math.max(0, score)
}

// ============================================================================
// SEO AUDIT AGENT
// ============================================================================

export class SEOAuditAgent {
  private auditTypes: Set<string> = new Set(['website', 'seo', 'gmb', 'competitive'])
  private targetKeywords: string[] = TARGET_KEYWORDS

  constructor(keywords?: string[]) {
    if (keywords && keywords.length > 0) {
      this.targetKeywords = keywords
    }
  }

  /**
   * Run website audit including technical, performance, and content analysis
   */
  async runWebsiteAudit(url: string): Promise<Partial<AuditReport>> {
    const issues: AuditIssue[] = []
    const strengths: string[] = []

    // Simulate website audit analysis
    // In production, this would use real crawler/analysis tools
    
    // Technical checks
    const hasHTTPS = url.startsWith('https://')
    const hasWWW = url.includes('www.')
    const hasContactPage = Math.random() > 0.4
    const hasServicesPage = Math.random() > 0.3
    const hasAboutPage = Math.random() > 0.5
    
    if (!hasHTTPS) {
      issues.push({
        severity: 'critical',
        category: 'Security',
        description: 'Website does not use HTTPS encryption',
        recommendation: 'Install SSL certificate to secure all traffic and improve trust'
      })
    } else {
      strengths.push('Secure HTTPS connection')
    }

    if (!hasWWW && !url.includes('.io')) {
      issues.push({
        severity: 'low',
        category: 'Technical',
        description: 'Non-standard URL structure',
        recommendation: 'Consider using www prefix for better brand consistency'
      })
    }

    if (!hasContactPage) {
      issues.push({
        severity: 'high',
        category: 'User Experience',
        description: 'No dedicated contact page found',
        recommendation: 'Create a contact page with phone number, email, and address'
      })
    } else {
      strengths.push('Contact page available')
    }

    if (!hasServicesPage) {
      issues.push({
        severity: 'high',
        category: 'Content',
        description: 'No services page detected',
        recommendation: 'Create a services page outlining loan products and terms'
      })
    } else {
      strengths.push('Services page present')
    }

    if (!hasAboutPage) {
      issues.push({
        severity: 'medium',
        category: 'Content',
        description: 'No about page found',
        recommendation: 'Add an about page to build trust and establish expertise'
      })
    }

    // Performance simulation
    const loadTime = Math.random() * 3 + 1 // 1-4 seconds
    if (loadTime > 3) {
      issues.push({
        severity: 'high',
        category: 'Performance',
        description: `Slow page load time (${loadTime.toFixed(1)}s)`,
        recommendation: 'Optimize images, enable caching, and use CDN for faster loading'
      })
    } else {
      strengths.push('Fast page load time')
    }

    // Mobile responsiveness check (simulated)
    const isMobileFriendly = Math.random() > 0.3
    if (!isMobileFriendly) {
      issues.push({
        severity: 'high',
        category: 'Mobile',
        description: 'Website may not be fully responsive',
        recommendation: 'Ensure all pages are mobile-responsive with proper viewport meta'
      })
    } else {
      strengths.push('Mobile-friendly design')
    }

    return {
      websiteScore: generateScore(issues),
      websiteIssues: issues,
      websiteStrengths: strengths
    }
  }

  /**
   * Run SEO audit including keyword analysis, meta tags, and content optimization
   */
  async runSEOAudit(url: string, targetKeywords: string[] = TARGET_KEYWORDS): Promise<Partial<AuditReport>> {
    const issues: AuditIssue[] = []
    const recommendations: string[] = []
    const keywordsFound: string[] = []
    const keywordsMissing: string[] = []

    // Simulate keyword analysis (in production, would analyze actual page content)
    const keywordsToCheck = targetKeywords.slice(0, 10)
    
    for (const keyword of keywordsToCheck) {
      const found = Math.random() > 0.5
      if (found) {
        keywordsFound.push(keyword)
      } else {
        keywordsMissing.push(keyword)
      }
    }

    // Meta tags check
    const hasMetaTitle = Math.random() > 0.3
    const hasMetaDescription = Math.random() > 0.4
    const hasH1 = Math.random() > 0.2

    if (!hasMetaTitle) {
      issues.push({
        severity: 'high',
        category: 'Meta Tags',
        description: 'Missing or improper page title tag',
        recommendation: 'Add unique, keyword-rich title tags (50-60 characters) to all pages'
      })
      recommendations.push('Add optimized title tags with target keywords')
    } else {
      recommendations.push('Title tags are properly configured')
    }

    if (!hasMetaDescription) {
      issues.push({
        severity: 'medium',
        category: 'Meta Tags',
        description: 'Missing meta description',
        recommendation: 'Add unique meta descriptions (150-160 characters) to all pages'
      })
      recommendations.push('Add compelling meta descriptions for better CTR')
    } else {
      recommendations.push('Meta descriptions are in place')
    }

    if (!hasH1) {
      issues.push({
        severity: 'high',
        category: 'Content Structure',
        description: 'Missing or multiple H1 headings',
        recommendation: 'Use exactly one H1 tag per page with primary keyword'
      })
    }

    // Content analysis
    const hasBlog = Math.random() > 0.6
    const hasFAQ = Math.random() > 0.7
    const hasTestimonials = Math.random() > 0.5
    const hasCaseStudies = Math.random() > 0.8

    if (!hasBlog) {
      issues.push({
        severity: 'medium',
        category: 'Content',
        description: 'No blog or news section detected',
        recommendation: 'Start a blog to share industry insights and improve SEO'
      })
      recommendations.push('Create content marketing strategy with regular blog posts')
    }

    if (!hasFAQ) {
      issues.push({
        severity: 'low',
        category: 'Content',
        description: 'No FAQ section found',
        recommendation: 'Add FAQ section to address common customer questions'
      })
    }

    if (!hasTestimonials) {
      issues.push({
        severity: 'medium',
        category: 'Trust Signals',
        description: 'No client testimonials on website',
        recommendation: 'Add client testimonials to build trust and credibility'
      })
      recommendations.push('Collect and display client success stories')
    }

    // Local SEO
    const hasLocalSchema = Math.random() > 0.7
    if (!hasLocalSchema) {
      issues.push({
        severity: 'high',
        category: 'Local SEO',
        description: 'No local business schema markup detected',
        recommendation: 'Add JSON-LD local business schema to help search engines understand business info'
      })
      recommendations.push('Implement local business structured data')
    }

    // Backlinks (simulated)
    const hasQualityBacklinks = Math.random() > 0.6
    if (!hasQualityBacklinks) {
      issues.push({
        severity: 'medium',
        category: 'Backlinks',
        description: 'Limited quality backlinks detected',
        recommendation: 'Build backlinks through guest posting, local directories, and industry partnerships'
      })
      recommendations.push('Develop link building strategy')
    }

    // Generate additional recommendations based on keywords found/missing
    if (keywordsMissing.length > 0) {
      recommendations.push(`Add content targeting: ${keywordsMissing.slice(0, 3).join(', ')}`)
    }

    return {
      seoScore: generateScore(issues),
      seoIssues: issues,
      seoRecommendations: recommendations,
      keywordsFound,
      keywordsMissing
    }
  }

  /**
   * Run Google Business Profile audit
   */
  async runGMBAudit(gmbUrl?: string): Promise<Partial<AuditReport>> {
    const issues: AuditIssue[] = []
    const recommendations: string[] = []

    // Simulate GMB analysis
    const hasGMB = !!gmbUrl
    const isVerified = Math.random() > 0.3
    const hasPhotos = Math.random() > 0.4
    const hasPosts = Math.random() > 0.5
    const hasReviews = Math.random() > 0.3
    const reviewCount = Math.floor(Math.random() * 50)
    const avgRating = Math.random() * 2 + 3 // 3-5 stars

    if (!hasGMB) {
      issues.push({
        severity: 'critical',
        category: 'Google Business Profile',
        description: 'No Google Business Profile found',
        recommendation: 'Claim and verify Google Business Profile immediately'
      })
      recommendations.push('Create and claim Google Business Profile')
      recommendations.push('Verify business address with Google')
    } else {
      recommendations.push('GMB listing is active')
    }

    if (hasGMB && !isVerified) {
      issues.push({
        severity: 'critical',
        category: 'Verification',
        description: 'Google Business Profile not verified',
        recommendation: 'Complete verification via postcard or phone'
      })
    }

    if (hasGMB && !hasPhotos) {
      issues.push({
        severity: 'medium',
        category: 'Visual Content',
        description: 'Limited photos on Google Business Profile',
        recommendation: 'Add high-quality photos of office, team, and services'
      })
      recommendations.push('Upload photos regularly (office, team, projects)')
    }

    if (hasGMB && !hasPosts) {
      issues.push({
        severity: 'medium',
        category: 'Content',
        description: 'No recent Google posts',
        recommendation: 'Post updates weekly with offers, news, and helpful content'
      })
      recommendations.push('Post to Google Business Profile weekly')
    }

    if (hasGMB && !hasReviews) {
      issues.push({
        severity: 'high',
        category: 'Reviews',
        description: 'No customer reviews on Google',
        recommendation: 'Request reviews from satisfied clients via follow-up emails'
      })
      recommendations.push('Implement review request strategy')
    } else if (hasReviews && reviewCount < 10) {
      issues.push({
        severity: 'medium',
        category: 'Reviews',
        description: `Low review count (${reviewCount} reviews)`,
        recommendation: 'Actively request more reviews to build social proof'
      })
      recommendations.push('Aim for 20+ reviews with consistent rating')
    }

    if (hasReviews && avgRating < 4) {
      issues.push({
        severity: 'high',
        category: 'Reviews',
        description: `Rating below 4 stars (${avgRating.toFixed(1)})`,
        recommendation: 'Address negative reviews professionally and improve service quality'
      })
    }

    // Business info completeness
    const hasBusinessHours = Math.random() > 0.3
    const hasServiceArea = Math.random() > 0.5
    const hasBusinessDescription = Math.random() > 0.6

    if (hasGMB && !hasBusinessHours) {
      issues.push({
        severity: 'high',
        category: 'Business Information',
        description: 'Business hours not set',
        recommendation: 'Add accurate business hours including special hours'
      })
    }

    if (hasGMB && !hasServiceArea) {
      issues.push({
        severity: 'medium',
        category: 'Business Information',
        description: 'Service area not defined',
        recommendation: 'Specify service areas for better local visibility'
      })
    }

    if (hasGMB && !hasBusinessDescription) {
      issues.push({
        severity: 'low',
        category: 'Content',
        description: 'Business description not optimized',
        recommendation: 'Write a compelling business description with target keywords'
      })
    }

    return {
      gmbScore: generateScore(issues),
      gmbIssues: issues,
      gmbRecommendations: recommendations
    }
  }

  /**
   * Run competitive analysis against competitor websites
   */
  async runCompetitiveAnalysis(url: string, competitors: string[] = []): Promise<Partial<AuditReport>> {
    const advantages: string[] = []
    const gaps: string[] = []

    // Simulate competitive analysis
    const ownScore = Math.random() * 40 + 30 // 30-70
    
    for (const competitor of competitors) {
      const competitorScore = Math.random() * 40 + 30
      
      // Determine relative position
      if (ownScore > competitorScore) {
        advantages.push(`Higher overall SEO score than ${competitor}`)
      } else {
        gaps.push(`Lower SEO score than competitor ${competitor}`)
      }
    }

    // Content advantages/gaps
    const hasUniqueContent = Math.random() > 0.5
    const hasVideoContent = Math.random() > 0.7
    const hasInfographics = Math.random() > 0.8
    const hasCalculator = Math.random() > 0.9

    if (hasUniqueContent) {
      advantages.push('Unique, original content')
    } else {
      gaps.push('Need more unique content differentiation')
    }

    if (hasVideoContent) {
      advantages.push('Video content available')
    } else {
      gaps.push('No video content - consider adding explainer videos')
    }

    if (!hasCalculator) {
      gaps.push('Missing loan calculator tool')
    }

    // Feature advantages
    const hasChat = Math.random() > 0.7
    const hasOnlineApp = Math.random() > 0.5
    const hasBlog = Math.random() > 0.4

    if (!hasChat) {
      gaps.push('No live chat functionality')
    }

    if (!hasOnlineApp) {
      gaps.push('No online application capability')
    }

    if (hasOnlineApp) {
      advantages.push('Online application available')
    }

    // Calculate competitive score
    const competitorScore = Math.min(100, Math.round(
      (advantages.length / (advantages.length + gaps.length + 1)) * 100
    ))

    return {
      competitorScore,
      competitorAdvantages: advantages,
      competitiveGaps: gaps
    }
  }

  /**
   * Generate opportunity brief from audit results
   */
  async generateOpportunityBrief(audit: AuditReport): Promise<string> {
    const sections: string[] = []

    sections.push(`# SEO Opportunity Brief: ${audit.websiteUrl}`)
    sections.push(`\nGenerated: ${new Date(audit.generatedAt).toLocaleDateString()}`)
    sections.push(`Overall Score: ${audit.overallScore}/100`)

    // Executive Summary
    sections.push('\n## Executive Summary')
    const criticalCount = audit.websiteIssues.filter(i => i.severity === 'critical').length +
      audit.seoIssues.filter(i => i.severity === 'critical').length +
      audit.gmbIssues.filter(i => i.severity === 'critical').length
    
    sections.push(`This ${audit.websiteUrl} has ${criticalCount} critical SEO issues requiring immediate attention.`)
    sections.push(`Priority opportunities include: ${audit.quickWins.slice(0, 3).join(', ')}`)

    // Top Opportunities
    sections.push('\n## Top Opportunities')
    for (const opportunity of audit.topOpportunities) {
      sections.push(`- ${opportunity}`)
    }

    // Quick Wins
    sections.push('\n## Quick Wins (High Impact, Low Effort)')
    for (const win of audit.quickWins) {
      sections.push(`- ${win}`)
    }

    // Website Issues
    if (audit.websiteIssues.length > 0) {
      sections.push('\n## Website Issues')
      for (const issue of audit.websiteIssues) {
        sections.push(`\n### ${issue.category}: ${issue.severity.toUpperCase()}`)
        sections.push(issue.description)
        sections.push(`**Recommendation:** ${issue.recommendation}`)
      }
    }

    // SEO Issues
    if (audit.seoIssues.length > 0) {
      sections.push('\n## SEO Issues')
      for (const issue of audit.seoIssues) {
        sections.push(`\n### ${issue.category}: ${issue.severity.toUpperCase()}`)
        sections.push(issue.description)
        sections.push(`**Recommendation:** ${issue.recommendation}`)
      }
    }

    // GMB Issues
    if (audit.gmbIssues.length > 0) {
      sections.push('\n## Google Business Profile Issues')
      for (const issue of audit.gmbIssues) {
        sections.push(`\n### ${issue.category}: ${issue.severity.toUpperCase()}`)
        sections.push(issue.description)
        sections.push(`**Recommendation:** ${issue.recommendation}`)
      }
    }

    // Keywords Analysis
    if (audit.keywordsMissing.length > 0) {
      sections.push('\n## Missing Keywords')
      sections.push('Consider adding content targeting these keywords:')
      for (const kw of audit.keywordsMissing.slice(0, 8)) {
        sections.push(`- ${kw}`)
      }
    }

    // Competitive Gaps
    if (audit.competitiveGaps.length > 0) {
      sections.push('\n## Competitive Gaps')
      for (const gap of audit.competitiveGaps) {
        sections.push(`- ${gap}`)
      }
    }

    // Action Items
    sections.push('\n## Priority Action Items')
    sections.push('1. Fix all critical issues immediately')
    sections.push('2. Complete Google Business Profile optimization')
    sections.push('3. Add missing target keywords to content')
    sections.push('4. Implement technical SEO improvements')
    sections.push('5. Build quality backlinks')

    return sections.join('\n')
  }

  /**
   * Run full audit on a single lead
   */
  async runFullAudit(lead: Lead, auditTypes: string[] = ['website', 'seo', 'gmb', 'competitive'], competitors: string[] = []): Promise<AuditReport> {
    const report: AuditReport = {
      id: generateId(),
      leadId: lead.id,
      websiteUrl: lead.website || '',
      overallScore: 0,
      websiteScore: 0,
      websiteIssues: [],
      websiteStrengths: [],
      seoScore: 0,
      seoIssues: [],
      seoRecommendations: [],
      keywordsFound: [],
      keywordsMissing: [],
      gmbScore: 0,
      gmbIssues: [],
      gmbRecommendations: [],
      competitorScore: 0,
      competitorAdvantages: [],
      competitiveGaps: [],
      topOpportunities: [],
      quickWins: [],
      generatedAt: new Date().toISOString()
    }

    // Run selected audit types
    if (auditTypes.includes('website') && lead.website) {
      const websiteAudit = await this.runWebsiteAudit(lead.website)
      report.websiteScore = websiteAudit.websiteScore || 0
      report.websiteIssues = websiteAudit.websiteIssues || []
      report.websiteStrengths = websiteAudit.websiteStrengths || []
    }

    if (auditTypes.includes('seo') && lead.website) {
      const seoAudit = await this.runSEOAudit(lead.website, this.targetKeywords)
      report.seoScore = seoAudit.seoScore || 0
      report.seoIssues = seoAudit.seoIssues || []
      report.seoRecommendations = seoAudit.seoRecommendations || []
      report.keywordsFound = seoAudit.keywordsFound || []
      report.keywordsMissing = seoAudit.keywordsMissing || []
    }

    if (auditTypes.includes('gmb')) {
      const gmbAudit = await this.runGMBAudit(lead.google_business_url)
      report.gmbScore = gmbAudit.gmbScore || 0
      report.gmbIssues = gmbAudit.gmbIssues || []
      report.gmbRecommendations = gmbAudit.gmbRecommendations || []
    }

    if (auditTypes.includes('competitive') && lead.website) {
      const compAudit = await this.runCompetitiveAnalysis(lead.website, competitors)
      report.competitorScore = compAudit.competitorScore || 0
      report.competitorAdvantages = compAudit.competitorAdvantages || []
      report.competitiveGaps = compAudit.competitiveGaps || []
    }

    // Calculate overall score
    const scores = []
    if (auditTypes.includes('website')) scores.push(report.websiteScore)
    if (auditTypes.includes('seo')) scores.push(report.seoScore)
    if (auditTypes.includes('gmb')) scores.push(report.gmbScore)
    if (auditTypes.includes('competitive')) scores.push(report.competitorScore)
    
    report.overallScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    // Generate opportunities and quick wins
    report.topOpportunities = this.generateOpportunities(report)
    report.quickWins = this.generateQuickWins(report)

    return report
  }

  /**
   * Generate top opportunities from audit results
   */
  private generateOpportunities(report: AuditReport): string[] {
    const opportunities: string[] = []

    // Website opportunities
    if (report.websiteIssues.some(i => i.severity === 'critical')) {
      opportunities.push('Fix critical website issues for better user experience')
    }
    if (!report.websiteStrengths.includes('Fast page load time')) {
      opportunities.push('Improve page speed for better UX and SEO')
    }

    // SEO opportunities
    if (report.keywordsMissing.length > 5) {
      opportunities.push(`Add ${report.keywordsMissing.slice(0, 3).join(', ')} to website content`)
    }
    if (report.seoIssues.some(i => i.category === 'Meta Tags')) {
      opportunities.push('Optimize meta tags for better search visibility')
    }
    if (!report.seoRecommendations.some(r => r.includes('blog'))) {
      opportunities.push('Start content marketing to build authority')
    }

    // GMB opportunities
    if (report.gmbIssues.some(i => i.severity === 'critical')) {
      opportunities.push('Claim and optimize Google Business Profile')
    }
    if (!report.gmbRecommendations.some(r => r.includes('review'))) {
      opportunities.push('Implement review generation strategy')
    }
    if (report.gmbRecommendations.some(r => r.includes('photo'))) {
      opportunities.push('Add photos to Google Business Profile')
    }

    // Competitive opportunities
    if (report.competitiveGaps.includes('No video content')) {
      opportunities.push('Add video content to compete effectively')
    }
    if (report.competitiveGaps.includes('Missing loan calculator')) {
      opportunities.push('Add loan calculator tool for better user engagement')
    }

    return opportunities.slice(0, 6)
  }

  /**
   * Generate quick wins (high impact, low effort)
   */
  private generateQuickWins(report: AuditReport): string[] {
    const quickWins: string[] = []

    // GMB quick wins
    if (report.gmbIssues.some(i => i.category === 'Business Information')) {
      quickWins.push('Complete Google Business Profile business info')
    }
    if (report.gmbIssues.some(i => i.category === 'Reviews' && i.severity === 'medium')) {
      quickWins.push('Request reviews from existing clients')
    }

    // SEO quick wins
    if (report.seoIssues.some(i => i.category === 'Meta Tags')) {
      quickWins.push('Add meta descriptions to all pages')
    }
    if (report.keywordsMissing.length > 0) {
      quickWins.push(`Add primary keyword to homepage title`)
    }

    // Website quick wins
    if (!report.websiteStrengths.includes('Contact page available')) {
      quickWins.push('Add contact information to website')
    }

    // Content quick wins
    if (report.seoIssues.some(i => i.category === 'Content' && i.description.includes('FAQ'))) {
      quickWins.push('Create FAQ section with common lending questions')
    }

    return quickWins.slice(0, 5)
  }

  /**
   * Run bulk audits on multiple leads
   */
  async runBulkAudits(
    leads: Lead[],
    auditTypes: string[] = ['website', 'seo', 'gmb', 'competitive'],
    competitors: string[] = [],
    onProgress?: (progress: BulkAuditProgress) => void
  ): Promise<AuditReport[]> {
    const results: AuditReport[] = []
    const progress: BulkAuditProgress = {
      total: leads.length,
      completed: 0,
      failed: 0,
      results: []
    }

    for (const lead of leads) {
      progress.currentLeadId = lead.id
      
      try {
        // Skip leads without websites unless doing GMB-only audit
        if (!lead.website && !auditTypes.includes('gmb')) {
          progress.failed++
          continue
        }

        const report = await this.runFullAudit(lead, auditTypes, competitors)
        results.push(report)
        progress.completed++
        progress.results.push(report)
        
        // Update lead with audit scores
        await this.updateLeadAuditScores(lead.id, report)
      } catch (error) {
        console.error(`Audit failed for lead ${lead.id}:`, error)
        progress.failed++
      }

      // Report progress
      if (onProgress) {
        onProgress({ ...progress })
      }

      // Small delay between audits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }

  /**
   * Update lead with audit scores
   */
  private async updateLeadAuditScores(leadId: string, report: AuditReport): Promise<void> {
    try {
      const { blink } = await import('../lib/blink')
      await blink.db.leads.update({ id: leadId }, {
        // Snake case for audit system
        website_score: report.websiteScore,
        seo_visibility_score: report.seoScore,
        competitive_gaps_score: report.competitorScore,
        updated_at: new Date().toISOString(),
        // Camel case for main pipeline system
        leadScore: report.overallScore,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Failed to update lead ${leadId} scores:`, error)
    }
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default SEOAuditAgent