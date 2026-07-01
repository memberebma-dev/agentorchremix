/**
 * BulkAuditManager - Bulk audit management interface
 * 
 * Manages the queue of leads for bulk SEO audits,
 * tracks progress, and provides batch actions.
 */

import { useState, useEffect } from 'react'
import { Lead, getLeads } from '../../lib/targeting'
import { SEOAuditAgent, AuditReport, BulkAuditProgress, TARGET_KEYWORDS } from '../../agents/seo-audit-agent'

interface BulkAuditManagerProps {
  onAuditsComplete?: (reports: AuditReport[]) => void
}

interface AuditQueueItem {
  lead: Lead
  status: 'pending' | 'running' | 'completed' | 'failed'
  report?: AuditReport
  error?: string
}

export function BulkAuditManager({ onAuditsComplete }: BulkAuditManagerProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [queue, setQueue] = useState<AuditQueueItem[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [auditTypes, setAuditTypes] = useState({
    website: true,
    seo: true,
    gmb: true,
    competitive: true
  })
  const [competitors, setCompetitors] = useState('')
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [results, setResults] = useState<AuditReport[]>([])

  // Load leads
  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      const fetchedLeads = await getLeads({ limit: 100 })
      setLeads(fetchedLeads)
    } catch (error) {
      console.error('Failed to load leads:', error)
    }
  }

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(l => l.id))
    }
  }

  const addToQueue = () => {
    const selectedLeadObjects = leads.filter(l => selectedLeads.includes(l.id))
    const queueItems: AuditQueueItem[] = selectedLeadObjects.map(lead => ({
      lead,
      status: 'pending'
    }))
    setQueue(queueItems)
    setSelectedLeads([])
  }

  const clearQueue = () => {
    setQueue([])
    setCurrentIndex(-1)
    setResults([])
  }

  const runBulkAudit = async () => {
    if (queue.length === 0) return

    setIsRunning(true)
    const agent = new SEOAuditAgent(TARGET_KEYWORDS)

    const selectedAuditTypes = Object.entries(auditTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type)

    const competitorList = competitors
      .split(',')
      .map(c => c.trim())
      .filter(c => c)

    const allResults: AuditReport[] = []

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      
      // Update status to running
      setQueue(prev => prev.map((q, idx) =>
        idx === i ? { ...q, status: 'running' } : q
      ))
      setCurrentIndex(i)

      try {
        const report = await agent.runFullAudit(item.lead, selectedAuditTypes, competitorList)
        
        // Update status to completed
        setQueue(prev => prev.map((q, idx) =>
          idx === i ? { ...q, status: 'completed', report } : q
        ))
        
        allResults.push(report)
      } catch (error) {
        // Update status to failed
        setQueue(prev => prev.map((q, idx) =>
          idx === i ? { 
            ...q, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : q
        ))
      }

      // Small delay between audits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setResults(allResults)
    setIsRunning(false)
    setCurrentIndex(-1)

    if (onAuditsComplete) {
      onAuditsComplete(allResults)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#10B981'
    if (score >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳'
      case 'running': return '🔄'
      case 'completed': return '✓'
      case 'failed': return '✗'
      default: return '○'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#6B7280'
      case 'running': return '#3B82F6'
      case 'completed': return '#10B981'
      case 'failed': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const completedCount = queue.filter(q => q.status === 'completed').length
  const failedCount = queue.filter(q => q.status === 'failed').length
  const progress = queue.length > 0 ? (completedCount + failedCount) / queue.length * 100 : 0

  return (
    <div className="bulk-audit-manager">
      <style>{`
        .bulk-audit-manager {
          background: linear-gradient(135deg, #0f1f1d 0%, #0a1716 100%);
          border: 1px solid #134E4A;
          border-radius: 12px;
          padding: 24px;
          color: #F0FDFA;
          font-family: 'Geist', sans-serif;
        }

        .bulk-audit-manager h2 {
          color: #2DD4BF;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bulk-audit-manager h2::before {
          content: '📋';
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section {
          background: rgba(19, 78, 74, 0.2);
          border: 1px solid #134E4A;
          border-radius: 8px;
          padding: 16px;
        }

        .section-title {
          color: #2DD4BF;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lead-selector {
          max-height: 300px;
          overflow-y: auto;
        }

        .lead-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid rgba(19, 78, 74, 0.3);
          transition: background 0.15s;
        }

        .lead-item:hover {
          background: rgba(13, 148, 136, 0.15);
        }

        .lead-item.selected {
          background: rgba(13, 148, 136, 0.25);
        }

        .lead-item input {
          accent-color: #0D9488;
        }

        .lead-info {
          flex: 1;
          min-width: 0;
        }

        .lead-name {
          color: #F0FDFA;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .lead-meta {
          color: #5EEAD4;
          font-size: 0.75rem;
        }

        .select-all-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #134E4A;
          border-radius: 6px;
          color: #5EEAD4;
          cursor: pointer;
          font-size: 0.8rem;
          margin-bottom: 8px;
        }

        .select-all-btn:hover {
          background: rgba(13, 148, 136, 0.1);
        }

        .queue-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .queue-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(19, 78, 74, 0.15);
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .queue-status {
          font-size: 1.25rem;
        }

        .queue-info {
          flex: 1;
          min-width: 0;
        }

        .queue-name {
          color: #F0FDFA;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .queue-meta {
          color: #5EEAD4;
          font-size: 0.75rem;
        }

        .queue-score {
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .audit-types {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .audit-type-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #134E4A;
          border-radius: 6px;
          cursor: pointer;
        }

        .audit-type-checkbox:hover {
          border-color: #2DD4BF;
        }

        .audit-type-checkbox.selected {
          background: rgba(13, 148, 136, 0.2);
          border-color: #0D9488;
        }

        .audit-type-checkbox input {
          accent-color: #0D9488;
        }

        .audit-type-label {
          color: #F0FDFA;
          font-size: 0.85rem;
        }

        input[type="text"] {
          width: 100%;
          padding: 10px;
          background: rgba(19, 78, 74, 0.2);
          border: 1px solid #134E4A;
          border-radius: 6px;
          color: #F0FDFA;
          font-family: inherit;
          font-size: 0.85rem;
        }

        input[type="text"]:focus {
          outline: none;
          border-color: #0D9488;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
          border: none;
          color: white;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid #134E4A;
          color: #5EEAD4;
        }

        .btn-danger {
          background: transparent;
          border: 1px solid #DC2626;
          color: #FCA5A5;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .progress-container {
          padding: 16px;
          background: rgba(19, 78, 74, 0.2);
          border-radius: 8px;
          margin-top: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .progress-text {
          color: #5EEAD4;
          font-size: 0.875rem;
        }

        .progress-bar {
          height: 8px;
          background: #134E4A;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0D9488, #2DD4BF);
          transition: width 0.3s ease;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .results-table th,
        .results-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid rgba(19, 78, 74, 0.3);
        }

        .results-table th {
          color: #5EEAD4;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .results-table td {
          color: #F0FDFA;
          font-size: 0.9rem;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #5EEAD4;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: rgba(19, 78, 74, 0.2);
          border: 1px solid #134E4A;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2DD4BF;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #5EEAD4;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .two-column {
            grid-template-columns: 1fr;
          }

          .summary-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <h2>Bulk Audit Manager</h2>

      <div className="two-column">
        {/* Left Column - Lead Selection & Configuration */}
        <div className="column">
          {/* Lead Selection */}
          <div className="section">
            <div className="section-title">
              <span>👥</span>
              Select Leads
            </div>
            <button className="select-all-btn" onClick={handleSelectAll}>
              {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
            </button>
            <div className="lead-selector">
              {leads.length === 0 ? (
                <div className="empty-state">No leads available</div>
              ) : (
                leads.map(lead => (
                  <div 
                    key={lead.id}
                    className={`lead-item ${selectedLeads.includes(lead.id) ? 'selected' : ''}`}
                    onClick={() => handleSelectLead(lead.id)}
                  >
                    <input 
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => {}}
                    />
                    <div className="lead-info">
                      <div className="lead-name">{lead.business_name}</div>
                      <div className="lead-meta">{lead.city} | {lead.website || 'No website'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedLeads.length > 0 && (
              <button 
                className="btn btn-primary" 
                onClick={addToQueue}
                style={{ marginTop: '12px', width: '100%' }}
              >
                Add {selectedLeads.length} to Queue
              </button>
            )}
          </div>

          {/* Audit Configuration */}
          <div className="section">
            <div className="section-title">
              <span>⚙️</span>
              Audit Configuration
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#5EEAD4', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                Audit Types
              </label>
              <div className="audit-types">
                {Object.entries(auditTypes).map(([type, enabled]) => (
                  <label 
                    key={type}
                    className={`audit-type-checkbox ${enabled ? 'selected' : ''}`}
                  >
                    <input 
                      type="checkbox"
                      checked={enabled}
                      onChange={() => setAuditTypes(prev => ({ ...prev, [type]: !prev[type as keyof typeof prev] }))}
                    />
                    <span className="audit-type-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ color: '#5EEAD4', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                Competitors (comma-separated URLs)
              </label>
              <input 
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g., competitor1.com, competitor2.com"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Queue & Results */}
        <div className="column">
          {/* Queue */}
          <div className="section">
            <div className="section-title">
              <span>📋</span>
              Audit Queue ({queue.length})
            </div>
            
            {queue.length === 0 ? (
              <div className="empty-state">
                No leads in queue. Select leads from the left and add them.
              </div>
            ) : (
              <div className="queue-list">
                {queue.map((item, index) => (
                  <div key={index} className="queue-item">
                    <span className="queue-status">{getStatusIcon(item.status)}</span>
                    <div className="queue-info">
                      <div className="queue-name">{item.lead.business_name}</div>
                      <div className="queue-meta">
                        {item.status === 'running' && 'Running audit...'}
                        {item.status === 'completed' && item.report && `Score: ${item.report.overallScore}/100`}
                        {item.status === 'failed' && item.error}
                      </div>
                    </div>
                    {item.status === 'completed' && item.report && (
                      <span 
                        className="queue-score"
                        style={{ 
                          background: getScoreColor(item.report.overallScore) === '#10B981' ? '#065F46' : 
                                     getScoreColor(item.report.overallScore) === '#F59E0B' ? '#78350F' : '#7F1D1D',
                          color: getScoreColor(item.report.overallScore)
                        }}
                      >
                        {item.report.overallScore}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {isRunning && queue.length > 0 && (
              <div className="progress-container">
                <div className="progress-header">
                  <span className="progress-text">
                    Processing: {completedCount + failedCount} / {queue.length}
                  </span>
                  <span className="progress-text">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="action-buttons" style={{ marginTop: '12px' }}>
              <button 
                className="btn btn-primary"
                onClick={runBulkAudit}
                disabled={isRunning || queue.length === 0}
              >
                {isRunning ? '⏳ Running...' : '▶ Start Bulk Audit'}
              </button>
              <button 
                className="btn btn-danger"
                onClick={clearQueue}
                disabled={isRunning || queue.length === 0}
              >
                Clear Queue
              </button>
            </div>
          </div>

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="section">
              <div className="section-title">
                <span>📊</span>
                Results Summary
              </div>
              
              <div className="summary-stats">
                <div className="stat-card">
                  <div className="stat-value">{results.length}</div>
                  <div className="stat-label">Total Audited</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#10B981' }}>
                    {results.filter(r => r.overallScore >= 70).length}
                  </div>
                  <div className="stat-label">Good Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#F59E0B' }}>
                    {results.filter(r => r.overallScore >= 40 && r.overallScore < 70).length}
                  </div>
                  <div className="stat-label">Needs Work</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#EF4444' }}>
                    {results.filter(r => r.overallScore < 40).length}
                  </div>
                  <div className="stat-label">Poor Score</div>
                </div>
              </div>

              <table className="results-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Website</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((report, index) => (
                    <tr key={index}>
                      <td>{queue[index]?.lead.business_name}</td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {report.websiteUrl || 'N/A'}
                      </td>
                      <td>
                        <span 
                          style={{ 
                            color: getScoreColor(report.overallScore),
                            fontWeight: 600
                          }}
                        >
                          {report.overallScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button 
                className="btn btn-secondary"
                style={{ marginTop: '12px', width: '100%' }}
              >
                🚀 Send All to Outreach
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkAuditManager