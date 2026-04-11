import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AlertTriangle, ShieldAlert, ArrowUpRight, Scale, CheckCircle, Clock, Filter } from 'lucide-react';

const risks = [
  { 
    id: 1, 
    type: 'High', 
    title: 'Uncapped Liability Exposure — §4.1 Removed', 
    document: 'Vendor Agreement — Q3 Cohort', 
    matterNo: 'MTR-2024-1046',
    category: 'Liability',
    description: 'The standard limitation of liability clause (§4.1) has been entirely removed in this version drafted by opposing counsel. This exposes the firm to uncapped damages in a breach scenario.',
    article: 'Article IV — Limitation of Liability',
    counsel: 'A. Smith, Esq.',
    date: 'Today, 09:30 AM',
  },
  { 
    id: 2, 
    type: 'High', 
    title: 'Missing GDPR Data Processing Addendum', 
    document: 'Data Processing Agreement — EU Operations', 
    matterNo: 'MTR-2024-1048',
    category: 'Compliance',
    description: 'The contract references cross-border EU personal data transfers but does not include a signed Data Processing Addendum, in potential violation of GDPR Art. 28.',
    article: 'Article VI — Data Processing',
    counsel: 'J. Doe, Esq.',
    date: 'Today, 08:15 AM',
  },
  { 
    id: 3, 
    type: 'Medium', 
    title: 'Non-Standard Payment Terms — §2.1 Extended', 
    document: 'MSA — TechCorp Inc.', 
    matterNo: 'MTR-2024-1042',
    category: 'Financial',
    description: 'Payment terms in this agreement have been extended to 60 days, exceeding the firm\'s standard maximum policy of 30 days. Client has been notified but formal approval is pending.',
    article: 'Article II — Compensation',
    counsel: 'J. Wilson',
    date: 'Yesterday',
  },
  { 
    id: 4, 
    type: 'Low', 
    title: 'Non-Solicitation Period Shorter than Standard', 
    document: 'Employment Agreement — Dev Team', 
    matterNo: 'MTR-2024-1044',
    category: 'Employment',
    description: 'The non-solicitation clause covers only 6 months post-termination, below the firm\'s standard 12-month provision. Review and alignment with employment counsel recommended.',
    article: 'Article VIII — Restrictive Covenants',
    counsel: 'J. Doe, Esq.',
    date: 'Mar 12, 2026',
  },
];

export default function RiskAlerts() {
  const criticalCount = risks.filter(r => r.type === 'High').length;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="relative bg-white border border-legal-border rounded-xl px-8 py-6 shadow-legal overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] leading-none text-red-400 opacity-[0.06] pointer-events-none select-none">⚠</div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="statute-label mb-2 text-red-500">Critical Review Required · Risk Intelligence</p>
            <h1 className="text-3xl font-bold text-legal-navy">Risk Alerts</h1>
            <div className="h-0.5 w-12 bg-red-400 rounded-full my-3" />
            <p className="text-sm text-legal-textLight">AI-flagged contract anomalies and potential liability exposures requiring counsel attention.</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-right">
              <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Critical Risks</p>
              <p className="text-3xl font-black text-red-700">{criticalCount}</p>
              <p className="text-[10px] text-red-500 mt-0.5">Immediate action required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'High Risk', count: risks.filter(r => r.type === 'High').length, color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: ShieldAlert },
          { label: 'Medium Risk', count: risks.filter(r => r.type === 'Medium').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: AlertTriangle },
          { label: 'Low Risk / Advisory', count: risks.filter(r => r.type === 'Low').length, color: 'text-legal-emerald', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${s.bg} shadow-sm`}>
            <s.icon className={`${s.color} shrink-0`} size={20} />
            <div>
              <p className="text-2xl font-black text-legal-navy">{s.count}</p>
              <p className="text-[11px] text-legal-textLight uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-legal-textLight" />
        <span className="text-xs text-legal-textLight font-semibold uppercase tracking-wider mr-2">Filter:</span>
        {['All', 'High', 'Medium', 'Low'].map((f) => (
          <button key={f} className={`px-3 py-1 rounded-full text-[11px] font-bold border tracking-wide transition-all ${f === 'All' ? 'bg-legal-navy text-white border-legal-navy' : 'border-legal-border text-legal-textLight hover:border-legal-navy hover:text-legal-navy'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Risk Cards */}
      <div className="space-y-4">
        {risks.map((risk) => (
          <Card key={risk.id} className={`overflow-hidden hover:shadow-legal-hover transition-shadow ${risk.type === 'High' ? 'border-red-200' : risk.type === 'Medium' ? 'border-amber-200' : 'border-legal-border'}`}>
            {/* Color top bar */}
            <div className={`h-1 w-full ${risk.type === 'High' ? 'bg-red-500' : risk.type === 'Medium' ? 'bg-amber-400' : 'bg-legal-emerald'}`} />
            
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">

                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`mt-0.5 shrink-0 p-2 rounded-lg ${risk.type === 'High' ? 'bg-red-100 text-red-600' : risk.type === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-legal-navy text-base leading-snug">{risk.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-legal-textLight">
                        <span className="font-semibold text-legal-navy">{risk.document}</span>
                        <span className="font-mono bg-legal-gray px-1.5 py-0.5 rounded tracking-wider text-legal-navy">{risk.matterNo}</span>
                        <span className="italic">{risk.article}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-legal-text leading-relaxed font-legal-doc">
                    {risk.description}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-4 border-t border-legal-border text-xs text-legal-textLight">
                    <span className="flex items-center gap-1.5"><Scale size={11} /> <strong>Assigned:</strong> {risk.counsel}</span>
                    <span className="flex items-center gap-1.5"><Clock size={11} /> {risk.date}</span>
                    <span className="px-2 py-0.5 rounded bg-legal-gray font-semibold uppercase tracking-wider text-[10px] text-legal-navy">{risk.category}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <Badge variant={risk.type === 'High' ? 'danger' : risk.type === 'Medium' ? 'warning' : 'success'} className="text-xs px-3 py-1">
                    {risk.type} Risk
                  </Badge>
                  <button className="text-xs font-bold text-legal-navy hover:text-legal-gold transition-colors flex items-center gap-1 whitespace-nowrap">
                    Review Matter <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
