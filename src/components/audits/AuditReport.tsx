/**
 * AuditReport - Detailed audit report display component
 * 
 * Displays comprehensive SEO audit results with scores,
 * issues, recommendations, and export functionality.
 */

import { useState } from 'react'
import { AuditReport, AuditIssue } from '../../agents/seo-audit-agent'

interface AuditReportViewProps {
  report: AuditReport
  onGenerateBrief?: (brief: string) => void
  onExportPDF?: () => void
}

export function AuditReportView({ report, onGenerateBrief, onExportPDF }: AuditReportViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#10B981' // green
    if (score >= 40) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 70) return 'Good'
    if (score >= 40) return 'Needs Work'
    return 'Poor'
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626'
      case 'high': return '#EA580C'
      case 'medium': return '#CA8A04'
      case 'low': return '#65A30D'
      default: return '#6B7280'
    }
  }

  const generateBrief = async () => {
    setIsGeneratingBrief(true)
    try {
      const { SEOAuditAgent } = await import('../../agents/seo-audit-agent')
      const agent = new SEOAuditAgent()
      const brief = await agent.generateOpportunityBrief(report)
      
      if (onGenerateBrief) {
        onGenerateBrief(brief)
      }
    } catch (error) {
      console.error('Failed to generate brief:', error)
    } finally {
      setIsGeneratingBrief(false)
    }
  }

  const ScoreGauge = ({ score, label, size = 'large' }: { score: number; label: string; size?: 'large' | 'small' }) => {
    const circumference = size === 'large' ? 283 : 157
    const radius = size === 'large' ? 45 : 25
    const offset = circumference - (score / 100) * circumference
    const strokeWidth = size === 'large' ? 8 : 4

    return (
      <div className={`score-gauge score-gauge-${size}`}>
        <svg width={size === 'large' ? 120 : 60} height={size === 'large' ? 120 : 60}>
          <circle
            cx={size === 'large' ? 60 : 30}
            cy={size === 'large' ? 60 : 30}
            r={radius}
            fill="none"
            stroke="#134E4A"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size === 'large' ? 60 : 30}
            cy={size === 'large' ? 60 : 30}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size === 'large' ? 60 : 30} ${size === 'large' ? 60 : 30})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="score-gauge-value">
          <span className="score-number" style={{ color: getScoreColor(score) }}>{score}</span>
          <span className="score-label">{label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="audit-report">
      <style>{`
        .audit-report {
          background: linear-gradient(135deg, #0f1f1d 0%, #0a1716 100%);
          border: 1px solid #134E4A;
          border-radius: 12px;
          padding: 24px;
          color: #F0FDFA;
          font-family: 'Geist', sans-serif;
        }

        .audit-report h2 {
          color: #2DD4BF;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .audit-report h2::before {
          content: '📊';
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #134E4A;
        }

        .report-title {
          flex: 1;
        }

        .report-title h3 {
          color: #F0FDFA;
          font-size: 1.25rem;
          margin-bottom: 4px;
        }

        .report-url {
          color: #5EEAD4;
          font-size: 0.875rem;
          word-break: break-all;
        }

        .report-meta {
          color: #5EEAD4;
          font-size: 0.75rem;
          margin-top: 8px;
        }

        .overall-score {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-gauge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .score-gauge-value {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-gauge-large .score-number {
          font-size: 2rem;
          font-weight: 700;
        }

        .score-gauge-large .score-label {
          font-size: 0.75rem;
          color: #5EEAD4;
        }

        .score-gauge-small .score-number {
          font-size: 1rem;
          font-weight: 600;
        }

        .score-gauge-small .score-label {
          font-size: 0.625rem;
          color: #5EEAD4;
        }

        .section {
          margin-bottom: 20px;
          border: 1px solid #134E4A;
          border-radius: 8px;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: rgba(19, 78, 74, 0.3);
          cursor: pointer;
          transition: background 0.15s;
        }

        .section-header:hover {
          background: rgba(19, 78, 74, 0.5);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-title h4 {
          color: #F0FDFA;
          font-weight: 600;
          font-size: 1rem;
        }

        .section-toggle {
          color: #5EEAD4;
          transition: transform 0.2s;
        }

        .section-toggle.expanded {
          transform: rotate(180deg);
        }

        .section-content {
          padding: 16px;
          background: rgba(10, 23, 22, 0.5);
          display: none;
        }

        .section-content.expanded {
          display: block;
        }

        .scores-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .score-card {
          background: rgba(19, 78, 74, 0.2);
          border: 1px solid #134E4A;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .score-card-title {
          color: #5EEAD4;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .issue-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(19, 78, 74, 0.15);
          border-radius: 6px;
          border-left: 3px solid;
        }

        .severity-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .issue-content {
          flex: 1;
        }

        .issue-category {
          color: #5EEAD4;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .issue-description {
          color: #F0FDFA;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .issue-recommendation {
          color: #99F6E4;
          font-size: 0.8rem;
          padding: 8px;
          background: rgba(13, 148, 136, 0.1);
          border-radius: 4px;
        }

        .strengths-list,
        .recommendations-list,
        .opportunities-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .strengths-list li,
        .recommendations-list li,
        .opportunities-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #F0FDFA;
          font-size: 0.9rem;
        }

        .strengths-list li::before {
          content: '✓';
          color: #10B981;
          font-weight: bold;
        }

        .recommendations-list li::before {
          content: '→';
          color: #2DD4BF;
        }

        .opportunities-list li::before {
          content: '★';
          color: #F59E0B;
        }

        .keywords-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .keywords-column {
          background: rgba(19, 78, 74, 0.2);
          border-radius: 6px;
          padding: 12px;
        }

        .keywords-column h5 {
          color: #5EEAD4;
          font-size: 0.875rem;
          margin-bottom: 8px;
        }

        .keyword-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .keyword-tag {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .keyword-found {
          background: rgba(16, 185, 129, 0.2);
          color: #6EE7B7;
        }

        .keyword-missing {
          background: rgba(239, 68, 68, 0.2);
          color: #FCA5A5;
        }

        .quick-wins {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quick-win-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 6px;
        }

        .quick-win-icon {
          font-size: 1.25rem;
        }

        .quick-win-text {
          color: #FCD34D;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #134E4A;
        }

        .action-button {
          flex: 1;
          padding: 12px 20px;
          border: 1px solid;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
          border-color: #0D9488;
          color: white;
        }

        .action-button.secondary {
          background: transparent;
          border-color: #134E4A;
          color: #5EEAD4;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .action-button.primary:hover {
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
        }

        .action-button.secondary:hover {
          border-color: #2DD4BF;
          background: rgba(45, 212, 191, 0.1);
        }

        .competitor-analysis {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .competitor-column {
          background: rgba(19, 78, 74, 0.2);
          border-radius: 8px;
          padding: 16px;
        }

        .competitor-column h5 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .competitor-column.advantages h5 {
          color: #10B981;
        }

        .competitor-column.gaps h5 {
          color: #F59E0B;
        }

        @media (max-width: 768px) {
          .scores-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .keywords-section {
            grid-template-columns: 1fr;
          }

          .competitor-analysis {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2>SEO Audit Report</h2>

      <div className="report-header">
        <div className="report-title">
          <h3>{report.websiteUrl || 'Website Audit'}</h3>
          <div className="report-url">{report.websiteUrl}</div>
          <div className="report-meta">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </div>
        </div>
        <div className="overall-score">
          <ScoreGauge score={report.overallScore} label={getScoreLabel(report.overallScore)} />
        </div>
      </div>

      {/* Scores Overview */}
      <div className="scores-grid">
        <div className="score-card">
          <div className="score-card-title">Website</div>
          <ScoreGauge score={report.websiteScore} label={getScoreLabel(report.websiteScore)} size="small" />
        </div>
        <div className="score-card">
          <div className="score-card-title">SEO</div>
          <ScoreGauge score={report.seoScore} label={getScoreLabel(report.seoScore)} size="small" />
        </div>
        <div className="score-card">
          <div className="score-card-title">GMB</div>
          <ScoreGauge score={report.gmbScore} label={getScoreLabel(report.gmbScore)} size="small" />
        </div>
        <div className="score-card">
          <div className="score-card-title">Competitive</div>
          <ScoreGauge score={report.competitorScore} label={getScoreLabel(report.competitorScore)} size="small" />
        </div>
      </div>

      {/* Quick Wins Section */}
      {report.quickWins.length > 0 && (
        <div className="section">
          <div className="section-header" onClick={() => toggleSection('quickwins')}>
            <div className="section-title">
              <span>⚡</span>
              <h4>Quick Wins (High Impact, Low Effort)</h4>
            </div>
            <span className={`section-toggle ${expandedSections.has('quickwins') ? 'expanded' : ''}`}>▼</span>
          </div>
          <div className={`section-content ${expandedSections.has('quickwins') ? 'expanded' : ''}`}>
            <div className="quick-wins">
              {report.quickWins.map((win, index) => (
                <div key={index} className="quick-win-item">
                  <span className="quick-win-icon">⚡</span>
                  <span className="quick-win-text">{win}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Website Audit Section */}
      <div className="section">
        <div className="section-header" onClick={() => toggleSection('website')}>
          <div className="section-title">
            <span>🌐</span>
            <h4>Website Audit</h4>
          </div>
          <span className={`section-toggle ${expandedSections.has('website') ? 'expanded' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${expandedSections.has('website') ? 'expanded' : ''}`}>
          {report.websiteStrengths.length > 0 && (
            <>
              <h5 style={{ color: '#2DD4BF', marginBottom: '12px' }}>Strengths</h5>
              <ul className="strengths-list">
                {report.websiteStrengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </>
          )}
          
          {report.websiteIssues.length > 0 && (
            <>
              <h5 style={{ color: '#2DD4BF', marginBottom: '12px', marginTop: '16px' }}>Issues Found</h5>
              <div className="issues-list">
                {report.websiteIssues.map((issue, index) => (
                  <div key={index} className="issue-item" style={{ borderColor: getSeverityColor(issue.severity) }}>
                    <span className="severity-badge" style={{ background: getSeverityColor(issue.severity), color: 'white' }}>
                      {issue.severity}
                    </span>
                    <div className="issue-content">
                      <div className="issue-category">{issue.category}</div>
                      <div className="issue-description">{issue.description}</div>
                      <div className="issue-recommendation">{issue.recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SEO Audit Section */}
      <div className="section">
        <div className="section-header" onClick={() => toggleSection('seo')}>
          <div className="section-title">
            <span>🔍</span>
            <h4>SEO Audit</h4>
          </div>
          <span className={`section-toggle ${expandedSections.has('seo') ? 'expanded' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${expandedSections.has('seo') ? 'expanded' : ''}`}>
          {/* Keywords Analysis */}
          <div className="keywords-section">
            <div className="keywords-column">
              <h5>Keywords Found ✓</h5>
              <div className="keyword-tags">
                {report.keywordsFound.length > 0 ? (
                  report.keywordsFound.map((kw, index) => (
                    <span key={index} className="keyword-tag keyword-found">{kw}</span>
                  ))
                ) : (
                  <span style={{ color: '#5EEAD4', fontSize: '0.8rem' }}>No keywords detected</span>
                )}
              </div>
            </div>
            <div className="keywords-column">
              <h5>Keywords Missing</h5>
              <div className="keyword-tags">
                {report.keywordsMissing.length > 0 ? (
                  report.keywordsMissing.map((kw, index) => (
                    <span key={index} className="keyword-tag keyword-missing">{kw}</span>
                  ))
                ) : (
                  <span style={{ color: '#5EEAD4', fontSize: '0.8rem' }}>All target keywords present</span>
                )}
              </div>
            </div>
          </div>

          {report.seoIssues.length > 0 && (
            <>
              <h5 style={{ color: '#2DD4BF', marginBottom: '12px', marginTop: '16px' }}>SEO Issues</h5>
              <div className="issues-list">
                {report.seoIssues.map((issue, index) => (
                  <div key={index} className="issue-item" style={{ borderColor: getSeverityColor(issue.severity) }}>
                    <span className="severity-badge" style={{ background: getSeverityColor(issue.severity), color: 'white' }}>
                      {issue.severity}
                    </span>
                    <div className="issue-content">
                      <div className="issue-category">{issue.category}</div>
                      <div className="issue-description">{issue.description}</div>
                      <div className="issue-recommendation">{issue.recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {report.seoRecommendations.length > 0 && (
            <>
              <h5 style={{ color: '#2DD4BF', marginBottom: '12px', marginTop: '16px' }}>Recommendations</h5>
              <ul className="recommendations-list">
                {report.seoRecommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* GMB Audit Section */}
      <div className="section">
        <div className="section-header" onClick={() => toggleSection('gmb')}>
          <div className="section-title">
            <span>📍</span>
            <h4>Google Business Profile</h4>
          </div>
          <span className={`section-toggle ${expandedSections.has('gmb') ? 'expanded' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${expandedSections.has('gmb') ? 'expanded' : ''}`}>
          {report.gmbIssues.length > 0 && (
            <div className="issues-list">
              {report.gmbIssues.map((issue, index) => (
                <div key={index} className="issue-item" style={{ borderColor: getSeverityColor(issue.severity) }}>
                  <span className="severity-badge" style={{ background: getSeverityColor(issue.severity), color: 'white' }}>
                    {issue.severity}
                  </span>
                  <div className="issue-content">
                    <div className="issue-category">{issue.category}</div>
                    <div className="issue-description">{issue.description}</div>
                    <div className="issue-recommendation">{issue.recommendation}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {report.gmbRecommendations.length > 0 && (
            <>
              <h5 style={{ color: '#2DD4BF', marginBottom: '12px', marginTop: '16px' }}>Recommendations</h5>
              <ul className="recommendations-list">
                {report.gmbRecommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Competitive Analysis Section */}
      <div className="section">
        <div className="section-header" onClick={() => toggleSection('competitive')}>
          <div className="section-title">
            <span>🏆</span>
            <h4>Competitive Analysis</h4>
          </div>
          <span className={`section-toggle ${expandedSections.has('competitive') ? 'expanded' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${expandedSections.has('competitive') ? 'expanded' : ''}`}>
          <div className="competitor-analysis">
            <div className="competitor-column advantages">
              <h5>✓ Advantages</h5>
              {report.competitorAdvantages.length > 0 ? (
                <ul className="strengths-list">
                  {report.competitorAdvantages.map((adv, index) => (
                    <li key={index}>{adv}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#5EEAD4', fontSize: '0.8rem' }}>No advantages detected yet</p>
              )}
            </div>
            <div className="competitor-column gaps">
              <h5>⚠ Gaps</h5>
              {report.competitiveGaps.length > 0 ? (
                <ul className="recommendations-list">
                  {report.competitiveGaps.map((gap, index) => (
                    <li key={index}>{gap}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#5EEAD4', fontSize: '0.8rem' }}>No significant gaps detected</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Opportunities Section */}
      {report.topOpportunities.length > 0 && (
        <div className="section">
          <div className="section-header" onClick={() => toggleSection('opportunities')}>
            <div className="section-title">
              <span>🎯</span>
              <h4>Top Opportunities</h4>
            </div>
            <span className={`section-toggle ${expandedSections.has('opportunities') ? 'expanded' : ''}`}>▼</span>
          </div>
          <div className={`section-content ${expandedSections.has('opportunities') ? 'expanded' : ''}`}>
            <ul className="opportunities-list">
              {report.topOpportunities.map((opp, index) => (
                <li key={index}>{opp}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-button primary" onClick={generateBrief} disabled={isGeneratingBrief}>
          {isGeneratingBrief ? '⏳ Generating...' : '📝 Generate Opportunity Brief'}
        </button>
        <button className="action-button secondary" onClick={onExportPDF}>
          📄 Export PDF
        </button>
      </div>
    </div>
  )
}

export default AuditReportView