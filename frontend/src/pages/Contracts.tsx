import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, Upload, Filter, MoreVertical, FileText, Scale, Shield } from 'lucide-react';

const contractsData = [
  { id: 'MTR-2024-1042', name: 'Master Services Agreement — TechCorp Inc.', type: 'MSA', modified: '2026-03-15', risk: 'Low', versions: 2, status: 'Executed', counsel: 'J. Wilson' },
  { id: 'MTR-2024-1043', name: 'Non-Disclosure Agreement — Q3 Vendor Cohort', type: 'NDA', modified: '2026-03-14', risk: 'High', versions: 5, status: 'Under Review', counsel: 'A. Smith' },
  { id: 'MTR-2024-1044', name: 'Employment Agreement — Senior Developer', type: 'Employment', modified: '2026-03-14', risk: 'Medium', versions: 3, status: 'Draft', counsel: 'J. Doe' },
  { id: 'MTR-2024-1045', name: 'Software License Agreement v2.1', type: 'License', modified: '2026-03-12', risk: 'Low', versions: 1, status: 'Executed', counsel: 'J. Wilson' },
  { id: 'MTR-2024-1046', name: 'Vendor Integration Agreement — Global Solutions', type: 'Vendor', modified: '2026-03-10', risk: 'High', versions: 8, status: 'Under Review', counsel: 'A. Smith' },
  { id: 'MTR-2024-1047', name: 'Commercial Lease Agreement — NY Branch', type: 'Real Estate', modified: '2026-03-08', risk: 'Low', versions: 2, status: 'Archived', counsel: 'S. Jenkins' },
  { id: 'MTR-2024-1048', name: 'Data Processing Addendum (GDPR Compliant)', type: 'Compliance', modified: '2026-03-05', risk: 'Medium', versions: 4, status: 'Draft', counsel: 'J. Doe' },
];

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = contractsData.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="relative bg-white border border-legal-border rounded-xl px-8 py-6 shadow-legal overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] leading-none text-legal-navy opacity-[0.04] pointer-events-none select-none">⚖</div>
        <div className="relative z-10">
          <p className="statute-label mb-2">Active Docket · Contract Repository</p>
          <h1 className="text-3xl font-bold text-legal-navy">Contracts &amp; Matters</h1>
          <div className="gold-divider" />
          <p className="text-sm text-legal-textLight">All active, draft, and archived legal agreements managed by your firm.</p>
        </div>
      </div>

      {/* Summary stats in a mini-bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Matters', value: contractsData.filter(c => c.status === 'Executed').length, icon: Scale, color: 'text-legal-emerald', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Under Counsel Review', value: contractsData.filter(c => c.status === 'Under Review').length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'High-Risk Matters', value: contractsData.filter(c => c.risk === 'High').length, icon: FileText, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${s.bg} shadow-sm`}>
            <s.icon className={`${s.color} shrink-0`} size={20} strokeWidth={1.8} />
            <div>
              <p className="text-2xl font-black text-legal-navy">{s.value}</p>
              <p className="text-[11px] text-legal-textLight uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-legal-border pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} className="text-legal-gold" />
              Contract Register
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-textLight" />
                <input
                  type="text"
                  placeholder="Search by matter, type, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-legal-border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-navy/30 focus:border-legal-navy transition-all"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter size={15} className="text-legal-textLight" />
              </Button>
              <Button className="gap-2 bg-legal-navy text-white hover:bg-legal-navy/90 shrink-0">
                <Upload size={14} />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-legal-ivory/60">
                <TableHead className="pl-6">Contract / Matter</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Counsel</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contract) => (
                <TableRow key={contract.id} className="group cursor-pointer">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-legal-gray rounded-lg text-legal-navy group-hover:bg-legal-gold/15 group-hover:text-legal-gold transition-colors">
                        <FileText size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-legal-navy group-hover:text-legal-gold transition-colors leading-tight">{contract.name}</div>
                        <div className="text-[10px] font-mono text-legal-textLight mt-0.5 tracking-wider">{contract.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-legal-navy/8 text-legal-navy font-semibold tracking-wide">{contract.type}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.risk === 'High' ? 'danger' : contract.risk === 'Medium' ? 'warning' : 'success'}>
                      {contract.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                      contract.status === 'Executed' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' :
                      contract.status === 'Under Review' ? 'border-amber-300 text-amber-700 bg-amber-50' :
                      contract.status === 'Draft' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                      'border-gray-300 text-gray-500 bg-gray-50'
                    }`}>
                      {contract.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-legal-textLight">{contract.counsel}</TableCell>
                  <TableCell className="text-sm text-legal-textLight font-mono">v{contract.versions}.0</TableCell>
                  <TableCell className="text-sm text-legal-textLight">{new Date(contract.modified).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                      <MoreVertical size={14} className="text-legal-textLight" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-legal-textLight">
              <Scale size={40} className="mx-auto mb-4 opacity-15" />
              <p className="font-semibold">No matters found matching your search criteria.</p>
            </div>
          )}
          <div className="px-6 py-3 border-t border-legal-border bg-legal-ivory/30 flex justify-between items-center text-xs text-legal-textLight">
            <span>Showing {filtered.length} of {contractsData.length} registered matters</span>
            <span className="italic">All records are attorney-client privileged</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
