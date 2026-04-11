import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { History, Scale } from 'lucide-react';

const prevText = [
  {
    article: 'ARTICLE III — INDEMNIFICATION',
    section: '3.1 Mutual Indemnification.',
    body: 'Provider shall indemnify and hold harmless Client from and against any claims arising out of Provider\'s negligence in the performance of the Services.',
    change: 'removed',
  },
  {
    article: 'ARTICLE IV — LIMITATION OF LIABILITY',
    section: '4.1 Exclusion of Consequential Damages.',
    body: 'IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT DAMAGES, INCLUDING LOSS OF PROFITS OR REVENUE.',
    change: 'unchanged',
  },
  {
    article: 'ARTICLE V — TERM AND TERMINATION',
    section: '5.1 Term.',
    body: 'This Agreement shall commence on the Effective Date and remain in effect for one (1) year unless earlier terminated in accordance with its terms.',
    change: 'modified',
  },
];

const newText = [
  {
    article: 'ARTICLE III — INDEMNIFICATION',
    section: '3.1 Mutual Indemnification.',
    body: 'Provider shall indemnify, defend, and hold harmless Client from and against any and all claims, damages, liabilities, and expenses arising out of or related to Provider\'s gross negligence or willful misconduct in the performance of the Services, or any material breach of the confidentiality obligations set forth herein.',
    change: 'added',
  },
  {
    article: 'ARTICLE IV — LIMITATION OF LIABILITY',
    section: '4.1 Exclusion of Consequential Damages.',
    body: 'IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT DAMAGES, INCLUDING LOSS OF PROFITS OR REVENUE.',
    change: 'unchanged',
  },
  {
    article: 'ARTICLE V — TERM AND TERMINATION',
    section: '5.1 Term.',
    body: 'This Agreement shall commence on the Effective Date and remain in effect until terminated. Either party may terminate this Agreement for convenience upon sixty (60) days\' prior written notice to the other party.',
    change: 'modified',
  },
];

function DiffBlock({ item }: { item: typeof prevText[number] }) {
  const borderMap: Record<string, string> = {
    removed: 'border-l-4 border-red-500 bg-red-50/60',
    added: 'border-l-4 border-emerald-500 bg-emerald-50/60',
    modified: 'border-l-4 border-amber-400 bg-amber-50/50',
    unchanged: 'border-l-4 border-legal-border bg-white',
  };
  const labelMap: Record<string, { label: string; color: string }> = {
    removed: { label: 'Removed', color: 'text-red-600 bg-red-100' },
    added: { label: 'Added', color: 'text-emerald-700 bg-emerald-100' },
    modified: { label: 'Modified', color: 'text-amber-700 bg-amber-100' },
    unchanged: { label: 'Unchanged', color: 'text-gray-500 bg-gray-100' },
  };
  return (
    <div className={`${borderMap[item.change]} rounded-r-lg p-4 mb-4`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-[10px] font-black text-legal-navy/50 uppercase tracking-widest">{item.article}</p>
          <p className="text-sm font-bold text-legal-navy mt-0.5">{item.section}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${labelMap[item.change].color}`}>
          {labelMap[item.change].label}
        </span>
      </div>
      <p className={`text-sm leading-relaxed font-legal-doc font-light ${item.change === 'removed' ? 'line-through text-red-700 opacity-70' : 'text-legal-text'}`}>
        {item.body}
      </p>
    </div>
  );
}

export default function VersionCompare() {
  return (
    <div className="space-y-5 flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>

      {/* Header */}
      <div className="relative bg-white border border-legal-border rounded-xl px-8 py-5 shadow-legal overflow-hidden shrink-0">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[90px] leading-none text-legal-navy opacity-[0.04] pointer-events-none select-none">⚖</div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="statute-label mb-2">Redline Comparison · MTR-2024-1042</p>
            <h1 className="text-2xl font-bold text-legal-navy">Master Services Agreement — TechCorp Inc.</h1>
            <div className="gold-divider" />
            <p className="text-sm text-legal-textLight">Comparing Version 2.0 (Baseline) against Version 2.1 (Current Draft)</p>
          </div>
          <div className="flex gap-3 shrink-0">
            {[
              { label: 'Added', color: 'bg-emerald-100 border-emerald-200 text-emerald-700' },
              { label: 'Removed', color: 'bg-red-100 border-red-200 text-red-700' },
              { label: 'Modified', color: 'bg-amber-100 border-amber-200 text-amber-700' },
              { label: 'Unchanged', color: 'bg-gray-100 border-gray-200 text-gray-600' },
            ].map((l) => (
              <span key={l.label} className={`text-[10px] font-bold px-2 py-1 rounded border ${l.color} uppercase tracking-wider`}>{l.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex-1 grid grid-cols-2 gap-5 overflow-hidden">
        {/* Previous Version */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b border-legal-border bg-red-50/30 py-4 shrink-0">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <History size={15} className="text-red-500" />
                <span>Version 2.0 — Baseline</span>
              </div>
              <span className="text-xs font-normal text-legal-textLight">Executed: Mar 12, 2026 · 10:45 AM</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            {prevText.map((item, i) => <DiffBlock key={i} item={item} />)}
          </CardContent>
        </Card>

        {/* New Version */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b border-legal-border bg-emerald-50/30 py-4 shrink-0">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <History size={15} className="text-legal-emerald" />
                <span className="text-legal-emerald">Version 2.1 — Current Draft</span>
              </div>
              <Badge variant="warning" className="text-[10px]">Pending Review</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            {newText.map((item, i) => <DiffBlock key={i} item={item} />)}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary Bar */}
      <div className="bg-legal-navy text-white rounded-xl px-6 py-4 flex items-center gap-4 shadow shrink-0">
        <Scale size={20} className="text-legal-gold shrink-0" />
        <p className="text-sm text-gray-200 flex-1">
          <strong className="text-legal-gold">AI Summary:</strong> 2 modifications detected. The Indemnification clause (§3.1) was significantly strengthened to include gross negligence and confidentiality carve-outs. The termination notice period was extended from a fixed term to a rolling 60-day notice.
        </p>
        <button className="shrink-0 px-4 py-2 border border-legal-gold/40 text-legal-gold text-xs font-bold rounded hover:bg-legal-gold/10 transition-colors uppercase tracking-wider">
          Download Redline
        </button>
      </div>
    </div>
  );
}
