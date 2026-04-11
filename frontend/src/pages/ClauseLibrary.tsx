import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, ChevronRight, Library } from 'lucide-react';

const categories = ['All', 'Indemnification', 'Termination', 'Confidentiality', 'IP & Licensing', 'Compliance', 'Employment', 'Real Estate'];

const clauses = [
  { id: 1, title: 'Standard Force Majeure', category: 'General', uses: 142, risk: 'Low', preview: 'Neither party shall be liable for any failure or delay in performance under this Agreement to the extent caused by circumstances beyond that party\'s reasonable control...' },
  { id: 2, title: 'Non-Solicitation of Employees (12 months)', category: 'Employment', uses: 89, risk: 'Low', preview: 'During the Term and for a period of twelve (12) months following termination, neither party shall solicit or hire the other party\'s employees...' },
  { id: 3, title: 'Mutual Non-Disclosure & Confidentiality', category: 'Confidentiality', uses: 310, risk: 'Low', preview: 'Each party agrees to keep confidential all Proprietary Information received from the other party and to use such information solely for the purpose of performing its obligations...' },
  { id: 4, title: 'Limitation of Liability (Fee-Capped)', category: 'Indemnification', uses: 67, risk: 'Medium', preview: 'In no event shall either party\'s liability for any claim arising out of this Agreement exceed the total fees paid in the twelve (12) months preceding the claim...' },
  { id: 5, title: 'GDPR Data Processing Addendum', category: 'Compliance', uses: 45, risk: 'High', preview: 'The parties agree to comply with the applicable requirements of the General Data Protection Regulation (EU) 2016/679 and any successor legislation thereto...' },
  { id: 6, title: 'Termination for Convenience (60-day Notice)', category: 'Termination', uses: 211, risk: 'Low', preview: 'Either party may terminate this Agreement for convenience by providing sixty (60) days\' prior written notice to the other party...' },
  { id: 7, title: 'IP Assignment & Work-for-Hire', category: 'IP & Licensing', uses: 98, risk: 'Medium', preview: 'All work product, inventions, and intellectual property created by Provider in the course of performing Services shall be deemed work made for hire...' },
  { id: 8, title: 'Governing Law — New York', category: 'General', uses: 430, risk: 'Low', preview: 'This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles...' },
];

export default function ClauseLibrary() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = clauses.filter(c =>
    (activeCategory === 'All' || c.category === activeCategory) &&
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="relative bg-white border border-legal-border rounded-xl px-8 py-6 shadow-legal overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] leading-none text-legal-navy opacity-[0.04] pointer-events-none select-none">§</div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="statute-label mb-2">Standard Boilerplate · Clause Repository</p>
            <h1 className="text-3xl font-bold text-legal-navy">Clause Library</h1>
            <div className="gold-divider" />
            <p className="text-sm text-legal-textLight">Firm-approved, pre-reviewed legal clauses ready for insertion into any matter.</p>
          </div>
          <Button className="gap-2 bg-legal-navy text-white hover:bg-legal-navy/90 shrink-0">
            <Plus size={14} />
            Add New Clause
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-textLight" />
          <input
            type="text"
            placeholder="Search clause library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-legal-border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-legal-navy/20 focus:border-legal-navy transition-all"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all uppercase tracking-wider ${
              activeCategory === cat
                ? 'bg-legal-navy text-white border-legal-navy shadow'
                : 'border-legal-border text-legal-textLight hover:border-legal-navy hover:text-legal-navy'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Clause Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((clause) => (
          <Card key={clause.id} className="flex flex-col hover:shadow-legal-hover transition-all group border-legal-border hover:border-legal-gold/30">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                  clause.risk === 'High' ? 'border-red-200 bg-red-50 text-red-600' :
                  clause.risk === 'Medium' ? 'border-amber-200 bg-amber-50 text-amber-600' :
                  'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>{clause.category}</span>
                <span className="text-[10px] text-legal-textLight shrink-0">Used {clause.uses}×</span>
              </div>
              <CardTitle className="text-[15px] mt-2 leading-snug group-hover:text-legal-gold transition-colors">{clause.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <p className="text-xs text-legal-textLight font-legal-doc leading-relaxed italic line-clamp-3">
                "{clause.preview}"
              </p>
            </CardContent>
            <div className="px-5 pb-4 pt-3 border-t border-legal-border flex justify-between items-center">
              <span className="text-[10px] text-legal-textLight">Firm-approved · v1.0</span>
              <div className="flex gap-2">
                <button className="text-xs font-semibold text-legal-navy hover:text-legal-gold transition-colors flex items-center gap-1">
                  Preview <ChevronRight size={12} />
                </button>
                <Button variant="default" size="sm" className="h-7 text-[11px] bg-legal-emerald hover:bg-legal-emerald/90">
                  Insert
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-legal-textLight border border-dashed border-legal-border rounded-xl">
          <Library size={36} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold">No clauses match your search criteria.</p>
        </div>
      )}
    </div>
  );
}
