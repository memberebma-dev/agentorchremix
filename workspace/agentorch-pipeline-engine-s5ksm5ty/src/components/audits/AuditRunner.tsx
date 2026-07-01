/**
 * AuditRunner - Audit execution interface for SEO Audit Agent
 * 
 * Provides UI for running single or bulk SEO audits on leads,
 * with real-time progress tracking.
 */

import { useState } from 'react'
import { blink } from '../lib/blink'
import { Lead, getLeads } from '../lib/targeting'
import { SEOAuditAgent, AuditReport, BulkAuditProgress, TARGET_KEYWORDS } from '../agents/seo-audit-agent'

interface AuditRunnerProps {
  onAuditComplete?: (reports: AuditReport[]) => void
}

export function AuditRunner({ onAuditComplete }: AuditRunnerProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  
  // Audit type selection
  const [auditTypes, setAuditTypes] = useState({
    website: true,
    seo: true,
    gmb: true,
    competitive: true
  })
  
  // Keywords input
  const [keywords, setKeywords] = useState(TARGET_KEYWORDS.join(', '))
  
  // Competitors input
  const [competitors, setCompetitors] = useState('')
  
  // Progress state
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<BulkAuditProgress | null>(null)
  const [results, setResults] = useState<AuditReport[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load leads for selection
  const loadLeads = async () => {
    try {
      const fetchedLeads = await getLeads({ limit: 100 })
      setLeads(fetchedLeads)
    } catch (err) {
      console.error('Failed to load leads:', err)
    }
  }

  // Initialize on mount
  useState(() => {
    loadLeads()
  })

  const handleAuditTypeToggle = (type: keyof typeof auditTypes) => {
    setAuditTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleLeadSelection = (leadId: string) => {
    if (mode === 'single') {
      setSelectedLeadId(leadId)
      setSelectedLeads([])
    } else {
      setSelectedLeads(prev => 
        prev.includes(leadId) 
          ? prev.filter(id => id !== leadId)
          : [...prev, leadId]
      )
    }
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(l => l.id))
    }
  }

  const runAudit = async () => {
    setIsRunning(true)
    setError(null)
    setResults([])
    setProgress(null)

    try {
      const agent = new SEOAuditAgent(
        keywords.split(',').map(k => k.trim()).filter(k => k)
      )

      const selectedAuditTypes = Object.entries(auditTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type)

      const competitorList = competitors
        .split(',')
        .map(c => c.trim())
        .filter(c => c)

      if (mode === 'single') {
        const lead = leads.find(l => l.id === selectedLeadId)
        if (!lead) {
          setError('Please select a lead')
          setIsRunning(false)
          return
        }

        const report = await agent.runFullAudit(lead, selectedAuditTypes, competitorList)
        setResults([report])
        
        if (onAuditComplete) {
          onAuditComplete([report])
        }
      } else {
        const leadsToAudit = leads.filter(l => selectedLeads.includes(l.id))
        
        if (leadsToAudit.length === 0) {
          setError('Please select at least one lead')
          setIsRunning(false)
          return
        }

        const auditResults = await agent.runBulkAudits(
          leadsToAudit,
          selectedAuditTypes,
          competitorList,
          (prog) => setProgress(prog)
        )

        setResults(auditResults)
        
        if (onAuditComplete) {
          onAuditComplete(auditResults)
        }
      }
    } catch (err) {
      console.error('Audit failed:', err)
      setError(err instanceof Error ? err.message : 'Audit failed')
    } finally {
      setIsRunning(false)
    }
  }

  const getSelectedLeadNames = () => {
    if (mode === 'single') {
      const lead = leads.find(l => l.id === selectedLeadId)
      return lead?.business_name || 'Select a lead'
    }
    return `${selectedLeads.length} leads selected`
  }

  return (
    <div className="audit-runner">
      <style>{`
        .audit-runner {
          background: linear-gradient(135deg, #0f1f1d 0%, #0a1716 100%);
          border: 1px solid #134E4A;
          border-radius: 12px;
          padding: 24px;
          color: #F0FDFA;
          font-family: 'Geist', sans-serif;
        }
        
        .audit-runner h2 {
          color: #2DD4BF;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .audit-runner h2::before {
          content: '🔍';
        }
        
        .mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .mode-toggle button {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #134E4A;
          background: transparent;
          color: #99F6E4;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .mode-toggle button.active {
          background: #0D9488;
          border-color: #0D9488;
          color: #FFFFFF;
        }
        
        .mode-toggle button:hover:not(.active) {
          border-color: #2DD4BF;
          background: rgba(13, 148, 136, 0.1);
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-label {
          display: block;
          color: #99F6E4;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .lead-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .lead-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #134E4A;
          border-radius: 8px;
          background: rgba(19, 78, 74, 0.2);
        }
        
        .lead-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid rgba(19, 78, 74, 0.5);
          transition: background 0.15s;
        }
        
        .lead-item:hover {
          background: rgba(13, 148, 136, 0.15);
        }
        
        .lead-item.selected {
          background: rgba(13, 148, 136, 0.25);
        }
        
        .lead-item input[type="checkbox"],
        .lead-item input[type="radio"] {
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
        
        .audit-types {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .audit-type-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #134E4A;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
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
          width: 18px;
          height: 18px;
        }
        
        .audit-type-label {
          color: #F0FDFA;
          font-weight: 500;
        }
        
        .audit-type-desc {
          color: #5EEAD4;
          font-size: 0.75rem;
        }
        
        input[type="text"],
        textarea {
          width: 100%;
          padding: 12px;
          background: rgba(19, 78, 74, 0.2);
          border: 1px solid #134E4A;
          border-radius: 8px;
          color: #F0FDFA;
          font-family: inherit;
          font-size: 0.9rem;
        }
        
        input[type="text"]:focus,
        textarea:focus {
          outline: none;
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);
        }
        
        .input-hint {
          color: #5EEAD4;
          font-size: 0.75rem;
          margin-top: 4px;
        }
        
        .run-button {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .run-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.4);
        }
        
        .run-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .progress-container {
          margin-top: 20px;
          padding: 16px;
          background: rgba(19, 78, 74, 0.2);
          border-radius: 8px;
          border: 1px solid #134E4A;
        }
        
        .progress-bar {
          height: 8px;
          background: #134E4A;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0D9488, #2DD4BF);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          color: #5EEAD4;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .error-message {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid #DC2626;
          border-radius: 8px;
          color: #FCA5A5;
        }
        
        .results-summary {
          margin-top: 20px;
          padding: 16px;
          background: rgba(13, 148, 136, 0.1);
          border: 1px solid #0D9488;
          border-radius: 8px;
        }
        
        .results-summary h3 {
          color: #2DD4BF;
          margin-bottom: 12px;
        }
        
        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(19, 78, 74, 0.3);
        }
        
        .result-item:last-child {
          border-bottom: none;
        }
        
        .result-score {
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 4px;
        }
        
        .score-high { background: #065F46; color: #6EE7B7; }
        .score-medium { background: #78350F; color: #FCD34D; }
        .score-low { background: #7F1D1D; color: #FCA5A5; }
        
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
      `}</style>

      <h2>SEO Audit Runner</h2>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={mode === 'single' ? 'active' : ''} 
          onClick={() => setMode('single')}
        >
          Single Lead
        </button>
        <button 
          className={mode === 'bulk' ? 'active' : ''} 
          onClick={() => setMode('bulk')}
        >
          Bulk Audit
        </button>
      </div>

      {/* Lead Selection */}
      <div className="section">
        <label className="section-label">
          {mode === 'single' ? 'Select Lead' : 'Select Leads'}
        </label>
        <div className="lead-selector">
          {mode === 'bulk' && (
            <button className="select-all-btn" onClick={handleSelectAll}>
              {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <div className="lead-list">
            {leads.length === 0 ? (
              <div className="lead-item">
                <span className="lead-meta">No leads available. Generate leads first.</span>
              </div>
            ) : (
              leads.map(lead => (
                <div 
                  key={lead.id} 
                  className={`lead-item ${mode === 'single' ? (selectedLeadId === lead.id ? 'selected' : '') : (selectedLeads.includes(lead.id) ? 'selected' : '')}`}
                  onClick={() => handleLeadSelection(lead.id)}
                >
                  {mode === 'single' ? (
                    <input 
                      type="radio" 
                      name="lead" 
                      checked={selectedLeadId === lead.id}
                      onChange={() => {}}
                    />
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => {}}
                    />
                  )}
                  <div className="lead-info">
                    <div className="lead-name">{lead.business_name}</div>
                    <div className="lead-meta">{lead.city}, {lead.state} | {lead.website || 'No website'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Audit Types */}
      <div className="section">
        <label className="section-label">Audit Types</label>
        <div className="audit-types">
          <label className={`audit-type-checkbox ${auditTypes.website ? 'selected' : ''}`}>
            <input 
              type="checkbox" 
              checked={auditTypes.website}
              onChange={() => handleAuditTypeToggle('website')}
            />
            <div>
              <div className="audit-type-label">Website</div>
              <div className="audit-type-desc">Technical & performance</div>
            </div>
          </label>
          <label className={`audit-type-checkbox ${auditTypes.seo ? 'selected' : ''}`}>
            <input 
              type="checkbox" 
              checked={auditTypes.seo}
              onChange={() => handleAuditTypeToggle('seo')}
            />
            <div>
              <div className="audit-type-label">SEO</div>
              <div className="audit-type-desc">Keywords & content</div>
            </div>
          </label>
          <label className={`audit-type-checkbox ${auditTypes.gmb ? 'selected' : ''}`}>
            <input 
              type="checkbox" 
              checked={auditTypes.gmb}
              onChange={() => handleAuditTypeToggle('gmb')}
            />
            <div>
              <div className="audit-type-label">Google Business</div>
              <div className="audit-type-desc">Profile & reviews</div>
            </div>
          </label>
          <label className={`audit-type-checkbox ${auditTypes.competitive ? 'selected' : ''}`}>
            <input 
              type="checkbox" 
              checked={auditTypes.competitive}
              onChange={() => handleAuditTypeToggle('competitive')}
            />
            <div>
              <div className="audit-type-label">Competitive</div>
              <div className="audit-type-desc">Market analysis</div>
            </div>
          </label>
        </div>
      </div>

      {/* Target Keywords */}
      <div className="section">
        <label className="section-label">Target Keywords</label>
        <input 
          type="text" 
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Enter keywords separated by commas"
        />
        <div className="input-hint">Comma-separated keywords for SEO analysis</div>
      </div>

      {/* Competitors */}
      <div className="section">
        <label className="section-label">Competitor Websites (Optional)</label>
        <input 
          type="text" 
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          placeholder="e.g., competitor1.com, competitor2.com"
        />
        <div className="input-hint">Comma-separated list of competitor URLs</div>
      </div>

      {/* Run Button */}
      <button 
        className="run-button" 
        onClick={runAudit}
        disabled={isRunning || (mode === 'single' && !selectedLeadId) || (mode === 'bulk' && selectedLeads.length === 0)}
      >
        {isRunning ? (
          <>⏳ Running Audit...</>
        ) : (
          <>▶ Run Audit on {getSelectedLeadNames()}</>
        )}
      </button>

      {/* Progress */}
      {isRunning && progress && (
        <div className="progress-container">
          <div className="progress-text">
            {progress.completed} / {progress.total} completed
            {progress.failed > 0 && ` (${progress.failed} failed)`}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && !isRunning && (
        <div className="results-summary">
          <h3>Audit Results</h3>
          {results.map((report, index) => (
            <div key={index} className="result-item">
              <span>{report.websiteUrl || 'N/A'}</span>
              <span className={`result-score ${report.overallScore >= 70 ? 'score-high' : report.overallScore >= 40 ? 'score-medium' : 'score-low'}`}>
                {report.overallScore}/100
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AuditRunner