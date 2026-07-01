import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Eye, Download, Copy, MoreHorizontal, DollarSign, Clock, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useLeads } from '@/store/pipeline-store';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  viewed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function ProposalsPage() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const proposalLeads = leads.filter(l => l.status === 'proposal' || l.status === 'qualified' || l.status === 'client');

  const handleSendProposal = (name: string) => {
    toast.success(`Proposal sent to ${name}!`);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header 
        title="Proposals" 
        subtitle="Create, send, and track client proposals"
      />

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Active Proposals</h2>
            <p className="text-sm text-slate-400">Proposals for qualified leads and new clients</p>
          </div>
          <Button className="gap-2 bg-teal-600 hover:bg-teal-500">
            <PlusIcon className="w-4 h-4" />
            Create Proposal
          </Button>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Business</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Value</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Last Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">Loading qualified leads...</td></tr>
                ) : proposalLeads.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">No proposals yet. Qualify a lead to get started.</td></tr>
                ) : proposalLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{lead.companyName}</p>
                          <p className="text-xs text-slate-500">{lead.contactName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={lead.status === 'client' ? statusColors.accepted : statusColors.sent}>
                        {lead.status === 'client' ? 'Accepted' : 'Viewed'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-white">$1,997/mo</div>
                      <div className="text-[10px] text-slate-500">Growth Tier</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">2 hours ago</div>
                      <div className="text-[10px] text-slate-500">Opened via Email</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleSendProposal(lead.companyName)}>
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
