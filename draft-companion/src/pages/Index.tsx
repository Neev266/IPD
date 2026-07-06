import Sidebar from "@/components/layout/Sidebar";
import DocumentEditor from "@/features/document-editor/components/DocumentEditor";
import AssistantPanel from "@/features/assistant/components/AssistantPanel";
import AnalysisDashboard from "@/features/ai-analysis/components/AnalysisDashboard";
import UploadProcessingOverlay from "@/features/upload/components/UploadProcessingOverlay";
import NewDraftDialog from "@/features/drafts/components/NewDraftDialog";
import { useState, useEffect, useCallback } from "react";
import { generateMockAnalysis, type AnalyzedClause } from "@/features/ai-analysis/data/mockAnalysis";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { UploadCloud, Settings2, Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/lib/supabase";
import type { AnalysisState, Clause, Draft } from "@/types/document";

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

const initialDrafts: Draft[] = [
  {
    id: "1",
    title: "NDA Draft v2",
    subtitle: "Kely",
    date: "Apr 10",
    clauses: [
      {
        id: 1,
        title: "Clause 1. Confidential Information",
        content:
          "All documents, designs, source code, and strategic materials shared under this Agreement are classified as Confidential Information and must be protected with the highest level of care.",
      },
    ],
  },
  {
    id: "2",
    title: "Master Service Agreement",
    subtitle: "Project ID: L17.2",
    date: "Apr 2",
    clauses: initialClauses,
  },
  {
    id: "3",
    title: "Employment Agreement",
    subtitle: "Standard template",
    date: "Apr 2",
    clauses: [
      {
        id: 1,
        title: "Clause 1. Term of Service",
        content:
          "The Executive agrees to serve the Company on an at-will basis commencing from the effective date. Employment is subject to termination policies of the Company.",
      },
    ],
  },
];

/* ─── Page Component ─── */
const Index = () => {
  const { signOut, user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [activeDraft, setActiveDraft] = useState<string>(() => {
    const saved = localStorage.getItem("legal_active_draft");
    return saved || "2";
  });
  const [isNewDraftOpen, setIsNewDraftOpen] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysisData, setAnalysisData] = useState<AnalyzedClause[]>([]);
  const [focusedClauseId, setFocusedClauseId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showAnalyzingOverlay, setShowAnalyzingOverlay] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedActive = localStorage.getItem("legal_active_draft");
    if (savedActive) setActiveDraft(savedActive);
  }, []);

  useEffect(() => {
    localStorage.setItem("legal_active_draft", activeDraft);
  }, [activeDraft]);

  useEffect(() => {
    const syncDraftsFromSupabase = async () => {
      if (!user?.id) return;
      try {
        const remoteDrafts = await supabaseService.loadDrafts(user.id);
        if (remoteDrafts.length > 0) {
          setDrafts(remoteDrafts);
          if (!activeDraft || !remoteDrafts.some((draft) => draft.id === activeDraft)) {
            setActiveDraft(remoteDrafts[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load drafts from Supabase", error);
      }
    };

    syncDraftsFromSupabase();
  }, [user?.id]);

  useEffect(() => {
    const persistDraftsToSupabase = async () => {
      if (!user?.id || drafts.length === 0) return;
      try {
        await supabaseService.saveDrafts(user.id, drafts);
      } catch (error) {
        console.error("Failed to persist drafts to Supabase", error);
      }
    };

    persistDraftsToSupabase();
  }, [drafts, user?.id]);

  // Derive active draft details
  const activeDraftObj = drafts.find((d) => d.id === activeDraft) || drafts[0];

  // 1. Sync drafts with active Cloudinary files on mount
  useEffect(() => {
    const syncCloudinaryDrafts = async () => {
      setIsSyncing(true);
      try {
        console.log("DEBUG: Syncing drafts with Cloudinary folder 'Documents'...");
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch("http://localhost:5000/api/documents", { headers });
        if (!response.ok) throw new Error("Failed to list remote documents");
        
        const data = await response.json();
        const remoteFiles = data.resources || [];
        console.log("DEBUG: Active remote files listed from Cloudinary:", remoteFiles);

        setDrafts((prevDrafts) => {
          // Identify drafts that exist locally but have been deleted on Cloudinary (Vice Versa Sync)
          const cleanedDrafts = prevDrafts.filter((localDraft) => {
            if (!localDraft.cloudinaryPublicId) return true; // keep mock / blank drafts
            const existsOnRemote = remoteFiles.some(
              (remote: any) => remote.cloudinaryPublicId === localDraft.cloudinaryPublicId
            );
            return existsOnRemote;
          });

          // Identify files that exist on Cloudinary but are missing locally
          const newDraftsToAdd: Draft[] = [];
          remoteFiles.forEach((remote: any) => {
            const alreadyExists = cleanedDrafts.some(
              (localDraft) => localDraft.cloudinaryPublicId === remote.cloudinaryPublicId
            );
            if (!alreadyExists) {
              newDraftsToAdd.push({
                id: remote.cloudinaryPublicId, // Use public_id as unique ID
                title: remote.fileName,
                subtitle: (() => {
                  const ext = remote.fileName.split(".").pop()?.toUpperCase() || "File";
                  return `Imported ${ext}`;
                })(),
                date: remote.date,
                rawHtml: "", // Empty rawHtml triggers on-demand parsing when selected
                cloudinaryUrl: remote.cloudinaryUrl,
                cloudinaryPublicId: remote.cloudinaryPublicId,
                clauses: [],
              });
            }
          });

          return [...cleanedDrafts, ...newDraftsToAdd];
        });
      } catch (err) {
        console.error("DEBUG: Cloudinary synchronization failed:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncCloudinaryDrafts();
  }, []);

  // 2. Load and parse content on-demand for newly synced Cloudinary documents
  useEffect(() => {
    const activeObj = drafts.find((d) => d.id === activeDraft);
    if (!activeObj || !activeObj.cloudinaryUrl || activeObj.rawHtml !== "") return;

    let isMounted = true;

    const parseSynchedDocument = async () => {
      console.log(`DEBUG: On-demand parsing started for remote document: ${activeObj.title}`);
      setAnalysisState("analyzing");

      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("http://localhost:5000/api/upload/parse-url", {
          method: "POST",
          headers,
          body: JSON.stringify({
            url: activeObj.cloudinaryUrl,
            fileName: activeObj.title + (activeObj.subtitle.includes("PDF") ? ".pdf" : ".docx"),
          }),
        });

        if (!response.ok) throw new Error("Failed to parse remote document");
        const data = await response.json();

        if (isMounted) {
          setDrafts((prev) =>
            prev.map((d) => (d.id === activeDraft ? { ...d, rawHtml: data.html } : d))
          );
          console.log(`DEBUG: On-demand parsing succeeded and saved for: ${activeObj.title}`);
        }
      } catch (err: any) {
        console.error("DEBUG: On-demand parsing failed:", err);
        if (isMounted) {
          setDrafts((prev) =>
            prev.map((d) =>
              d.id === activeDraft
                ? {
                    ...d,
                    rawHtml: `<p style="color:red;font-size:14px;padding:24px;text-align:center;">Error: Failed to parse document content from Cloudinary. Please check if your backend is running.<br><span style="font-size:11px;color:#888;">${err.message}</span></p>`,
                  }
                : d
            )
          );
        }
      } finally {
        if (isMounted) {
          setAnalysisState("idle");
        }
      }
    };

    parseSynchedDocument();

    return () => {
      isMounted = false;
    };
  }, [activeDraft, activeDraftObj?.rawHtml, activeDraftObj?.cloudinaryUrl]);
  const clauses = activeDraftObj?.clauses || [];

  // When "ANALYZE DOCUMENT" is clicked → show overlay → then open panel
  const handleAnalyzeClick = useCallback(() => {
    setShowAnalyzingOverlay(true);
  }, []);

  const handleAnalyzingDone = useCallback(() => {
    setShowAnalyzingOverlay(false);
    setIsPanelOpen(true);
  }, []);

  const handleStartUpload = () => {
    setAnalysisState("analyzing");
  };

  const handleAnalysisComplete = () => {
    setAnalysisData(generateMockAnalysis());
    setAnalysisState("results");
  };

  const handleInsertClause = useCallback((text: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === activeDraft) {
          const currentClauses = d.clauses || [];
          const nextId = currentClauses.length + 1;
          return {
            ...d,
            clauses: [
              ...currentClauses,
              { id: nextId, title: `Clause ${nextId}. Inserted Clause`, content: text },
            ],
          };
        }
        return d;
      })
    );
  }, [activeDraft]);

  const handleAddClause = useCallback((title: string, content: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === activeDraft) {
          const currentClauses = d.clauses || [];
          const nextId = currentClauses.length + 1;
          return {
            ...d,
            clauses: [
              ...currentClauses,
              { id: nextId, title: `Clause ${nextId}. ${title}`, content },
            ],
          };
        }
        return d;
      })
    );
  }, [activeDraft]);

  const handleCreateBlank = () => {
    const newId = String(Date.now()); // Use unique timestamp IDs
    const newDraft: Draft = {
      id: newId,
      title: `New Blank Draft`,
      subtitle: "Created empty",
      date: "Just Now",
      clauses: [
        {
          id: 1,
          title: "Clause 1. Blank Slate",
          content: "Click below to start writing and drafting clauses for this contract.",
        },
      ],
    };
    setDrafts((prev) => [...prev, newDraft]);
    setActiveDraft(newId);
  };

  const handleCreateFromImport = (fileName: string, parsedHtml: string, cloudinaryUrl: string, cloudinaryPublicId?: string) => {
    const newId = String(Date.now()); // Use unique timestamp IDs
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const newDraft: Draft = {
      id: newId,
      title: cleanName,
      subtitle: (() => {
        const ext = fileName.split(".").pop()?.toUpperCase() || "File";
        return `Imported ${ext}`;
      })(),
      date: "Just Now",
      rawHtml: parsedHtml,
      cloudinaryUrl: cloudinaryUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      clauses: [], // Empty clauses because it uses rawHtml rendering
    };
    setDrafts((prev) => [...prev, newDraft]);
    setActiveDraft(newId);
  };

  const handleDeleteDraft = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting draft when deleting
    
    const draftToDelete = drafts.find((d) => d.id === id);
    if (!draftToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${draftToDelete.title}"?`);
    if (!confirmDelete) return;

    // 1. Delete from Cloudinary if it has a public ID
    if (draftToDelete.cloudinaryPublicId) {
      try {
        console.log(`Deleting remote asset from Cloudinary: ${draftToDelete.cloudinaryPublicId}`);
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          const token = session?.access_token;
          const headers: HeadersInit = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          
          fetch(`http://localhost:5000/api/documents?publicId=${encodeURIComponent(draftToDelete.cloudinaryPublicId!)}`, {
            method: "DELETE",
            headers,
          })
            .then((res) => res.json())
            .then((data) => console.log("Cloudinary asset deletion response:", data))
            .catch((err) => console.error("Failed to delete asset from Cloudinary:", err));
        }).catch((err) => {
          console.error("Auth session retrieval failed for deletion:", err);
        });
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }

    // 2. Remove from local list
    const updatedDrafts = drafts.filter((d) => d.id !== id);
    setDrafts(updatedDrafts);

    // 3. Update active draft if deleting the active one
    if (activeDraft === id) {
      if (updatedDrafts.length > 0) {
        setActiveDraft(updatedDrafts[0].id);
      } else {
        const defaultId = "1";
        const newDraft: Draft = {
          id: defaultId,
          title: "New Draft",
          subtitle: "Created empty",
          date: "Just Now",
          clauses: [
            {
              id: 1,
              title: "Clause 1. Scope",
              content: "Start writing here...",
            },
          ],
        };
        setDrafts([newDraft]);
        setActiveDraft(defaultId);
      }
    }
  }, [drafts, activeDraft]);

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
        <Sidebar
          drafts={drafts}
          activeDraft={activeDraft}
          onSelectDraft={(id) => {
            setActiveDraft(id);
            setAnalysisState("idle");
            setFocusedClauseId(null);
          }}
          onNewDraftClick={() => setIsNewDraftOpen(true)}
          onDeleteDraft={handleDeleteDraft}
          onSignOut={() => signOut()}
          userEmail={user?.email}
        />

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
            {/* key={activeDraft} forces editor remount to reset pages correctly */}
            <DocumentEditor
              key={activeDraft}
              clauses={clauses}
              initialHtml={activeDraftObj?.rawHtml}
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

      {/* New Draft Creation Modal */}
      <NewDraftDialog
        isOpen={isNewDraftOpen}
        onClose={() => setIsNewDraftOpen(false)}
        onCreateBlank={handleCreateBlank}
        onCreateFromImport={handleCreateFromImport}
      />
    </div>
  );
};

export default Index;

