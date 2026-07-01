// Outreach Agent - Multi-channel outreach system for commercial bridge lenders
import type { Lead } from '@/types'

// ============================================================================
// Type Definitions
// ============================================================================

export interface OutreachConfig {
  leadId: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  website: string
  auditReport?: AuditReport
  prebuiltAssets?: GeneratedAssets
}

export interface AuditReport {
  gbpScore: number
  webScore: number
  issues: SEOIssue[]
  opportunities: string[]
}

export interface SEOIssue {
  category: 'technical' | 'onpage' | 'offpage' | 'content'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
}

export interface GeneratedAssets {
  prebuiltSiteUrl?: string
  logoUrl?: string
  heroImageUrl?: string
}

export interface OutreachMessage {
  id: string
  leadId: string
  channel: 'email' | 'sms' | 'linkedin' | 'voicemail'
  subject: string
  body: string
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed'
  scheduledAt?: string
  sentAt?: string
  responseReceived: boolean
  responseContent?: string
}

export interface OutreachSequence {
  id: string
  name: string
  steps: SequenceStep[]
  status: 'active' | 'paused' | 'completed'
}

export interface SequenceStep {
  day: number // 0 = immediately, 1 = day 1, etc.
  channel: 'email' | 'sms' | 'linkedin' | 'voicemail'
  subject: string
  template: string
  delay?: number
}

// ============================================================================
// Message Angles for Commercial Bridge Lenders
// ============================================================================

export const MESSAGE_ANGLES = {
  leadGenerationGaps: {
    id: 'lead-generation-gaps',
    name: 'Lead Generation Gaps',
    description: 'Focus on missed opportunities and lost leads',
    subject: 'Quick question about {{businessName}}\'s online presence',
    templates: {
      email: `Hi {{ownerName}},

I noticed {{businessName}} could be capturing more leads online. 

I put together a quick analysis of your website and found some opportunities you might want to know about.

Would you like me to share what I found?

Best regards`,
      sms: `Hi {{ownerName}}, I found some quick wins for {{businessName}}'s lead generation. Got 2 mins to share what I found?`,
    }
  },
  competitorAnalysis: {
    id: 'competitor-analysis',
    name: 'Competitor Analysis',
    description: 'Show how they compare to competitors',
    subject: 'How {{businessName}} stacks up against competitors',
    templates: {
      email: `Hi {{ownerName}},

I analyzed {{businessName}}'s online presence compared to your top competitors in Southern California.

The results were interesting - there are some clear areas where you could be outranking them.

Would you like me to share the details?

Best regards`,
      sms: `Hi {{ownerName}}, just finished a competitor analysis for {{businessName}}. You'd be surprised who you're outranking (and who\'s beating you).`,
    }
  },
  websiteModernization: {
    id: 'website-modernization',
    name: 'Website Modernization',
    description: 'Upgrade outdated websites',
    subject: 'Your free website preview - {{businessName}}',
    templates: {
      email: `Hi {{ownerName}},

Following up on my previous email - I actually went ahead and created a preview of what your website could look like.

I've included:
- A modern, conversion-focused design
- Optimized copy for your services
- Call-to-action buttons that convert

You can view it here: {{websitePreviewUrl}}

Let me know what you think!

Best regards`,
      sms: `Hi {{ownerName}}, created a free preview of what {{businessName}}'s new site could look like. Want me to send you the link?`,
    }
  },
  seoOpportunity: {
    id: 'seo-opportunity',
    name: 'SEO Opportunity',
    description: 'Rank higher in local search',
    subject: 'Local SEO opportunity for {{businessName}}',
    templates: {
      email: `Hi {{ownerName}},

I specialize in helping Southern California bridge lenders improve their local search visibility.

I looked at {{businessName}}'s current SEO and found several quick wins that could help you appear in more searches.

Would you like me to put together a quick SEO roadmap for you?

Best regards`,
      sms: `Hi {{ownerName}}, found some easy SEO wins for {{businessName}} that could bring more local leads. Want me to share what I found?`,
    }
  },
  prebuiltSiteDemo: {
    id: 'prebuilt-site-demo',
    name: 'Prebuilt Site Demonstration',
    description: 'Showcase the prebuilt asset',
    subject: 'Your done-for-you website is ready - {{businessName}}',
    templates: {
      email: `Hi {{ownerName}},

Great news - I've already built a preview site for {{businessName}}!

It's fully designed, optimized for conversions, and ready to go live.

You can see it here: {{websitePreviewUrl}}

No commitment needed - just let me know what you think!

Best regards`,
      sms: `Hi {{ownerName}}, your new website is ready to preview! Just click the link to see what {{businessName}} could look like.`,
    }
  },
} as const

// ============================================================================
// Default Sequence for Commercial Bridge Lenders
// ============================================================================

export const DEFAULT_SEQUENCE: OutreachSequence = {
  id: 'bridge-lender-sequence',
  name: 'Commercial Bridge Lender Sequence',
  status: 'active',
  steps: [
    {
      day: 0,
      channel: 'email',
      subject: 'Quick question about {{businessName}}\'s online presence',
      template: MESSAGE_ANGLES.leadGenerationGaps.templates.email,
    },
    {
      day: 1,
      channel: 'email',
      subject: 'Your free website preview - {{businessName}}',
      template: MESSAGE_ANGLES.websiteModernization.templates.email,
    },
    {
      day: 3,
      channel: 'sms',
      subject: '',
      template: MESSAGE_ANGLES.websiteModernization.templates.sms,
    },
    {
      day: 7,
      channel: 'email',
      subject: 'One more thing...',
      template: `Hi {{ownerName}},

One final thing - I specialize in helping bridge lenders like yourself generate more leads and close more deals.

I understand you might be busy, so I've put together a no-obligation proposal outlining how we could help.

Would a 15-minute call make sense to discuss?

Best regards`,
    },
  ],
}

// ============================================================================
// Outreach Agent Class
// ============================================================================

export class OutreachAgent {
  private messages: OutreachMessage[] = []
  private sequences: Map<string, OutreachSequence> = new Map()
  private currentAngleIndex = 0

  constructor() {
    this.sequences.set(DEFAULT_SEQUENCE.id, DEFAULT_SEQUENCE)
  }

  /**
   * Personalize a message template with lead data
   */
  async createPersonalizedMessage(
    config: OutreachConfig,
    template: string
  ): Promise<OutreachMessage> {
    const variables = this.extractVariables(template)
    let personalizedBody = template
    let personalizedSubject = ''

    // Replace variables in template
    for (const variable of variables) {
      const value = this.getVariableValue(config, variable)
      if (value) {
        personalizedBody = personalizedBody.replace(new RegExp(`{{${variable}}}`, 'g'), value)
      }
    }

    // Handle subject separately if it contains variables
    const subjectMatch = template.match(/^Subject:\s*(.+?)(?:\n\n|$)/)
    if (subjectMatch) {
      personalizedSubject = subjectMatch[1]
      for (const variable of variables) {
        const value = this.getVariableValue(config, variable)
        if (value) {
          personalizedSubject = personalizedSubject.replace(
            new RegExp(`{{${variable}}}`, 'g'),
            value
          )
        }
      }
    }

    const message: OutreachMessage = {
      id: this.generateId(),
      leadId: config.leadId,
      channel: 'email', // Default, will be set by caller
      subject: personalizedSubject,
      body: personalizedBody,
      status: 'draft',
      responseReceived: false,
    }

    this.messages.push(message)
    return message
  }

  /**
   * Send a message through the specified channel
   */
  async sendMessage(message: OutreachMessage): Promise<boolean> {
    try {
      // Simulate API call to send message
      await this.simulateDelay(500)

      // Update message status
      const index = this.messages.findIndex((m) => m.id === message.id)
      if (index !== -1) {
        this.messages[index] = {
          ...message,
          status: 'sent',
          sentAt: new Date().toISOString(),
        }
      }

      // Simulate delivery confirmation after a delay
      setTimeout(() => {
        const idx = this.messages.findIndex((m) => m.id === message.id)
        if (idx !== -1 && this.messages[idx].status === 'sent') {
          this.messages[idx].status = 'delivered'
        }
      }, 2000)

      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }

  /**
   * Schedule a message for future delivery
   */
  async scheduleMessage(
    message: OutreachMessage,
    scheduledAt: string
  ): Promise<boolean> {
    try {
      const index = this.messages.findIndex((m) => m.id === message.id)
      if (index !== -1) {
        this.messages[index] = {
          ...message,
          status: 'scheduled',
          scheduledAt,
        }
      }
      return true
    } catch (error) {
      console.error('Failed to schedule message:', error)
      return false
    }
  }

  /**
   * Run an outreach sequence for a lead
   */
  async runSequence(lead: Lead, sequence: OutreachSequence): Promise<void> {
    const config: OutreachConfig = {
      leadId: lead.id,
      businessName: lead.businessName,
      ownerName: lead.ownerName,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
    }

    for (const step of sequence.steps) {
      // Calculate scheduled time based on step day
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + step.day)

      const message = await this.createPersonalizedMessage(config, step.template)
      message.channel = step.channel
      message.subject = step.subject

      if (step.day === 0) {
        // Send immediately
        await this.sendMessage(message)
      } else {
        // Schedule for later
        await this.scheduleMessage(message, scheduledDate.toISOString())
      }

      // Wait between steps if not immediate
      if (step.day > 0) {
        await this.simulateDelay(300)
      }
    }
  }

  /**
   * Track and process responses from leads
   */
  async trackResponses(): Promise<void> {
    // In production, this would poll email/SMS APIs for responses
    // For now, we'll simulate some responses
    for (const message of this.messages) {
      if (message.status === 'delivered' && !message.responseReceived) {
        // Simulate random response (10% chance)
        if (Math.random() < 0.1) {
          const index = this.messages.findIndex((m) => m.id === message.id)
          if (index !== -1) {
            this.messages[index].responseReceived = true
            this.messages[index].responseContent = 'Thanks for reaching out! Let\'s talk.'
          }
        }
      }
    }
  }

  /**
   * Rotate through different message angles to avoid repetition
   */
  async rotateMessageAngles(): Promise<string[]> {
    const angles = Object.keys(MESSAGE_ANGLES)
    const rotatedAngles: string[] = []

    for (let i = 0; i < angles.length; i++) {
      const index = (this.currentAngleIndex + i) % angles.length
      rotatedAngles.push(angles[index])
    }

    this.currentAngleIndex = (this.currentAngleIndex + 1) % angles.length
    return rotatedAngles
  }

  /**
   * Get all messages for a lead
   */
  getMessagesForLead(leadId: string): OutreachMessage[] {
    return this.messages.filter((m) => m.leadId === leadId)
  }

  /**
   * Get all sequences
   */
  getSequences(): OutreachSequence[] {
    return Array.from(this.sequences.values())
  }

  /**
   * Get a specific sequence
   */
  getSequence(id: string): OutreachSequence | undefined {
    return this.sequences.get(id)
  }

  /**
   * Update a sequence
   */
  updateSequence(sequence: OutreachSequence): void {
    this.sequences.set(sequence.id, sequence)
  }

  /**
   * Add a new sequence
   */
  addSequence(sequence: OutreachSequence): void {
    this.sequences.set(sequence.id, sequence)
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractVariables(template: string): string[] {
    const matches = template.match(/{{(\w+)}}/g) || []
    return [...new Set(matches.map((m) => m.replace(/{{|}}/g, '')))]
  }

  private getVariableValue(config: OutreachConfig, variable: string): string {
    const variableMap: Record<string, string> = {
      businessName: config.businessName,
      ownerName: config.ownerName,
      email: config.email,
      phone: config.phone,
      website: config.website,
      websitePreviewUrl: config.prebuiltAssets?.prebuiltSiteUrl || 'https://preview.example.com',
    }
    return variableMap[variable] || ''
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const outreachAgent = new OutreachAgent()
