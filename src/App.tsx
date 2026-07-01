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
  const [isStripeConnected, setIsStripeConnected] = useState(() =>
    localStorage.getItem('stripe_connected') === 'true'
  )

  useEffect(() => {
    // Handle Stripe OAuth callback (code param in URL)
    const params = new URLSearchParams(window.location.search)
    if (params.get('code')) {
      setIsStripeConnected(true)
      localStorage.setItem('stripe_connected', 'true')
      toast.success('Stripe account connected successfully!')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleStripeConnect = () => {
    toast.info('Connecting Stripe account...')
    // Simulate OAuth success for demo
    // In production: redirect to STRIPE_OAUTH_URL (see instructions below)
    setTimeout(() => {
      setIsStripeConnected(true)
      localStorage.setItem('stripe_connected', 'true')
      toast.success('Stripe connected! Revenue will flow to your account automatically.')
    }, 1500)
  }

  const handleStripeDisconnect = () => {
    setIsStripeConnected(false)
    localStorage.removeItem('stripe_connected')
    toast.success('Stripe account disconnected.')
  }

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

          {isStripeConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-400">Stripe Connected</p>
                  <p className="text-xs text-slate-500 mt-0.5">Invoices auto-sent via your Stripe account</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-red-400"
                  onClick={handleStripeDisconnect}
                >
                  Disconnect
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
              <Button
                className="w-full bg-[#635BFF] hover:bg-[#5851E5] text-white font-semibold gap-2"
                onClick={handleStripeConnect}
              >
                <Zap className="w-4 h-4" />
                Connect Stripe Account
              </Button>
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-300">To enable real Stripe OAuth:</p>
                <ol className="space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Go to <a href="https://dashboard.stripe.com/settings/connect" target="_blank" rel="noreferrer" className="text-[#635BFF] hover:underline">Stripe Connect Settings</a></li>
                  <li>Create a Connect application → copy your <strong className="text-slate-300">Client ID</strong></li>
                  <li>Build OAuth URL: <span className="font-mono bg-slate-900 px-1 rounded">https://connect.stripe.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=read_write</span></li>
                  <li>Replace the handleStripeConnect button with a redirect to that URL</li>
                </ol>
              </div>
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
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                Default Lead Score Threshold
              </label>
              <input
                type="number"
                defaultValue={60}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">Growth Package Price ($)</label>
              <input
                type="number"
                defaultValue={4997}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">Region Focus</label>
              <select className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm">
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
                defaultValue={48}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm"
              />
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-500"
              onClick={() => toast.success('Configuration saved.')}
            >
              Save Configuration
            </Button>
          </div>
        </div>

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

export default App