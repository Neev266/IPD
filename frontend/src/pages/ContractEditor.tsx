import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Save, AlertTriangle, MessageSquare, Plus, ExternalLink, Scale, ChevronRight } from 'lucide-react';

const contractText = `MASTER SERVICES AGREEMENT

IN WITNESS WHEREOF, the Parties have executed this Master Services Agreement as of the Effective Date set forth below.

PARTIES

This Master Services Agreement ("Agreement") is entered into as of March 1, 2026 (the "Effective Date"), by and between:

Client: TechCorp Inc., a Delaware corporation with its principal place of business at 500 Technology Drive, San Francisco, CA 94107 ("Client"); and

Service Provider: Global Solutions LLC, a limited liability company incorporated under the laws of New York ("Provider").

WHEREAS, Client desires to retain Provider to perform certain services, and Provider desires to perform such services, subject to the terms and conditions hereof;

NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

ARTICLE I — SERVICES PROVIDED

1.1 Scope of Services. Provider agrees to perform the professional services described in one or more Statements of Work ("SOW") executed by both parties and incorporated herein by reference.

ARTICLE II — COMPENSATION AND PAYMENT

2.1 Fees. Client shall pay Provider the fees set forth in the applicable SOW. All undisputed invoices are due and payable within forty-five (45) days of receipt.

ARTICLE III — INDEMNIFICATION

3.1 Mutual Indemnification. Provider shall indemnify, defend, and hold harmless Client from and against any and all claims, damages, liabilities, and expenses arising out of or related to Provider's gross negligence or willful misconduct in the performance of the Services.

ARTICLE IV — LIMITATION OF LIABILITY

4.1 Exclusion of Consequential Damages. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR USE.

ARTICLE V — TERM AND TERMINATION

5.1 Term. This Agreement shall commence on the Effective Date and remain in effect until terminated by either party upon sixty (60) days prior written notice.`;

const suggestions = [
  {
    id: 1,
    type: 'risk',
    clause: 'Article II — Compensation (§2.1)',
    description: 'Payment terms of 45 days exceed firm policy maximum of 30 days. This materially affects cash flow and is below market standard for professional services agreements.',
    recommendation: 'Amend "forty-five (45) days" to "thirty (30) days" in §2.1 to align with standard commercial practice.',
  },
  {
    id: 2,
    type: 'suggestion',
    clause: 'Article III — Indemnification (§3.1)',
    description: 'The indemnification clause does not explicitly cover breach of confidentiality obligations, leaving the firm exposed in the event of a data breach.',
    recommendation: 'Append to §3.1: "…or any material breach of the confidentiality obligations set forth in Article VI hereof."',
  },
];

export default function ContractEditor() {
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);

  return (
    <div className="flex flex-col lg:flex-row gap-5" style={{ height: 'calc(100vh - 10rem)' }}>

      {/* Editor Panel */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-legal-border shadow-legal overflow-hidden">
        
        {/* Document Title Bar */}
        <div className="bg-legal-navy px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Scale size={14} className="text-legal-gold" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold/80 font-semibold">Active Draft · MTR-2024-1042</span>
            </div>
            <h2 className="text-base font-bold text-white">Master Services Agreement — TechCorp Inc.</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-[10px]">Draft v2.1</Badge>
            <Button variant="outline" size="sm" className="h-8 text-xs text-white border-white/20 hover:bg-white/10 hover:text-white">
              <ExternalLink size={12} className="mr-1.5" /> Export PDF
            </Button>
            <Button size="sm" className="h-8 text-xs bg-legal-gold text-legal-navy font-bold hover:bg-legal-gold/90">
              <Save size={12} className="mr-1.5" /> Save Draft
            </Button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-legal-border bg-legal-ivory/60 text-xs text-legal-textLight">
          <select className="text-xs bg-transparent font-medium text-legal-navy focus:outline-none cursor-pointer pr-2">
            <option>Article Heading</option>
            <option>Section</option>
            <option>Body Text</option>
          </select>
          <div className="w-px h-4 bg-legal-border mx-1" />
          <button className="px-2 py-1 font-bold hover:bg-legal-gray rounded transition-colors">B</button>
          <button className="px-2 py-1 italic hover:bg-legal-gray rounded transition-colors">I</button>
          <button className="px-2 py-1 underline hover:bg-legal-gray rounded transition-colors">U</button>
          <div className="w-px h-4 bg-legal-border mx-1" />
          <button className="px-2 py-1 hover:bg-legal-gray rounded transition-colors text-legal-navy font-medium">¶ Clause</button>
          <button className="px-2 py-1 hover:bg-legal-gray rounded transition-colors text-legal-navy font-medium">§ Section</button>
          <div className="flex-1" />
          <span className="text-[10px] text-legal-textLight italic">Last saved: 2 min ago · Jane Doe, Esq.</span>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto py-12 px-16">
            {contractText.split('\n\n').map((paragraph, idx) => {
              // Main title
              if (idx === 0) return (
                <h1 key={idx} className="text-center text-xl font-black text-legal-navy tracking-wider uppercase mb-2 font-legal-doc">
                  {paragraph}
                </h1>
              );
              // IN WITNESS WHEREOF
              if (idx === 1) return (
                <p key={idx} className="text-center text-xs text-legal-textLight mb-6 italic font-legal-doc">{paragraph}</p>
              );
              // PARTIES header
              if (idx === 2) return (
                <div key={idx} className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px flex-1 bg-legal-gold/20" />
                    <span className="statute-label text-legal-gold">Parties</span>
                    <div className="h-px flex-1 bg-legal-gold/20" />
                  </div>
                </div>
              );
              // Risky clause — Payment
              if (idx === 4) return (
                <div key={idx} className="clause-block-risk cursor-pointer" onClick={() => setActiveSuggestion(1)}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">Risk Flag · Click to Review</span>
                  </div>
                  <p className="text-sm text-legal-text font-legal-doc leading-relaxed">{paragraph}</p>
                </div>
              );
              // Suggestion clause — Indemnification
              if (idx === 5) return (
                <div key={idx} className="clause-block cursor-pointer" onClick={() => setActiveSuggestion(2)}>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare size={12} className="text-legal-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-legal-gold">AI Suggestion · Click to Review</span>
                  </div>
                  <p className="text-sm text-legal-text font-legal-doc leading-relaxed">{paragraph}</p>
                </div>
              );
              // Article headings
              if (paragraph.startsWith('ARTICLE') || paragraph.startsWith('PARTIES') || paragraph.startsWith('WHEREAS') || paragraph.startsWith('NOW,')) {
                return <p key={idx} className="text-sm font-bold text-legal-navy mb-2 mt-4 font-legal-doc">{paragraph}</p>;
              }
              return <p key={idx} className="text-sm text-legal-text mb-4 font-legal-doc leading-loose font-light">{paragraph}</p>;
            })}
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4">

        {/* AI Panel Header */}
        <div className="bg-legal-navy rounded-xl overflow-hidden border border-legal-navy/30 shadow-legal">
          <div className="h-0.5 bg-gradient-to-r from-legal-emerald via-legal-gold to-legal-emerald" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Scale size={16} className="text-legal-gold" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Legal Counsel</h3>
            </div>
            <p className="text-[11px] text-gray-400">Select a highlighted clause to receive AI analysis and recommended redlines.</p>
          </div>

          <div className="px-4 pb-4 space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeSuggestion === s.id
                    ? 'border-legal-gold bg-white/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => setActiveSuggestion(s.id)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-white/80 truncate flex-1 pr-2">{s.clause}</span>
                  <Badge variant={s.type === 'risk' ? 'danger' : 'warning'} className="text-[9px] px-1.5 shrink-0">
                    {s.type === 'risk' ? 'High Risk' : 'Suggest'}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{s.description}</p>

                {activeSuggestion === s.id && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[10px] font-semibold text-legal-gold mb-1.5 uppercase tracking-wider">Recommended Redline:</p>
                    <div className="bg-black/20 rounded p-2 text-[11px] text-white/90 italic leading-relaxed">{s.recommendation}</div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 py-1.5 bg-legal-emerald text-white text-[11px] font-bold rounded hover:bg-legal-emerald/90 transition-colors uppercase tracking-wider">Accept</button>
                      <button className="flex-1 py-1.5 border border-red-400/40 text-red-400 text-[11px] font-bold rounded hover:bg-red-900/20 transition-colors uppercase tracking-wider">Reject</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insert from Library */}
        <Card className="flex-1">
          <CardHeader className="pb-3 border-b border-legal-border">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus size={14} className="text-legal-gold" />
              Standard Clause Library
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {[
              'Force Majeure (Standard)',
              'Non-Solicitation (12 mo.)',
              'Governing Law — NY',
              'Dispute Resolution / Arbitration',
              'Entire Agreement Clause',
            ].map((clause) => (
              <button key={clause} className="w-full text-left px-3 py-2.5 text-xs border border-legal-border hover:border-legal-gold/50 hover:bg-legal-ivory rounded-lg flex items-center justify-between transition-all group text-legal-navy font-medium">
                {clause}
                <ChevronRight size={12} className="text-legal-textLight group-hover:text-legal-gold transition-colors shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
