import { Shield, Lock, Scale } from 'lucide-react'

export function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 bg-slate-950 text-slate-300">
      <div className="flex items-center gap-3 mb-8 text-teal-400">
        <Shield className="w-8 h-8" />
        <h1 className="text-3xl font-bold text-white italic">Privacy Policy</h1>
      </div>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Data Collection</h2>
          <p>AgentOrch collects business information including company name, website, and contact details for the purpose of autonomous acquisition orchestration. We prioritize data minimization and only collect what is necessary for agency growth automation.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Autonomous Outreach</h2>
          <p>Our system performs multi-channel outreach. We ensure all communications include clear opt-out mechanisms. By using this platform, you agree to adhere to CAN-SPAM, GDPR, and CCPA regulations regarding business-to-business engagement.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Consent Obtained</h2>
          <p>AgentOrch only processes leads where consent has been obtained or where there is a legitimate interest for business engagement. Users must verify consent status before initiating autonomous cycles.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Your Rights</h2>
          <p>You have the right to access, correct, or delete your data at any time. Contact our support for data removal requests.</p>
        </section>
      </div>
    </div>
  )
}

export function TermsConditions() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 bg-slate-950 text-slate-300">
      <div className="flex items-center gap-3 mb-8 text-teal-400">
        <Scale className="w-8 h-8" />
        <h1 className="text-3xl font-bold text-white italic">Terms & Conditions</h1>
      </div>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Service Usage</h2>
          <p>AgentOrch provides an autonomous acquisition and passive revenue engine. You are responsible for the legality of the niche and leads you target using our automation tools.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Passive Revenue</h2>
          <p>Passive revenue metrics displayed are estimates based on Stripe invoice statuses. Final revenue realization depends on successful payment collection through your connected Stripe account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Compliance</h2>
          <p>Users must comply with all local and international laws regarding automated outreach and digital marketing. AgentOrch is not liable for misuse of automated sequences.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Asset Ownership</h2>
          <p>Assets generated (audits, websites) remain under your management within the platform. Upon lead "dead" status, the system may repurpose these assets for other prospects.</p>
        </section>
      </div>
    </div>
  )
}
