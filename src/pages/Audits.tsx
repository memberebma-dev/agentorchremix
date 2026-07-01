import { AuditRunner } from '@/components/audits/AuditRunner'
import { BulkAuditManager } from '@/components/audits/BulkAuditManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AuditsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight italic">SEO Audit Engine</h1>
        <p className="text-sm text-slate-400 mt-1">Run comprehensive SEO, GMB, and competitive audits for bridge lender prospects</p>
      </div>

      <Tabs defaultValue="runner" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="runner" className="data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-400">
            Audit Runner
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-400">
            Bulk Manager
          </TabsTrigger>
        </TabsList>
        <TabsContent value="runner" className="mt-6">
          <AuditRunner />
        </TabsContent>
        <TabsContent value="bulk" className="mt-6">
          <BulkAuditManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
