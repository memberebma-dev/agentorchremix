import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { PipelineDashboard } from '@/components/pipeline/PipelineDashboard'
import { LeadsPage } from '@/pages/Leads'
import { ScoresPage } from '@/pages/Scores'
import { AssetsPage } from '@/pages/Assets'
import { OutreachPage } from '@/pages/Outreach'
import { InvoicesPage } from '@/pages/Invoices'
import BillingPage from '@/pages/Billing'
import { LogsPage } from '@/pages/Logs'
import { AuditsPage } from '@/pages/Audits'
import { PrivacyPolicy, TermsConditions } from '@/pages/Legal'
import { AnalyticsPage } from '@/pages/Analytics'
import { AffiliatesPage } from '@/pages/Affiliates'
import { InvoiceRemindersPage } from '@/pages/InvoiceReminders'
import { useBlinkAuth } from '@blinkdotnew/react'
import { blink } from '@/lib/blink'
import { Button } from '@/components/ui/button'
import { Loader2, LogOut, Zap, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { BACKEND_URL } from '@/lib/api'
import { PipelineConfig, loadPipelineConfig, savePipelineConfig, SUGGESTED_NICHES } from '@/lib/pipelineConfig'

type PipelineView =
  | 'dashboard'
  | 'leads'
  | 'scores'
  | 'assets'
  | 'outreach'
  | 'invoices'
  | 'logs'
  | 'audits'
  | 'settings'
  | 'privacy'
  | 'terms'
  | 'billing'
  | 'analytics'
  | 'affiliates'
  | 'reminders'

function App() {
  const { isAuthenticated, isLoading } = useBlinkAuth()
  const [activeView, setActiveView] = useState<PipelineView>('dashboard')
  const queryClient = useQueryClient()

  // Global auto-refresh every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['agentRuns'] })
      queryClient.invalidateQueries({ queryKey: ['pipelineStats'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      queryClient.invalidateQueries({ queryKey: ['generatedAssets'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    }, 20000)
    return () => clearInterval(interval)
  }, [queryClient])

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight italic">AgentOrch</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Autonomous Acquisition & Passive Revenue Engine for Digital Services Agencies
            </p>
          </div>
          <div className="space-y-4">
            <Button
              className="w-full h-12 bg-teal-600 hover:bg-teal-500 text-lg font-semibold"
              onClick={() => blink.auth.login(window.location.href)}
            >
              Access Engine
            </Button>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-left">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Offerings</p>
                <p className="text-xs text-slate-300 mt-1">SEO • AEO • GEO</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-left">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Automation</p>
                <p className="text-xs text-slate-300 mt-1">AI Assets • Content</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Secure login provided by Blink Auth • By accessing you agree to our Terms
          </p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <PipelineDashboard onNavigate={setActiveView} />
      case 'leads': return <LeadsPage />
      case 'scores': return <ScoresPage />
      case 'assets': return <AssetsPage />
      case 'outreach': return <OutreachPage />
      case 'invoices': return <InvoicesPage />
      case 'logs': return <LogsPage />
      case 'audits': return <AuditsPage />
      case 'settings': return <SettingsPage />
      case 'billing': return <BillingPage />
      case 'privacy': return <PrivacyPolicy />
      case 'terms': return <TermsConditions />
      case 'analytics': return <AnalyticsPage />
      case 'affiliates': return <AffiliatesPage />
      case 'reminders': return <InvoiceRemindersPage />
      default: return <PipelineDashboard onNavigate={setActiveView} />
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar activeView={activeView} onViewChange={(view: string) => setActiveView(view as PipelineView)} />
      <main className="flex-1 lg:pl-[280px]">
        <div className="p-6">
          {renderView()}
        </div>
      </main>
    </div>
  )
}

function SettingsPage() {
  const { user } = useBlinkAuth()
  const [stripeStatus, setStripeStatus] = useState<'checking' | 'connected' | 'not_connected'>('checking')

  const checkStripeStatus = async () => {
    setStripeStatus('checking')
    try {
      const res = await fetch(`${BACKEND_URL}/stripe/products-with-prices`)
      setStripeStatus(res.ok ? 'connected' : 'not_connected')
    } catch {
      setStripeStatus('not_connected')
    }
  }

  useEffect(() => { checkStripeStatus() }, [])

  const isStripeConnected = stripeStatus === 'connected'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight italic">Engine Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your acquisition system and integrations</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Stripe Integration */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#635BFF]/15 text-[#635BFF]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Stripe Integration</h2>
              <p className="text-xs text-slate-500">Passive revenue collection via autonomous invoicing</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-5">
            Connect your Stripe account so the engine automatically sends $4,997 Growth Package
            invoices when bridge lender prospects say "yes" to your outreach.
          </p>

          {stripeStatus === 'checking' ? (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-800/40 border border-slate-700/40 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking Stripe connection...
            </div>
          ) : isStripeConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-400">Stripe Connected</p>
                  <p className="text-xs text-slate-500 mt-0.5">Live invoices &amp; charges are backed by your Stripe account</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-white"
                  onClick={checkStripeStatus}
                >
                  Recheck
                </Button>
              </div>
              <a
                href="https://dashboard.stripe.com/invoices"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#635BFF] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View invoices in Stripe Dashboard
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-semibold text-red-400">Stripe not connected</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-300">To enable live invoicing &amp; payments:</p>
                <ol className="space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-[#635BFF] hover:underline">Stripe API Keys</a> and copy your secret key</li>
                  <li>Set it as the <span className="font-mono bg-slate-900 px-1 rounded">STRIPE_SECRET_KEY</span> environment variable on the backend</li>
                  <li>Add a webhook endpoint pointing at <span className="font-mono bg-slate-900 px-1 rounded">{BACKEND_URL}/stripe/webhook</span> and set <span className="font-mono bg-slate-900 px-1 rounded">STRIPE_WEBHOOK_SECRET</span></li>
                </ol>
              </div>
              <Button
                className="w-full bg-[#635BFF] hover:bg-[#5851E5] text-white font-semibold gap-2"
                onClick={checkStripeStatus}
              >
                <Zap className="w-4 h-4" />
                Recheck Connection
              </Button>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{user?.email || 'Authenticated User'}</p>
              <p className="text-xs text-slate-500">Authenticated via Blink Auth</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => blink.auth.logout()}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Pipeline Config */}
        <PipelineConfigCard />

        {/* Acquisition Flow Reference */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Acquisition Flow Reference</h2>
          <div className="space-y-2">
            {[
              { step: '01', name: 'Lead Discovery', desc: 'Pull bridge lenders from Google Maps & directories' },
              { step: '02', name: 'Scoring', desc: 'Score on digital visibility, SEO gaps, and ad activity' },
              { step: '03', name: 'Asset Generation', desc: 'Build audit report + custom preview website' },
              { step: '04', name: 'Outreach', desc: 'Send value-first email with assets attached' },
              { step: '05', name: 'Invoicing', desc: 'Auto-invoice on "yes" — $4,997 Growth Package' },
              { step: '06', name: 'Repurposing', desc: 'Re-use assets for next prospect if no reply in 48h' },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40"
              >
                <span className="text-[10px] font-bold text-teal-500 w-6 flex-shrink-0">{item.step}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PipelineConfigCard() {
  const [config, setConfig] = useState<PipelineConfig>(loadPipelineConfig)

  const handleSave = () => {
    savePipelineConfig(config)
    toast.success('Configuration saved.')
  }

  return (
    <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
      <h2 className="text-lg font-semibold text-white mb-4">Pipeline Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block">
            Default Lead Score Threshold
          </label>
          <input
            type="number"
            value={config.leadScoreThreshold}
            onChange={(e) => setConfig(c => ({ ...c, leadScoreThreshold: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block">Growth Package Price ($)</label>
          <input
            type="number"
            value={config.growthPackagePrice}
            onChange={(e) => setConfig(c => ({ ...c, growthPackagePrice: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block">
            Target Niche
            <span className="text-slate-600 font-normal ml-1">(what Lead Discovery searches for — change this to stop rediscovering the same businesses)</span>
          </label>
          <select
            value={SUGGESTED_NICHES.includes(config.niche) ? config.niche : ''}
            onChange={(e) => { if (e.target.value) setConfig(c => ({ ...c, niche: e.target.value })) }}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm mb-2"
          >
            <option value="" disabled>Pick a suggested niche...</option>
            {SUGGESTED_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input
            type="text"
            value={config.niche}
            onChange={(e) => setConfig(c => ({ ...c, niche: e.target.value }))}
            placeholder="Or type any custom niche, e.g. Wedding Photographers"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block">Region Focus</label>
          <select
            value={config.regionFocus}
            onChange={(e) => setConfig(c => ({ ...c, regionFocus: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
          >
            <option>Southern California</option>
            <option>Northern California</option>
            <option>Florida</option>
            <option>Texas</option>
            <option>Arizona</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block">
            Outreach Response Window (hours)
          </label>
          <input
            type="number"
            value={config.outreachResponseWindowHours}
            onChange={(e) => setConfig(c => ({ ...c, outreachResponseWindowHours: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
          />
        </div>
        <Button className="w-full bg-teal-600 hover:bg-teal-500" onClick={handleSave}>
          Save Configuration
        </Button>
      </div>
    </div>
  )
}

export default App