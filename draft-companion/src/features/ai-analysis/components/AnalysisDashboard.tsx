import { useState, useEffect, useRef } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Scale, Check, BookOpen, X } from "lucide-react";
import { mockSimilarClause, mockCompareWithLaw, type RiskLevel, type AnalyzedClause } from "@/features/ai-analysis/data/mockAnalysis";

interface AnalysisDashboardProps {
  data: AnalyzedClause[];
  onClose: () => void;
  focusedClauseId: string | null;
  onFocusClause: (id: string | null) => void;
}

const AnalysisDashboard = ({ data, onClose, focusedClauseId, onFocusClause }: AnalysisDashboardProps) => {
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const highRiskRef = useRef<HTMLDivElement>(null);

  const filteredClauses = data.filter(
    (c) => filter === "All" || c.risk === filter
  );

  const highRiskCount = data.filter(c => c.risk === "High").length;
  const mediumRiskCount = data.filter(c => c.risk === "Medium").length;
  
  // Auto-focus first high risk item on mount
  useEffect(() => {
    if (highRiskCount > 0) {
      const firstHigh = data.find(c => c.risk === "High");
      if (firstHigh) {
        setExpandedId(firstHigh.id);
        setTimeout(() => {
          highRiskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [data, highRiskCount]);



  return (
    <div className="w-[400px] min-w-[400px] h-full overflow-y-auto border-l border-[#d4cfc1]/80 px-5 relative z-10 bg-[#fdfaf5] py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-[22px] font-medium text-[#222]">Analysis Dashboard</h2>
        <button onClick={onClose} className="p-1 text-[#888] hover:text-[#222] transition-colors rounded">
          <X size={18} />
        </button>
      </div>

      {/* Summary Prompt */}
      <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e6e2da] p-5 mb-6">
        <h3 className="font-sans text-[11px] font-bold tracking-[0.06em] uppercase text-[#333] mb-2 flex items-center gap-2">
          <AlertTriangle size={14} className={highRiskCount > 0 ? "text-[#b91c1c]" : "text-[#449156]"} />
          Executive Summary
        </h3>
        <p className="font-sans text-[13px] text-[#555] leading-relaxed">
          {highRiskCount > 0 
            ? `This contract contains ${highRiskCount} high-risk ${highRiskCount === 1 ? 'clause' : 'clauses'} and ${mediumRiskCount} medium-risk areas. Immediate review of the indemnity and term clauses is recommended to prevent unilateral liability exposure.`
            : `This contract appears standard with no high-risk clauses detected. ${mediumRiskCount} medium-risk areas were flagged for standard review.`}
        </p>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="text-center flex-1 bg-white border border-[#e6e2da] rounded-lg py-3">
          <p className="font-serif text-[24px] font-medium text-[#222] leading-none mb-1">
            {data.length}
          </p>
          <p className="font-sans text-[9px] font-bold text-[#888] tracking-widest uppercase">Clauses</p>
        </div>
        <div className="text-center flex-1 bg-white border border-[#e6e2da] rounded-lg py-3">
          <p className="font-serif text-[24px] font-medium text-[#b91c1c] leading-none mb-1">
            {highRiskCount}
          </p>
          <p className="font-sans text-[9px] font-bold text-[#b91c1c] tracking-widest uppercase">High Risk</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full mb-6 flex flex-wrap gap-2">
        {["All", "High", "Medium", "Low"].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level as RiskLevel | "All")}
            className={`px-4 py-2 rounded-full font-sans text-[12px] font-semibold tracking-wide transition-all border ${
              filter === level
                ? "bg-[#252b33] text-white border-transparent"
                : "bg-white text-[#666] border-[#d4cfc1] hover:bg-[#f6f4eb]"
            }`}
          >
            {level === "All" ? "All" : level}
          </button>
        ))}
      </div>

      {/* Clauses List */}
      <div className="w-full space-y-4">
        {filteredClauses.map((clause) => {
          const isExpanded = expandedId === clause.id;
          const isHigh = clause.risk === "High";
          const isMed = clause.risk === "Medium";
          
          return (
            <div 
              key={clause.id} 
              ref={isHigh && filter === "All" ? highRiskRef : null}
              onMouseEnter={() => onFocusClause(clause.id)}
              onMouseLeave={() => onFocusClause(null)}
              className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${
                isExpanded ? "ring-1 ring-[#d4cfc1] shadow-md" : ""
              } ${
                isHigh && filter === "All" ? "border-[#f0c2c2] bg-[#fffaf9]" : "border-[#e6e2da]"
              } ${focusedClauseId === clause.id ? "scale-[1.01]" : ""}`}
            >
              <div 
                className="p-5 cursor-pointer flex items-start gap-4"
                onClick={() => setExpandedId(isExpanded ? null : clause.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-[18px] font-semibold text-[#111]">{clause.title}</h3>
                    {isHigh && (
                      <span className="flex items-center gap-1 font-sans text-[10px] font-bold tracking-widest text-[#b91c1c] uppercase bg-[#fbebe9] px-2 py-0.5 rounded border border-[#f0c2c2]">
                        <AlertTriangle size={12} /> High Risk
                      </span>
                    )}
                    {isMed && (
                      <span className="font-sans text-[10px] font-bold tracking-widest text-[#b47a26] uppercase bg-[#faf3e8] px-2 py-0.5 rounded border border-[#ebd6bc]">
                        Medium Risk
                      </span>
                    )}
                    {!isHigh && !isMed && (
                      <span className="font-sans text-[10px] font-bold tracking-widest text-[#449156] uppercase bg-[#ebf5ec] px-2 py-0.5 rounded border border-[#bcebd3]">
                        Low Risk
                      </span>
                    )}
                    <span className="ml-auto font-sans text-[11px] font-semibold text-[#888]">
                      {clause.confidenceScore}% Confidence
                    </span>
                  </div>
                  <p className="font-serif text-[14.5px] text-[#444] leading-[1.6]">
                    "{clause.text}"
                  </p>
                </div>
                <button className="mt-1 text-[#888] hover:text-[#333] transition-colors">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {/* Expanded Area */}
              {isExpanded && (
                <div className="border-t border-[#e6e2da] p-6 bg-[#fdfaf5] rounded-b-xl space-y-6">
                  
                  {/* Explanation & Suggestion */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <h4 className="font-sans text-[10px] font-bold tracking-widest text-[#b91c1c] uppercase mb-2">Why is this risky?</h4>
                      <p className="font-sans text-[13px] text-[#555] leading-relaxed">
                        {clause.explanation}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-sans text-[10px] font-bold tracking-widest text-[#449156] uppercase mb-2">Suggested Fix</h4>
                      <p className="font-sans text-[13px] text-[#555] leading-relaxed">
                        {clause.suggestion}
                      </p>
                      <button className="mt-3 bg-[#252b33] text-white/90 text-[12px] font-semibold tracking-wide py-2 px-4 rounded hover:bg-[#1a1f26] transition-colors shadow-sm flex items-center gap-2">
                        <Check size={14} /> Apply Fix
                      </button>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#e6e2d8]" />

                  {/* Context Links */}
                  <div className="flex flex-col gap-6">
                    {/* Compare with Law */}
                    <div>
                      <h4 className="font-sans text-[10px] font-bold tracking-widest text-[#888] uppercase mb-3 flex items-center gap-2">
                        <Scale size={14} /> Compare with Law
                      </h4>
                      <div className="bg-white p-4 rounded-lg border border-[#e6e2da] shadow-sm">
                        <p className="font-sans text-[12px] font-semibold text-[#222] mb-1">{mockCompareWithLaw.law}</p>
                        <p className="font-sans text-[11px] text-[#666] leading-relaxed">{mockCompareWithLaw.explanation}</p>
                      </div>
                    </div>

                    {/* Similar Clauses */}
                    <div>
                      <h4 className="font-sans text-[10px] font-bold tracking-widest text-[#888] uppercase mb-3 flex items-center gap-2">
                        <BookOpen size={14} /> Similar Clause Found
                      </h4>
                      <div className="bg-white p-4 rounded-lg border border-[#e6e2da] shadow-sm relative">
                        <span className="absolute top-4 right-4 font-sans text-[10px] font-bold text-[#449156] bg-[#ebf5ec] px-1.5 py-0.5 rounded">
                          {mockSimilarClause.matchPercentage}% Match
                        </span>
                        <p className="font-sans text-[12px] font-semibold text-[#222] mb-1">{mockSimilarClause.source}</p>
                        <p className="font-serif italic text-[12px] text-[#666] leading-relaxed pr-12">"{mockSimilarClause.text}"</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
