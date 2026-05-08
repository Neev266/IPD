import Sidebar from "@/components/Sidebar";
import DocumentEditor from "@/components/DocumentEditor";
import AssistantPanel from "@/components/AssistantPanel";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import UploadProcessingOverlay from "@/components/UploadProcessingOverlay";
import { useState, useEffect, useCallback } from "react";
import { generateMockAnalysis, AnalyzedClause } from "@/data/mockAnalysis";
import { UploadCloud, Settings2, Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type AnalysisState = "idle" | "ready" | "analyzing" | "results";

export interface Clause {
  id: number;
  title: string;
  content: string;
}

/* ─── Analyzing Overlay Modal ─── */
const analyzeSteps = [
  "Scanning document structure…",
  "Identifying legal clauses…",
  "Running compliance checks…",
  "Preparing AI assistant…",
];

const AnalyzingOverlay = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, analyzeSteps.length - 1));
    }, 650);

    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(p + 1.6, 100);
      });
    }, 35);

    const doneTimer = setTimeout(onDone, 2800);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <motion.div
      key="analyzing-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#ebe9e1]/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="bg-white rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.10)] border border-[#e6e2da] p-10 flex flex-col items-center w-[440px]"
      >
        {/* Spinning ring */}
        <div className="relative w-[72px] h-[72px] mb-7 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#e6e2d8]" />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent"
            style={{
              borderTopColor: "#2a303a",
              borderRightColor: "#2a303a",
              animation: "analyze-spin 1s linear infinite",
            }}
          />
          <Sparkles
            size={22}
            className="text-[#2a303a]"
            style={{ animation: "analyze-pulse 1.8s ease-in-out infinite" }}
          />
        </div>

        {/* Title */}
        <h2 className="font-serif text-[24px] font-medium text-[#222] mb-2">
          Analyzing Document
        </h2>
        <p className="font-sans text-[11px] tracking-[0.12em] font-semibold text-[#999] uppercase mb-7">
          Please wait a moment
        </p>

        {/* Scrolling step label */}
        <div className="h-[22px] overflow-hidden w-full relative mb-6">
          <div
            className="flex flex-col transition-transform duration-500 ease-out absolute w-full"
            style={{ transform: `translateY(-${step * 22}px)` }}
          >
            {analyzeSteps.map((s, i) => (
              <span
                key={i}
                className={`h-[22px] flex items-center justify-center text-[13px] font-sans tracking-wide transition-colors duration-300 ${
                  i === step ? "text-[#444] font-semibold" : "text-[#bbb]"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full h-[5px] bg-[#f0eee9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #2a303a 0%, #4a5568 100%)",
              }}
            />
          </div>
          <p className="font-sans text-[10px] text-[#aaa] mt-2.5 text-right tabular-nums tracking-wider">
            {Math.round(progress)}%
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Data ─── */
const initialClauses: Clause[] = [
  {
    id: 1,
    title: "Clause 1. Scope of Services",
    content:
      'The Service Provider shall perform the professional legal consultancy services as detailed in EXHIBIT A (the "Services"). AI Services shall be conducted with the standard of care, skill and diligence normally provided by a professional person in the performance of similar services. Any deviation from the agreed scope must be documented via a written amendment signed by both parties.',
  },
  {
    id: 2,
    title: "Clause 2. Compensation & Payment",
    content:
      "In consideration for the performance of the Services the Client shall pay the Service Provider a fixed fee of fifty thousand dollars ($50,000.00). Payments shall be made in four (4) equal instalments of twelve thousand five hundred dollars ($12,500.00), upon completion of the milestones defined in schedule B. Net. 30 payment terms",
  },
];

const draftsData = [
  { id: "1", title: "NDA Draft v2", subtitle: "Kely", date: "Apr 10" },
  { id: "2", title: "Master Service Agreement", subtitle: "Project ID: L17.2", date: "Apr 2" },
  { id: "3", title: "Employment Agreement", subtitle: "Standard template", date: "Apr 2" },
];

/* ─── Page Component ─── */
const Index = () => {
  const [activeDraft, setActiveDraft] = useState("2");
  const [clauses, setClauses] = useState<Clause[]>(initialClauses);
  const [drafts] = useState(draftsData);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysisData, setAnalysisData] = useState<AnalyzedClause[]>([]);
  const [focusedClauseId, setFocusedClauseId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showAnalyzingOverlay, setShowAnalyzingOverlay] = useState(false);

  // When "ANALYZE DOCUMENT" is clicked → show overlay → then open panel
  const handleAnalyzeClick = useCallback(() => {
    setShowAnalyzingOverlay(true);
  }, []);

  const handleAnalyzingDone = useCallback(() => {
    setShowAnalyzingOverlay(false);
    setIsPanelOpen(true);
  }, []);

  const handleStartUpload = () => {
    // Transition from ready to uploading/analyzing
    setAnalysisState("analyzing");
  };

  const handleAnalysisComplete = () => {
    setAnalysisData(generateMockAnalysis());
    setAnalysisState("results");
  };

  const handleInsertClause = (text: string) => {
    const nextId = clauses.length + 1;
    setClauses((prev) => [
      ...prev,
      { id: nextId, title: `Clause ${nextId}. Inserted Clause`, content: text },
    ]);
  };

  const handleAddClause = (title: string, content: string) => {
    const nextId = clauses.length + 1;
    setClauses((prev) => [...prev, { id: nextId, title: `Clause ${nextId}. ${title}`, content }]);
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden font-sans relative bg-[#eceae1]"
      style={{
        backgroundImage: "url('/images/bg-legal.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#ebe9e1]/40 mix-blend-multiply" />

      {analysisState === "ready" && (
        <div className="absolute inset-0 z-40 bg-[#ebe9e1]/40 backdrop-blur-sm flex items-center justify-center transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl border border-[#e6e2da] p-10 flex flex-col items-center w-[440px]">
            <div className="w-16 h-16 bg-[#f3f0e8] rounded-full flex items-center justify-center mb-6">
              <UploadCloud size={28} className="text-[#555]" />
            </div>
            <h2 className="font-serif text-[24px] font-medium text-[#222] mb-3">Upload Contract</h2>
            <p className="font-sans text-[13px] text-[#666] text-center mb-8 px-4 leading-relaxed">
              Upload a valid document to begin the AI risk analysis and clause extraction process.
            </p>
            <button
              onClick={handleStartUpload}
              className="w-full bg-[#2a303a] text-white rounded-lg py-3.5 font-sans text-[13px] font-semibold tracking-wide hover:bg-[#1f252c] transition-colors shadow-sm"
            >
              BROWSE FILES
            </button>
            <button
              onClick={() => setAnalysisState("idle")}
              className="mt-4 font-sans text-[12px] font-medium text-[#888] hover:text-[#333] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {analysisState === "analyzing" && (
        <UploadProcessingOverlay onComplete={handleAnalysisComplete} />
      )}

      {/* ── Analyzing overlay popup ── */}
      <AnimatePresence>
        {showAnalyzingOverlay && (
          <AnalyzingOverlay onDone={handleAnalyzingDone} />
        )}
      </AnimatePresence>

      <div className="relative flex w-full h-full z-10 transition-opacity duration-300">
        <Sidebar drafts={drafts} activeDraft={activeDraft} onSelectDraft={(id) => {
          setActiveDraft(id);
          setAnalysisState("idle");
          setFocusedClauseId(null);
        }} />

        <div className="flex-1 relative flex overflow-hidden">
          {/* Floating Analyze Button (below toolbar) */}
          <div className="absolute top-20 right-8 z-20 flex items-center gap-3">
            <AnimatePresence>
              {!isPanelOpen && !showAnalyzingOverlay && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={handleAnalyzeClick}
                    className="bg-[#1a202c] text-white px-5 py-2.5 rounded-[8px] font-sans text-[13px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-[#2a303c] transition-all flex items-center gap-2 border border-[rgba(255,255,255,0.1)] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Settings2 size={16} className="relative z-10" />
                    <span className="relative z-10">ANALYZE DOCUMENT</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div layout className="flex-1 h-full min-w-0 flex">
            {/* Document Editor permanently visible on left */}
            <DocumentEditor 
              clauses={clauses} 
              onAddClause={handleAddClause} 
              focusedClauseId={focusedClauseId}
            />
          </motion.div>

          <AnimatePresence>
            {isPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: analysisState === "results" ? 400 : 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="h-full flex-shrink-0 relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] overflow-hidden flex"
              >
                {/* Right Panel dynamic swap */}
                {analysisState === "results" ? (
                  <AnalysisDashboard 
                    data={analysisData}
                    onClose={() => {
                      setAnalysisState("idle");
                      setFocusedClauseId(null);
                      setIsPanelOpen(false);
                    }}
                    focusedClauseId={focusedClauseId}
                    onFocusClause={setFocusedClauseId}
                  />
                ) : (
                  <AssistantPanel 
                    onInsertClause={handleInsertClause} 
                    onAnalyze={() => setAnalysisState("ready")}
                    isAnalyzing={analysisState === "analyzing" || analysisState === "ready"}
                    onClose={() => setIsPanelOpen(false)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;

