import { useState } from 'react'
import { useLeads, useUpdateLeadStatus, useAgentRuns, useStartAgent } from '@/store/pipeline-store'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Receipt,
  Send,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { LeadStatus } from '@/types/pipeline'
import { blink } from '@/lib/blink'
import { useQueryClient } from '@tanstack/react-query'

export function LeadsPage() {
  const { data: leads, isLoading } = useLeads()
  const updateStatus = useUpdateLeadStatus()
  const { data: agentRuns } = useAgentRuns()
  const startAgent = useStartAgent()
  const [searchTerm, setSearchFiltered] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const queryClient = useQueryClient()

  // Form state
  const [newLead, setNewLead] = useState({
    companyName: '',
    website: '',
    contactEmail: '',
    contactName: '',
    phone: '',
    consent: false
  })

  const handleAddLead = async () => {
    if (!newLead.consent) {
      toast.error('Legal consent is mandatory to add leads')
      return
    }
    
    try {
      await blink.db.leads.create({
        id: crypto.randomUUID(),
        companyName: newLead.companyName,
        website: newLead.website,
        contactEmail: newLead.contactEmail,
        contactName: newLead.contactName,
        phone: newLead.phone,
        consentObtained: 1,
        status: 'new'
      })
      toast.success('Lead added to acquisition pipeline')
      setIsAddDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setNewLead({ companyName: '', website: '', contactEmail: '', contactName: '', phone: '', consent: false })
    } catch (error) {
      toast.error('Failed to add lead')
    }
  }

  const handleEditLead = async () => {
    if (!selectedLead) return
    try {
      await blink.db.leads.update(selectedLead.id, {
        companyName: selectedLead.companyName,
        website: selectedLead.website,
        contactEmail: selectedLead.contactEmail,
        contactName: selectedLead.contactName,
        phone: selectedLead.phone,
        updatedAt: new Date().toISOString()
      })
      toast.success('Lead updated')
      setIsEditDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    } catch (error) {
      toast.error('Failed to update lead')
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lead?')) return
    try {
      await blink.db.leads.delete(id)
      toast.success('Lead removed')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    } catch (error) {
      toast.error('Failed to delete lead')
    }
  }

  const filteredLeads = leads?.filter(lead => 
    lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportCSV = () => {
    if (!leads) return
    const headers = ['Company', 'Contact', 'Email', 'Website', 'Status', 'Consent']
    const rows = leads.map(l => [
      l.companyName, 
      l.contactName, 
      l.contactEmail, 
      l.website, 
      l.status, 
      l.consentObtained ? 'Yes' : 'No'
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "agentorch_leads.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Leads exported to CSV')
  }

  const handleRunAgent = async (agentName: string, leadId: string) => {
    try {
      await startAgent.mutateAsync({ agentName, leadId })
      toast.success(`${agentName} agent started for lead`)
    } catch (error) {
      toast.error(`Failed to start ${agentName} agent`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and edit discovered prospects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-800 text-slate-300" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  Add New Prospect
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input 
                    id="company" 
                    placeholder="e.g. Luxe Marketing" 
                    className="bg-slate-950 border-slate-800"
                    value={newLead.companyName}
                    onChange={(e) => setNewLead({...newLead, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input 
                    id="website" 
                    placeholder="https://..." 
                    className="bg-slate-950 border-slate-800"
                    value={newLead.website}
                    onChange={(e) => setNewLead({...newLead, website: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Full Name" 
                      className="bg-slate-950 border-slate-800"
                      value={newLead.contactName}
                      onChange={(e) => setNewLead({...newLead, contactName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="+1 (555) 000-0000" 
                      className="bg-slate-950 border-slate-800"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    placeholder="email@company.com" 
                    className="bg-slate-950 border-slate-800"
                    value={newLead.contactEmail}
                    onChange={(e) => setNewLead({...newLead, contactEmail: e.target.value})}
                  />
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 mt-4">
                  <Checkbox 
                    id="consent" 
                    className="mt-1 border-teal-500 data-[state=checked]:bg-teal-500"
                    checked={newLead.consent}
                    onCheckedChange={(checked) => setNewLead({...newLead, consent: !!checked})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="consent"
                      className="text-xs font-medium text-slate-300 leading-normal"
                    >
                      I confirm this lead has provided consent or there is a legitimate business interest for outreach.
                    </label>
                    <p className="text-[10px] text-slate-500 italic">
                      Mandatory for GDPR/CCPA compliance in autonomous cycles.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-slate-800" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button className="bg-teal-600 hover:bg-teal-500" onClick={handleAddLead}>Add to Engine</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
        <Search className="w-4 h-4 text-slate-500" />
        <Input 
          placeholder="Search leads by company, name or email..." 
          className="bg-transparent border-none focus-visible:ring-0 text-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchFiltered(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Company</TableHead>
              <TableHead className="text-slate-400">Contact</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Consent</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Loading leads...</TableCell>
              </TableRow>
            ) : filteredLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">No leads found.</TableCell>
              </TableRow>
            ) : (
              filteredLeads?.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="border-slate-800 hover:bg-slate-800/30 cursor-pointer group"
                  onClick={() => {
                    setSelectedLead(lead)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">{lead.companyName}</p>
                      <a 
                        href={lead.website} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-teal-500 hover:underline flex items-center gap-1 mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.website} <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-slate-300">{lead.contactName}</p>
                      <p className="text-xs text-slate-500">{lead.contactEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <select 
                      className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={lead.status}
                      onChange={(e) => updateStatus.mutate({ leadId: lead.id, status: e.target.value as LeadStatus })}
                    >
                      <option value="new">New</option>
                      <option value="scored">Scored</option>
                      <option value="audited">Audited</option>
                      <option value="outreach_sent">Outreach</option>
                      <option value="responded">Responded</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="client">Client</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    {lead.consentObtained ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Obtained
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 gap-1">
                        <XCircle className="w-3 h-3" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-teal-500 hover:text-teal-400"
                        onClick={() => {
                          setSelectedLead(lead)
                          setIsDetailOpen(true)
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => {
                          setSelectedLead(lead)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Prospect</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company Name</Label>
                <Input 
                  id="edit-company" 
                  className="bg-slate-950 border-slate-800"
                  value={selectedLead.companyName}
                  onChange={(e) => setSelectedLead({...selectedLead, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website URL</Label>
                <Input 
                  id="edit-website" 
                  className="bg-slate-950 border-slate-800"
                  value={selectedLead.website}
                  onChange={(e) => setSelectedLead({...selectedLead, website: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Contact Name</Label>
                  <Input 
                    id="edit-name" 
                    className="bg-slate-950 border-slate-800"
                    value={selectedLead.contactName}
                    onChange={(e) => setSelectedLead({...selectedLead, contactName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input 
                    id="edit-phone" 
                    className="bg-slate-950 border-slate-800"
                    value={selectedLead.phone || ''}
                    onChange={(e) => setSelectedLead({...selectedLead, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  className="bg-slate-950 border-slate-800"
                  value={selectedLead.contactEmail}
                  onChange={(e) => setSelectedLead({...selectedLead, contactEmail: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-slate-800" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-500" onClick={handleEditLead}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Sheet / Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <Target className="w-5 h-5 text-teal-400" />
              Lead Intelligence: {selectedLead?.companyName}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lead Status</p>
                  <Badge variant="outline" className="capitalize text-teal-400 border-teal-500/30 bg-teal-500/5">
                    {selectedLead.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Targeting Metadata</p>
                  <p className="text-xs text-slate-300">Niche: <span className="text-slate-100 font-medium">{selectedLead.niche || 'Digital Agency'}</span></p>
                  <p className="text-xs text-slate-300 mt-1">Location: <span className="text-slate-100 font-medium">{selectedLead.location || 'Southern California'}</span></p>
                  <p className="text-xs text-slate-300 mt-1">Source: <span className="text-slate-100 font-medium">{selectedLead.source || 'Direct'}</span></p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Info</p>
                  <p className="text-sm font-medium text-slate-200">{selectedLead.contactName}</p>
                  <p className="text-xs text-slate-400 mt-1">{selectedLead.contactEmail}</p>
                  <p className="text-xs text-slate-400 mt-1">{selectedLead.phone || 'No phone'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white italic">Autonomous Actions</p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => handleRunAgent('Scoring', selectedLead.id)}
                >
                  <Target className="w-4 h-4 text-amber-400" /> Run Score Analysis
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => handleRunAgent('Asset Generation', selectedLead.id)}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Generate Assets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => handleRunAgent('Outreach', selectedLead.id)}
                >
                  <Send className="w-4 h-4 text-blue-400" /> Launch Outreach
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => handleRunAgent('Invoicing', selectedLead.id)}
                >
                  <Receipt className="w-4 h-4 text-purple-400" /> Send Growth Invoice
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
