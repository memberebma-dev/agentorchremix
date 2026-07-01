/**
 * LeadList - Displays and manages discovered leads
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, RefreshCw, MapPin, Globe, Building2, Star, MoreHorizontal, Plus, ChevronRight } from 'lucide-react';

const mockLeads = [
  { id: '1', business: 'Pacific Bridge Capital', owner: 'Michael Chen', email: 'michael@pacificbridge.com', phone: '(310) 555-0142', website: 'pacificbridge.com', address: '123 Wilshire Blvd, Los Angeles, CA', city: 'Los Angeles', score: 92, status: 'qualified', niche: 'Commercial Bridge', source: 'Maps', added: '2h ago' },
  { id: '2', business: 'Coastal Lending Group', owner: 'Sarah Williams', email: 'sarah@coastallending.com', phone: '(213) 555-0198', website: 'coastallending.com', address: '456 Ocean Ave, Santa Monica, CA', city: 'Santa Monica', score: 87, status: 'proposal', niche: 'Hard Money', source: 'Directory', added: '5h ago' },
  { id: '3', business: 'Sunset Financial Services', owner: 'David Park', email: 'david@sunsetfinancial.com', phone: '(818) 555-0167', website: 'sunsetfinancial.com', address: '789 Ventura Blvd, Sherman Oaks, CA', city: 'Sherman Oaks', score: 78, status: 'contacted', niche: 'Private Money', source: 'CSV Import', added: '1d ago' },
  { id: '4', business: 'Apex Commercial Capital', owner: 'Jennifer Martinez', email: 'jennifer@apexcommercial.com', phone: '(562) 555-0134', website: 'apexcommercial.com', address: '321 Long Beach Blvd, Long Beach, CA', city: 'Long Beach', score: 71, status: 'new', niche: 'Commercial Bridge', source: 'Maps', added: '1d ago' },
  { id: '5', business: 'Harbor View Funding', owner: 'Robert Kim', email: 'robert@harborviewfunding.com', phone: '(949) 555-0156', website: 'harborviewfunding.com', address: '555 Irvine Blvd, Irvine, CA', city: 'Irvine', score: 65, status: 'new', niche: 'Fix & Flip', source: 'Directory', added: '2d ago' },
  { id: '6', business: 'Metro Asset Lending', owner: 'Amanda Torres', email: 'amanda@metroasset.com', phone: '(323) 555-0189', website: 'metroasset.com', address: '878 Hollywood Blvd, Hollywood, CA', city: 'Hollywood', score: 58, status: 'new', niche: 'Asset-Based', source: 'API', added: '2d ago' },
];

const statusColors: Record<string, string> = {
  new: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  qualified: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  proposal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function LeadList() {
  const [leads] = useState(mockLeads);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = lead.business.toLowerCase().includes(search.toLowerCase()) || 
                         lead.city.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Lead List</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
              <RefreshCw className="w-3 h-3" />
              Sync
            </Button>
            <Button variant="outline" size="sm" className="gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="w-3 h-3" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search leads..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-slate-800 pb-2">
          {['all', 'new', 'contacted', 'qualified', 'proposal', 'won'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === status
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 opacity-70">
                {status === 'all' ? leads.length : leads.filter(l => l.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-3 text-xs font-medium text-slate-400">Business</th>
                <th className="text-left p-3 text-xs font-medium text-slate-400">Location</th>
                <th className="text-left p-3 text-xs font-medium text-slate-400">Score</th>
                <th className="text-left p-3 text-xs font-medium text-slate-400">Status</th>
                <th className="text-left p-3 text-xs font-medium text-slate-400">Source</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-white text-sm">{lead.business}</p>
                      <p className="text-xs text-slate-500">{lead.owner}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-slate-300">{lead.city}</p>
                    <p className="text-xs text-slate-500">{lead.niche}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            lead.score >= 80 ? 'bg-emerald-500' :
                            lead.score >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white">{lead.score}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={statusColors[lead.status]}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-slate-400">{lead.source}</span>
                  </td>
                  <td className="p-3">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Showing {filteredLeads.length} of {leads.length} leads</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs border-slate-700 text-slate-300">Previous</Button>
            <Button variant="outline" size="sm" className="text-xs border-slate-700 text-slate-300">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
