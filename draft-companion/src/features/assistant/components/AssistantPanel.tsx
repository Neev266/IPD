import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
  Settings2,
  Check,
  X,
  Send,
  Paperclip,
  Search,
  SlidersHorizontal,
  MessageSquare,
  Scale,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipelineApi } from "@/services/pipelineApi";
import { analysisApi } from "@/services/analysisApi";

interface AssistantPanelProps {
  onInsertClause: (text: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onClose: () => void;
  analysisFindings?: any[];
  focusedClauseId?: string | null;
  onFocusClause?: (id: string | null) => void;
  onSearchQuery?: (query: string) => void;
  activeSearchHighlight?: string;
  documentId?: string;
  documentName?: string;
}

interface SearchResult {
  id: number;
  document_id: string;
  content: string;
  section_header: string | null;
  similarity: number;
}

interface Message {
  id?: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const suggestedClause =
  "The Client shall compensate the Service Provider within thirty (30) days of receipt of each invoice. Late payments shall accrue interest at a rate of 1.5% per month.";
const alternativeClause =
  "Payment shall be rendered net-60 from invoice date. The Service Provider reserves the right to suspend services if payment is overdue by more than fifteen (15) business days.";
const termClause =
  "This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months unless terminated earlier in accordance with the provisions herein.";

const AssistantPanel = ({
  onInsertClause,
  onAnalyze,
  isAnalyzing,
  onClose,
  analysisFindings = [],
  focusedClauseId = null,
  onFocusClause = () => {},
  onSearchQuery,
  activeSearchHighlight,
  documentId = "",
  documentName = "",
}: AssistantPanelProps) => {
  const [mainTab, setMainTab] = useState<"chatbot" | "risks" | "search">("chatbot");
  const [activeTab, setActiveTab] = useState<"improved" | "alternatives">("improved");
  const [insertedClauses, setInsertedClauses] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Chatbot states
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am your AI Contract Assistant. I have analyzed your document. Ask me questions about clauses, request rewrites, or browse detected findings in the 'Risk Flags' tab.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Risk Flag states
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // Semantic Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [threshold, setThreshold] = useState(0.2);
  const [limit, setLimit] = useState(5);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLocalSearching, setIsLocalSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Chat memory states
  const [memoryContext, setMemoryContext] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    setMemoryContext(null);
  }, [documentName]);

  // Search Match navigation states
  const [matchCount, setMatchCount] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const getSearchMatches = () => {
    return Array.from(document.querySelectorAll(".search-highlight"));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const matches = getSearchMatches();
      setMatchCount(matches.length);
      setActiveMatchIndex(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [activeSearchHighlight, mainTab]);

  const handleNextMatch = () => {
    const matches = getSearchMatches();
    if (matches.length === 0) return;
    const nextIndex = (activeMatchIndex + 1) % matches.length;
    setActiveMatchIndex(nextIndex);
    const target = matches[nextIndex];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("highlight-pulse-active");
      setTimeout(() => {
        target.classList.remove("highlight-pulse-active");
      }, 1500);
    }
  };

  const handlePrevMatch = () => {
    const matches = getSearchMatches();
    if (matches.length === 0) return;
    const prevIndex = (activeMatchIndex - 1 + matches.length) % matches.length;
    setActiveMatchIndex(prevIndex);
    const target = matches[prevIndex];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("highlight-pulse-active");
      setTimeout(() => {
        target.classList.remove("highlight-pulse-active");
      }, 1500);
    }
  };

  const handleSearchResultClick = (content: string) => {
    if (!content) return;
    const normalizedContent = content.trim().replace(/\s+/g, " ");
    
    // Find all search highlight elements
    const highlights = Array.from(document.querySelectorAll(".search-highlight"));
    
    for (const el of highlights) {
      const parentText = el.parentElement?.textContent || "";
      const normalizedParent = parentText.replace(/\s+/g, " ");
      
      // Scroll to this highlight if context matches
      if (
        normalizedContent.includes(normalizedParent) || 
        normalizedParent.includes(normalizedContent) ||
        normalizedContent.slice(0, 50).includes(normalizedParent.slice(0, 50))
      ) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-pulse-active");
        setTimeout(() => {
          el.classList.remove("highlight-pulse-active");
        }, 1500);
        return;
      }
    }
    
    // Fallback: scroll to page containing text
    const pageEditors = Array.from(document.querySelectorAll(".legal-editor"));
    for (const el of pageEditors) {
      const pageText = el.textContent || "";
      if (pageText.replace(/\s+/g, " ").includes(normalizedContent)) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mainTab]);

  // Sync search input query to parent for editor highlighting
  useEffect(() => {
    if (!searchQuery.trim()) {
      onSearchQuery?.("");
    }
  }, [searchQuery, onSearchQuery]);

  const handleInsert = (key: string, text: string) => {
    onInsertClause(text);
    setInsertedClauses((prev) => new Set(prev).add(key));
    toast({
      title: "Clause inserted",
      description: "The clause has been added to your document.",
    });
  };

  const handleRiskClick = (findingId: string) => {
    setExpandedRiskId(expandedRiskId === findingId ? null : findingId);
    
    // Smooth scroll to the unique highlight element in the editor DOM
    setTimeout(() => {
      const el = document.getElementById(`risk-highlight-${findingId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-pulse-active");
        setTimeout(() => {
          el.classList.remove("highlight-pulse-active");
        }, 1500);
      }
    }, 50);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isBotTyping) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) {
      setInputValue("");
    }
    setIsBotTyping(true);
    setIsThinking(true);

    let startedTypewriter = false;

    try {
      // Map history message state objects into the API signature format
      const formattedHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await analysisApi.chat({
        message: userMsg.text,
        history: formattedHistory,
        memoryContext: memoryContext,
        documentId: documentId,
        documentName: documentName
      });

      if (res && res.reply) {
        setIsThinking(false); // Remove the thinking card immediately!
        startedTypewriter = true;
        const botMessageId = `bot_${Date.now()}`;
        
        // Append empty bot message
        setMessages((prev) => [
          ...prev,
          {
            id: botMessageId,
            sender: "bot",
            text: "",
            timestamp: new Date(),
          }
        ]);
        
        if (res.memoryContext) {
          setMemoryContext(res.memoryContext);
        }

        // Typewriter effect: slice text progressively
        const fullText = res.reply;
        let currentIndex = 0;
        
        const intervalId = setInterval(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId
                ? { ...m, text: fullText.slice(0, currentIndex + 1) }
                : m
            )
          );
          currentIndex++;
          
          if (currentIndex >= fullText.length) {
            clearInterval(intervalId);
            setIsBotTyping(false); // Enable input box after typing completes
          }
        }, 15);
      }
    } catch (err: any) {
      console.error("[CHAT] API request failed:", err);
      setIsThinking(false);
      toast({
        title: "Chat failed",
        description: err.message || "Unable to get response from Legal Assistant.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_error_${Date.now()}`,
          sender: "bot",
          text: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
          timestamp: new Date(),
        }
      ]);
    } finally {
      if (!startedTypewriter) {
        setIsBotTyping(false);
        setIsThinking(false);
      }
    }
  };

  const handleAskAIAboutRisk = (finding: any) => {
    setMainTab("chatbot");
    const prompt = `Explain this compliance risk flag: "${finding.title}" (${finding.risk} Risk) found in this clause:\n"${finding.text}"\n\nHow should I fix this?`;
    handleSendMessage(prompt);
  };



  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    onSearchQuery?.(searchQuery); // Highlight occurrences in document
    setIsLocalSearching(true);
    try {
      const data = await pipelineApi.search(searchQuery, threshold, limit);
      const rawResults = data.results || [];
      const lowerQuery = searchQuery.toLowerCase();
      const prioritized = rawResults.filter((r) => r.content.toLowerCase().includes(lowerQuery));
      const others = rawResults.filter((r) => !r.content.toLowerCase().includes(lowerQuery));
      setSearchResults([...prioritized, ...others]);

      if (!data.results || data.results.length === 0) {
        toast({
          title: "No matches found",
          description: "Try lowering the similarity threshold or changing your search terms.",
        });
      }
    } catch (err: any) {
      console.error("[SEARCH] Semantic search error:", err);
      toast({
        title: "Search failed",
        description: err.message || "Could not query similarity matches from database.",
        variant: "destructive",
      });
    } finally {
      setIsLocalSearching(false);
    }
  };

  const filteredRisks = analysisFindings.filter(
    (f) => riskFilter === "All" || f.risk === riskFilter
  );

  const highRiskCount = analysisFindings.filter((f) => f.risk === "High").length;
  const mediumRiskCount = analysisFindings.filter((f) => f.risk === "Medium").length;

  return (
    <div className="w-[385px] min-w-[385px] h-full overflow-y-auto border-l border-[#d4cfc1]/60 px-5 relative z-10 bg-[#e6e2da]/25 backdrop-blur-[20px] shadow-[-10px_0_30px_rgba(0,0,0,0.03)] flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 flex justify-between items-start shrink-0">
        <div>
          <h2 className="font-serif text-[22px] font-medium text-[#222]">Legal Assistant</h2>
          <p className="font-sans text-[10px] tracking-[0.12em] font-semibold text-[#888] uppercase mt-1">
            Analysis & Intelligence Engine
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
        {[
          { id: "chatbot", label: "Chatbot" },
          { id: "risks", label: `Risk Flags (${analysisFindings.length})` },
          { id: "search", label: "Search" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id as any)}
            className={`flex-1 py-2 text-[10px] font-sans font-bold tracking-wider rounded transition-all uppercase ${
              mainTab === tab.id
                ? "bg-white text-[#111] shadow-sm"
                : "text-[#666] hover:text-[#333]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto pb-6 pr-1 -mr-1 flex flex-col">
        {mainTab === "chatbot" && (
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {/* Messages log */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 mb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#252b33] text-white rounded-br-none"
                        : "bg-white/80 border border-[#e6e2da] text-[#333] rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-[#888] mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              {isThinking && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start">
                  <div className="rounded-2xl p-4 text-[13px] bg-white/80 border border-[#e6e2da] text-[#888] rounded-bl-none">
                    <p className="animate-pulse">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts Suggestions */}
            {messages.length === 1 && (
              <div className="mb-4 space-y-2">
                <p className="font-sans text-[10px] font-bold text-[#888] uppercase tracking-wide">
                  Suggested Questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "List high risks",
                    "Check non-compete terms",
                    "Is there uncapped liability?",
                  ].map((pText) => (
                    <button
                      key={pText}
                      onClick={() => {
                        setInputValue(pText);
                      }}
                      className="bg-white/60 hover:bg-white text-[#555] text-[11px] font-sans border border-[#e0ded6] rounded-full px-3 py-1.5 transition-colors text-left"
                    >
                      {pText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Prompt Input */}
            <div className="bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#e6e2d6] p-2 relative transition-all focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.1)] focus-within:border-[#d4cfc1]">
              <textarea
                placeholder="Ask AI about contract clauses or flagged risks..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent font-sans text-[13px] text-[#333] placeholder:text-[#888] resize-none outline-none min-h-[60px] p-2 leading-relaxed"
              />
              <div className="flex justify-between items-center mt-2 px-1">
                <button className="p-1.5 text-[#888] hover:text-[#333] transition-colors rounded-md hover:bg-[#f6f4eb]">
                  <Paperclip size={16} />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-[#2a303a] text-white p-1.5 rounded-lg hover:bg-[#1f252c] transition-colors shadow-sm"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {mainTab === "risks" && (
          <div className="space-y-5">
            {/* Executive Summary */}
            <div className="bg-white rounded-xl border border-[#e6e2da] p-4 shadow-sm">
              <h3 className="font-sans text-[11px] font-bold tracking-[0.06em] uppercase text-[#333] mb-1.5 flex items-center gap-2">
                <AlertTriangle
                  size={14}
                  className={highRiskCount > 0 ? "text-[#b91c1c]" : "text-[#449156]"}
                />
                Compliance Summary
              </h3>
              <p className="font-sans text-[12.5px] text-[#555] leading-relaxed">
                {highRiskCount > 0
                  ? `Identified ${highRiskCount} high risk and ${mediumRiskCount} medium risk segments. Immediate revision of terms is recommended.`
                  : "All clauses appear standard. No major compliance risks found."}
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-1.5">
              {["All", "High", "Medium", "Low"].map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-3 py-1.5 rounded-full font-sans text-[11px] font-bold tracking-wide transition-all border ${
                    riskFilter === level
                      ? "bg-[#252b33] text-white border-transparent"
                      : "bg-white text-[#666] border-[#d4cfc1] hover:bg-[#f6f4eb]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Risk List */}
            <div className="space-y-3">
              {filteredRisks.length > 0 ? (
                filteredRisks.map((finding) => {
                  const isExpanded = expandedRiskId === finding.id;
                  const isHigh = finding.risk === "High";
                  const isMed = finding.risk === "Medium";

                  return (
                    <div
                      key={finding.id}
                      onMouseEnter={() => onFocusClause(finding.id)}
                      onMouseLeave={() => onFocusClause(null)}
                      className={`bg-white rounded-xl border transition-all duration-200 ${
                        isExpanded ? "ring-1 ring-[#d4cfc1] shadow-sm" : ""
                      } ${
                        isHigh
                          ? "border-[#f0c2c2] bg-[#fffaf9]"
                          : "border-[#e6e2da]"
                      } ${focusedClauseId === finding.id ? "scale-[1.01]" : ""}`}
                    >
                      <div
                        className="p-4 cursor-pointer flex items-start justify-between gap-2"
                        onClick={() => handleRiskClick(finding.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-serif text-[14px] font-bold text-[#222]">
                              {finding.title}
                            </span>
                            {isHigh && (
                              <span className="flex items-center gap-0.5 font-sans text-[9px] font-extrabold tracking-wider text-[#b91c1c] uppercase bg-[#fbebe9] px-1.5 py-0.5 rounded border border-[#f0c2c2]">
                                High
                              </span>
                            )}
                            {isMed && (
                              <span className="font-sans text-[9px] font-extrabold tracking-wider text-[#b47a26] uppercase bg-[#faf3e8] px-1.5 py-0.5 rounded border border-[#ebd6bc]">
                                Medium
                              </span>
                            )}
                            {!isHigh && !isMed && (
                              <span className="font-sans text-[9px] font-extrabold tracking-wider text-[#449156] uppercase bg-[#ebf5ec] px-1.5 py-0.5 rounded border border-[#bcebd3]">
                                Low
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-[12.5px] italic text-[#555] leading-relaxed line-clamp-2">
                            "{finding.text}"
                          </p>
                        </div>
                        <button className="text-[#888] hover:text-[#333] transition-colors mt-0.5">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[#e6e2da] p-4 bg-[#fdfaf5] rounded-b-xl space-y-4">
                          <div>
                            <h4 className="font-sans text-[9.5px] font-bold tracking-widest text-[#b91c1c] uppercase mb-1">
                              Explanation
                            </h4>
                            <p className="font-sans text-[12px] text-[#555] leading-relaxed">
                              {finding.explanation}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-sans text-[9.5px] font-bold tracking-widest text-[#449156] uppercase mb-1">
                              Suggested Fix
                            </h4>
                            <p className="font-sans text-[12px] text-[#555] leading-relaxed">
                              {finding.suggestion}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInsert(finding.id, finding.suggestion)}
                              disabled={insertedClauses.has(finding.id)}
                              className={`flex-1 rounded-md py-2 font-sans text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                                insertedClauses.has(finding.id)
                                  ? "bg-[#e5e5e5] text-[#888] cursor-default"
                                  : "bg-[#252b33] text-white hover:bg-[#1a1f26] shadow-sm"
                              }`}
                            >
                              {insertedClauses.has(finding.id) ? (
                                <>
                                  <Check size={12} /> Applied
                                </>
                              ) : (
                                <>
                                  Apply Fix
                                </>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAskAIAboutRisk(finding);
                              }}
                              className="px-3 rounded-md border border-[#d4cfc1] bg-white hover:bg-[#f6f4eb] text-[#333] font-sans text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
                            >
                              <MessageSquare size={12} /> Ask AI
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 px-4 bg-white/20 border border-dashed border-[#d4cfc1] rounded-2xl">
                  <p className="font-sans text-[12px] text-[#666]">
                    No compliance flags detected for the selected filter.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {mainTab === "search" && (
          <div className="space-y-5">
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

              {/* Match Navigation Controls */}
              {activeSearchHighlight && activeSearchHighlight.trim().length >= 2 && (
                <div className="flex items-center justify-between mb-3 bg-[#e6e2da]/40 rounded-lg p-2 border border-[#d4cfc1]/60 font-sans">
                  <span className="text-[11px] font-bold text-[#555] uppercase tracking-wide">
                    {matchCount > 0 ? `${activeMatchIndex + 1} of ${matchCount} matches` : "0 matches in doc"}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handlePrevMatch}
                      disabled={matchCount === 0}
                      className="px-2.5 py-1 rounded bg-white hover:bg-[#f6f4eb] disabled:opacity-40 text-[10.5px] font-sans font-bold transition-all border border-[#d4cfc1] shadow-sm uppercase tracking-wider"
                    >
                      Prev
                    </button>
                    <button
                      onClick={handleNextMatch}
                      disabled={matchCount === 0}
                      className="px-2.5 py-1 rounded bg-white hover:bg-[#f6f4eb] disabled:opacity-40 text-[10.5px] font-sans font-bold transition-all border border-[#d4cfc1] shadow-sm uppercase tracking-wider"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

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

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-[#e0ded6] space-y-4">
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

            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((res) => (
                  <Card key={res.id}>
                    <div
                      className="cursor-pointer"
                      onClick={() => handleSearchResultClick(res.content)}
                    >
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

                      <div className="bg-[#fcfaf5] rounded-[6px] p-3 mb-4 border border-[#fff]/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                        <p className="font-serif text-[12px] text-[#444] leading-[1.6] line-clamp-4">
                          "{res.content}"
                        </p>
                      </div>
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
                  <p className="font-sans text-[12px] font-medium text-[#666] leading-relaxed">
                    No results to display. Type a legal query above to search the vector database!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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
