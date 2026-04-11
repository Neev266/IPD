import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CheckCircle, Edit3, FilePlus, Clock, User, Scale, Download } from 'lucide-react';

const timeline = [
  { 
    id: 1, 
    action: 'Version 2.1 Approved for Execution', 
    time: 'Today at 10:45 AM', 
    user: 'Amanda Smith, Esq.', 
    role: 'General Counsel · Partner', 
    type: 'approval', 
    matterNo: 'MTR-2024-1042',
    comment: 'All flagged risk provisions addressed. Indemnification clause strengthened per §3.1 redline. Approved for final execution and counter-signature.'
  },
  { 
    id: 2, 
    action: 'Clause Amended: §3.1 Indemnification', 
    time: 'Today at 09:15 AM', 
    user: 'Jane Doe, Esq.', 
    role: 'Senior Counsel', 
    type: 'edit', 
    matterNo: 'MTR-2024-1042',
    comment: 'Updated indemnification to include explicit carve-outs for gross negligence and confidentiality breach, as recommended by AI analysis.'
  },
  { 
    id: 3, 
    action: 'Contract Version 2.0 Submitted for Review', 
    time: 'Yesterday at 4:30 PM', 
    user: 'James Wilson', 
    role: 'Paralegal', 
    type: 'upload', 
    matterNo: 'MTR-2024-1042',
    comment: 'Initial draft received from opposing counsel\'s firm. Uploaded for senior counsel review.',
  },
  { 
    id: 4, 
    action: 'AI Risk Flag Acknowledged', 
    time: 'Mar 12, 2026 · 2:10 PM', 
    user: 'Amanda Smith, Esq.', 
    role: 'General Counsel', 
    type: 'system', 
    matterNo: 'MTR-2024-1042',
    comment: 'Payment terms risk (§2.1, 45-day terms) acknowledged and accepted by client on commercial grounds.',
  },
  { 
    id: 5, 
    action: 'Contract Draft Initiated from Template', 
    time: 'Mar 10, 2026 · 11:00 AM', 
    user: 'LexIntel System', 
    role: 'AI Platform', 
    type: 'creation', 
    matterNo: 'MTR-2024-1042',
    comment: 'Document generated from Firm Standard MSA Template v4.2. Initial risk scan completed.',
  },
];

const typeConfig: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  approval: { icon: CheckCircle, bg: 'bg-legal-emerald', color: 'text-white' },
  edit: { icon: Edit3, bg: 'bg-amber-500', color: 'text-white' },
  upload: { icon: FilePlus, bg: 'bg-blue-500', color: 'text-white' },
  system: { icon: Clock, bg: 'bg-legal-textLight', color: 'text-white' },
  creation: { icon: Scale, bg: 'bg-legal-navy', color: 'text-legal-gold' },
};

export default function AuditHistory() {
  return (
    <div className="space-y-6 max-w-4xl">

      {/* Page Header */}
      <div className="relative bg-white border border-legal-border rounded-xl px-8 py-6 shadow-legal overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] leading-none text-legal-navy opacity-[0.04] pointer-events-none select-none">§</div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="statute-label mb-2">Review Trail · Chain of Custody</p>
            <h1 className="text-3xl font-bold text-legal-navy">Audit History</h1>
            <div className="gold-divider" />
            <p className="text-sm text-legal-textLight">Immutable, chronological record of all actions taken on this matter.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-legal-border rounded-lg text-sm font-semibold text-legal-navy hover:bg-legal-gray/50 transition-colors shrink-0">
            <Download size={14} />
            Export Audit Log
          </button>
        </div>
      </div>

      {/* Matter Reference */}
      <div className="flex items-center gap-4 px-5 py-3.5 bg-white border border-legal-border rounded-lg shadow-sm">
        <Scale size={16} className="text-legal-gold shrink-0" />
        <div>
          <p className="text-xs text-legal-textLight uppercase tracking-wider">Matter Reference</p>
          <p className="text-sm font-bold text-legal-navy">Master Services Agreement — TechCorp Inc. <span className="font-mono text-legal-textLight ml-2">MTR-2024-1042</span></p>
        </div>
        <span className="ml-auto text-[10px] font-semibold px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded uppercase tracking-wider">Executed</span>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="border-b border-legal-border pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock size={16} className="text-legal-gold" />
            Chronological Activity Record
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="relative border-l-2 border-legal-gray/60 ml-5 space-y-10">
            {timeline.map((event) => {
              const cfg = typeConfig[event.type];
              const Icon = cfg.icon;
              return (
                <div key={event.id} className="relative pl-9">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[13px] top-1 h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow ${cfg.bg}`}>
                    <Icon size={12} className={cfg.color} />
                  </div>

                  <div className="bg-white border border-legal-border rounded-xl p-5 shadow-sm hover:shadow-legal transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <h3 className="text-sm font-bold text-legal-navy leading-snug">{event.action}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-legal-textLight shrink-0">
                        <Clock size={11} />
                        <span>{event.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-legal-gray flex items-center justify-center text-legal-navy shrink-0">
                        <User size={13} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-legal-navy">{event.user}</span>
                        <span className="text-xs text-legal-textLight ml-2">{event.role}</span>
                      </div>
                      <span className="ml-auto font-mono text-[10px] bg-legal-gray px-2 py-0.5 rounded text-legal-navy tracking-wider">{event.matterNo}</span>
                    </div>

                    <blockquote className="text-sm text-legal-textLight bg-legal-ivory border-l-2 border-legal-gold/40 pl-4 py-2.5 pr-4 rounded-r-lg font-legal-doc italic leading-relaxed">
                      "{event.comment}"
                    </blockquote>

                    {event.type === 'edit' && (
                      <div className="mt-3 pt-3 border-t border-legal-border">
                        <button className="text-xs font-bold text-legal-navy hover:text-legal-gold transition-colors inline-flex items-center gap-1.5">
                          <Edit3 size={11} />
                          View Redline for this Revision
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
