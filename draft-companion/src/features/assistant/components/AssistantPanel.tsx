import { useState } from "react";
import {
  ChevronDown,
  AlertTriangle,
  Plus,
  Settings2,
  Check,
  X,
  Send,
  Paperclip,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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

interface SearchResult {
  id: number;
  document_id: string;
  content: string;
  section_header: string | null;
  similarity: number;
}

const AssistantPanel = ({
  onInsertClause,
  onAnalyze,
  isAnalyzing,
  onClose,
}: AssistantPanelProps) => {
  const [mainTab, setMainTab] = useState<"insights" | "search">("insights");
  const [activeTab, setActiveTab] = useState<"improved" | "alternatives">("improved");
  const [insertedClauses, setInsertedClauses] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Semantic Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [threshold, setThreshold] = useState(0.2);
  const [limit, setLimit] = useState(5);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLocalSearching, setIsLocalSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleInsert = (key: string, text: string) => {
    onInsertClause(text);
    setInsertedClauses((prev) => new Set(prev).add(key));
    toast({
      title: "Clause inserted",
      description: "The clause has been added to your document.",
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLocalSearching(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log(`[Frontend Search] Querying: "${searchQuery}" (Threshold: ${threshold}, Limit: ${limit})`);
      const response = await fetch("http://localhost:5000/api/pipeline/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: searchQuery,
          threshold: threshold,
          limit: limit,
        }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();
      setSearchResults(data.results || []);

      if (!data.results || data.results.length === 0) {
        toast({
          title: "No matches found",
          description: "Try lowering the similarity threshold or changing your search terms.",
        });
      }
    } catch (err: any) {
      console.error("Semantic search error:", err);
      toast({
        title: "Search failed",
        description: err.message || "Could not query similarity matches from database.",
        variant: "destructive",
      });
    } finally {
      setIsLocalSearching(false);
    }
  };

  const currentSuggestion = activeTab === "improved" ? suggestedClause : alternativeClause;

  return (
    <div className="w-[340px] min-w-[340px] h-full overflow-y-auto border-l border-[#d4cfc1]/60 px-5 relative z-10 bg-[#e6e2da]/20 backdrop-blur-[20px] shadow-[-10px_0_30px_rgba(0,0,0,0.03)] flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 flex justify-between items-start shrink-0">
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

      {/* Main Tab Switcher */}
      <div className="flex rounded-md overflow-hidden bg-[#e0ded8]/50 p-1 mb-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] shrink-0">
        <button
          onClick={() => setMainTab("insights")}
          className={`flex-1 py-2 text-[10.5px] font-sans font-bold tracking-wider rounded transition-all uppercase ${
            mainTab === "insights"
              ? "bg-white text-[#111] shadow-sm"
              : "text-[#666] hover:text-[#333]"
          }`}
        >
          Insights & Risks
        </button>
        <button
          onClick={() => setMainTab("search")}
          className={`flex-1 py-2 text-[10.5px] font-sans font-bold tracking-wider rounded transition-all uppercase ${
            mainTab === "search"
              ? "bg-white text-[#111] shadow-sm"
              : "text-[#666] hover:text-[#333]"
          }`}
        >
          Semantic Search
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6 pb-6 flex-1 overflow-y-auto pr-1 -mr-1">
        {mainTab === "insights" ? (
          <>
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
                  className={`flex-1 py-1.5 text-[10px] font-sans font-bold tracking-wider rounded transition-all ${
                    activeTab === "improved" ? "bg-white text-[#111] shadow-sm" : "text-[#666] hover:text-[#333]"
                  }`}
                >
                  IMPROVED
                </button>
                <button
                  onClick={() => setActiveTab("alternatives")}
                  className={`flex-1 py-1.5 text-[10px] font-sans font-bold tracking-wider rounded transition-all ${
                    activeTab === "alternatives" ? "bg-white text-[#111] shadow-sm" : "text-[#666] hover:text-[#333]"
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
                    <span className="font-sans text-[10.5px] font-bold text-[#b91c1c] tracking-widest uppercase">
                      High Risk
                    </span>
                    <AlertTriangle size={13} className="text-[#b91c1c]" />
                  </div>
                  <p className="font-sans text-[13px] font-semibold text-[#111]">Indemnity Scope</p>
                  <p className="font-sans text-[12px] text-[#666] mt-1 leading-[1.5]">
                    Section a lacks a liability cap, exposing the client to unlimited damages.
                  </p>
                </div>

                <div className="h-px bg-[#e6e2da] w-full my-3" />

                <div>
                  <span className="font-sans text-[10.5px] font-bold text-[#b47a26] tracking-widest uppercase">
                    Medium Risk
                  </span>
                  <p className="font-sans text-[12px] text-[#666] mt-1.5 leading-[1.5]">
                    % late fee exceeds statutory limits in several jurisdictions.
                  </p>
                </div>
              </div>
            </Card>
          </>
        ) : (
          /* Semantic Search Tab Content */
          <div className="space-y-5">
            {/* Search Controls */}
            <Card>
              <div className="relative flex items-center mb-3">
                <input
                  type="text"
                  placeholder="Search legal provisions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-[#f3f1eb] border border-[#e0ded6] rounded-lg py-2.5 pl-9 pr-4 font-sans text-[13px] text-[#222] placeholder:text-[#999] outline-none focus:border-[#c5c1b5] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                />
                <Search size={14} className="absolute left-3.5 text-[#888] pointer-events-none" />
              </div>

              {/* Filters Toggle & Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                    showFilters
                      ? "bg-[#252b33] text-white border-transparent"
                      : "bg-white text-[#555] border-[#e0ded6] hover:bg-[#f6f4eb]"
                  }`}
                >
                  <SlidersHorizontal size={12} />
                  <span className="font-sans text-[10.5px] font-semibold">Config</span>
                </button>

                <button
                  onClick={handleSearch}
                  disabled={isLocalSearching}
                  className="flex-1 bg-[#252b33] text-white rounded-lg py-2 font-sans text-[11px] font-bold tracking-wider hover:bg-[#1a1f26] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLocalSearching ? "SEARCHING..." : "QUERY DB"}
                </button>
              </div>

              {/* Expanded Filters panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-[#e0ded6] space-y-4">
                  {/* Similarity Threshold */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-sans text-[10.5px] font-bold text-[#555] uppercase tracking-wide">
                        Min Similarity:
                      </span>
                      <span className="font-sans text-[11px] font-mono font-bold text-[#222]">
                        {Math.round(threshold * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      className="w-full h-1 bg-[#f0eee8] rounded-lg appearance-none cursor-pointer accent-[#252b33]"
                    />
                  </div>

                  {/* Limit Selection */}
                  <div>
                    <label className="block font-sans text-[10.5px] font-bold text-[#555] uppercase tracking-wide mb-1.5">
                      Max Results:
                    </label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                      className="w-full bg-[#f3f1eb] border border-[#e0ded6] rounded-md p-1.5 font-sans text-[12px] text-[#222]"
                    >
                      <option value={3}>3 Matches</option>
                      <option value={5}>5 Matches</option>
                      <option value={8}>8 Matches</option>
                      <option value={10}>10 Matches</option>
                    </select>
                  </div>
                </div>
              )}
            </Card>

            {/* Similarity Matches List */}
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((res) => (
                  <Card key={res.id}>
                    {/* Badge similarity and heading */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1">
                        <span className="font-sans text-[9px] font-bold tracking-[0.1em] text-[#888] uppercase">
                          Section:
                        </span>
                        <h4 className="font-sans text-[12px] font-bold text-[#222] mt-0.5 leading-snug">
                          {res.section_header || "General / Headings"}
                        </h4>
                      </div>
                      <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#252b33]/5 border border-[#252b33]/10">
                        <span className="font-sans text-[10.5px] font-bold text-[#252b33] tabular-nums">
                          {Math.round(res.similarity * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#fcfaf5] rounded-[6px] p-3 mb-4 border border-[#fff]/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                      <p className="font-serif text-[12px] text-[#444] leading-[1.6] line-clamp-4">
                        "{res.content}"
                      </p>
                    </div>

                    <InsertButton
                      inserted={insertedClauses.has(`search-${res.id}`)}
                      onClick={() => handleInsert(`search-${res.id}`, res.content)}
                    />
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 px-4 bg-white/20 border border-dashed border-[#d4cfc1] rounded-2xl">
                  <Search size={24} className="mx-auto text-[#999] mb-3" />
                  <p className="font-sans text-[12.5px] font-medium text-[#666] leading-relaxed">
                    No results to display. Type a legal query above to query the vector database!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Prompt Input (only for insights tab) */}
      {mainTab === "insights" && (
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
      )}
    </div>
  );
};

const InsertButton = ({ inserted, onClick }: { inserted: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    disabled={inserted}
    className={`w-full rounded-md py-2.5 font-sans text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
      inserted
        ? "bg-[#e5e5e5] text-[#888] cursor-default"
        : "bg-[#252b33] text-white hover:bg-[#1a1f26] shadow-sm border-t border-white/10"
    }`}
  >
    {inserted ? (
      <>
        <Check size={13} /> Inserted
      </>
    ) : (
      <>
        Insert Clause <ChevronDown size={13} className="opacity-70" />
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
