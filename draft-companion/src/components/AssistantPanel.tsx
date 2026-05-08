import { useState } from "react";
import { ChevronDown, AlertTriangle, Plus, Settings2, Check, X, Send, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssistantPanelProps {
  onInsertClause: (text: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onClose: () => void;
}

const suggestedClause =
  "The Client shall compensate the Service Provider within thirty (30) days of receipt of each invoice. Late payments shall accrue interest at a rate of 1.5% per month.";

const alternativeClause =
  "Payment shall be rendered net-60 from invoice date. The Service Provider reserves the right to suspend services if payment is overdue by more than fifteen (15) business days.";

const termClause =
  "This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months unless terminated earlier in accordance with the provisions herein.";

const AssistantPanel = ({ onInsertClause, onAnalyze, isAnalyzing, onClose }: AssistantPanelProps) => {
  const [activeTab, setActiveTab] = useState<"improved" | "alternatives">("improved");
  const [insertedClauses, setInsertedClauses] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleInsert = (key: string, text: string) => {
    onInsertClause(text);
    setInsertedClauses((prev) => new Set(prev).add(key));
    toast({ title: "Clause inserted", description: "The clause has been added to your document." });
  };

  const currentSuggestion = activeTab === "improved" ? suggestedClause : alternativeClause;

  return (
    <div className="w-[340px] min-w-[340px] h-full overflow-y-auto border-l border-[#d4cfc1]/60 px-5 relative z-10 bg-[#e6e2da]/20 backdrop-blur-[20px] shadow-[-10px_0_30px_rgba(0,0,0,0.03)] flex flex-col">
      <div className="pt-8 pb-5 flex justify-between items-start shrink-0">
        <div>
          <h2 className="font-serif text-[22px] font-medium text-[#222]">AI Assistant</h2>
          <p className="font-sans text-[10px] tracking-[0.12em] font-semibold text-[#888] uppercase mt-1">
            Legal Intelligence Engine v1.2
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors -mr-2"
        >
          <X size={18} className="text-[#555]" />
        </button>
      </div>

      <div className="space-y-6 pb-6 flex-1 overflow-y-auto pr-1 -mr-1">
        {/* Suggested Clause Refinement */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={16} className="text-[#555]" />
            <h3 className="font-sans text-[11px] font-bold tracking-[0.06em] uppercase text-[#333]">
              Suggested Clause Refinement
            </h3>
          </div>
          <div className="flex rounded-md overflow-hidden bg-[#e0ded8]/50 p-1 mb-4 shadow-inner">
            <button
              onClick={() => setActiveTab("improved")}
              className={`flex-1 py-1.5 text-[10px] font-sans font-bold tracking-wider rounded transition-all ${activeTab === "improved"
                ? "bg-white text-[#111] shadow-sm"
                : "text-[#666] hover:text-[#333]"
                }`}
            >
              IMPROVED
            </button>
            <button
              onClick={() => setActiveTab("alternatives")}
              className={`flex-1 py-1.5 text-[10px] font-sans font-bold tracking-wider rounded transition-all ${activeTab === "alternatives"
                ? "bg-white text-[#111] shadow-sm"
                : "text-[#666] hover:text-[#333]"
                }`}
            >
              ALTERNATIVES
            </button>
          </div>
          <div className="bg-[#fcfaf5] rounded-[6px] p-3 mb-4 border border-[#fff]/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
            <p className="font-serif text-[13px] italic text-[#444] leading-[1.6]">
              "{currentSuggestion}"
            </p>
          </div>
          <InsertButton
            inserted={insertedClauses.has("suggestion")}
            onClick={() => handleInsert("suggestion", currentSuggestion)}
          />
        </Card>

        {/* Recommended Addition */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans text-[11px] font-bold tracking-[0.06em] uppercase text-[#333]">
                Recommended Addition
              </h3>
              <p className="font-sans text-[13px] text-[#555] mt-1.5">
                You should add: <span className="text-[#111] font-medium">Term & Duration clause</span>
              </p>
            </div>
            <button
              onClick={() => handleInsert("term", termClause)}
              className="w-7 h-7 rounded-full bg-[#f0eee9] border border-[#e6e2d8] flex items-center justify-center text-[#555] hover:bg-[#e6e2d8] hover:text-[#111] transition-colors"
            >
              {insertedClauses.has("term") ? <Check size={14} className="text-[#222]" /> : <Plus size={14} />}
            </button>
          </div>
          <InsertButton
            inserted={insertedClauses.has("term")}
            onClick={() => handleInsert("term", termClause)}
          />
        </Card>

        {/* Risk Analysis */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#555]" />
              <h3 className="font-sans text-[11px] font-bold tracking-[0.06em] uppercase text-[#333]">
                Risk Analysis
              </h3>
            </div>
            <span className="font-sans text-[9px] font-bold tracking-[0.1em] text-[#888] uppercase">
              3 Issues Found
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-sans text-[10.5px] font-bold text-[#b91c1c] tracking-widest uppercase">High Risk</span>
                <AlertTriangle size={13} className="text-[#b91c1c]" />
              </div>
              <p className="font-sans text-[13px] font-semibold text-[#111]">Indemnity Scope</p>
              <p className="font-sans text-[12px] text-[#666] mt-1 leading-[1.5]">
                Section a lacks a liability cap, exposing the client to unlimited damages.
              </p>
            </div>

            <div className="h-px bg-[#e6e2da] w-full my-3" />

            <div>
              <span className="font-sans text-[10.5px] font-bold text-[#b47a26] tracking-widest uppercase">Medium Risk</span>
              <p className="font-sans text-[12px] text-[#666] mt-1.5 leading-[1.5]">
                % late fee exceeds statutory limits in several jurisdictions.
              </p>
            </div>
          </div>
        </Card>

      </div>

      {/* AI Prompt Input */}
      <div className="shrink-0 pt-4 pb-6 mt-auto">
        <div className="bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#e6e2d6] p-2 relative transition-all focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.1)] focus-within:border-[#d4cfc1]">
          <textarea
            placeholder="Ask AI to refine or generate legal clauses..."
            className="w-full bg-transparent font-sans text-[13px] text-[#333] placeholder:text-[#888] resize-none outline-none min-h-[60px] p-2 leading-relaxed"
          />
          <div className="flex justify-between items-center mt-2 px-1">
            <button className="p-1.5 text-[#888] hover:text-[#333] transition-colors rounded-md hover:bg-[#f6f4eb]">
              <Paperclip size={16} />
            </button>
            <button className="bg-[#2a303a] text-white p-1.5 rounded-lg hover:bg-[#1f252c] transition-colors shadow-sm">
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsertButton = ({ inserted, onClick }: { inserted: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    disabled={inserted}
    className={`w-full rounded-md py-3 font-sans text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${inserted
      ? "bg-[#e5e5e5] text-[#888] cursor-default"
      : "bg-[#252b33] text-white hover:bg-[#1a1f26] shadow-sm border-t border-white/10"
      }`}
  >
    {inserted ? (
      <>
        <Check size={14} /> Inserted
      </>
    ) : (
      <>
        Insert Clause <ChevronDown size={14} className="opacity-70" />
      </>
    )}
  </button>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/50 backdrop-blur border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-2xl p-5 relative">
    {children}
  </div>
);

export default AssistantPanel;
