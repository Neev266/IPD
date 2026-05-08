import { useState, useRef, useEffect, useMemo } from "react";
import type { Clause } from "@/pages/Index";
import EditorToolbar from "./EditorToolbar";

// US Legal paper: 8.5" × 14" at 96 DPI
const PAGE_WIDTH = 816;   // 8.5 inches
const PAGE_HEIGHT = 1344;  // 14 inches
// Standard legal margins: 1 inch top/bottom, 1 inch left/right
const MARGIN_TOP = 96;
const MARGIN_BOTTOM = 96;
const MARGIN_LEFT = 96;
const MARGIN_RIGHT = 96;
const PAGE_GAP = 40;
// Content area dimensions
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 624px
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 1152px
const DEAD_ZONE = MARGIN_BOTTOM + PAGE_GAP + MARGIN_TOP; // 232px

export const DocumentEditor = ({ clauses, onAddClause, focusedClauseId }: any) => {
  const [drafting, setDrafting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [visualPages, setVisualPages] = useState(1);

  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const prevClausesLen = useRef(0);

  // The Comb Polygon: creates dead zones in the gap between pages
  // The float is only as wide as the LEFT MARGIN so it never displaces text
  const shapePolygon = useMemo(() => {
    let points: string[] = [];
    points.push(`0px 0px`);

    for (let i = 0; i < visualPages; i++) {
      // Top of dead zone: bottom margin of page i
      const deadTop = MARGIN_TOP + i * (CONTENT_HEIGHT + DEAD_ZONE) + CONTENT_HEIGHT;
      // Bottom of dead zone: top margin of page i+1
      const deadBottom = deadTop + DEAD_ZONE;

      // Before the dead zone: shape stays at 0px width (no displacement)
      points.push(`0px ${deadTop}px`);
      // In the dead zone: expand to full page width to block ALL text
      points.push(`${PAGE_WIDTH}px ${deadTop}px`);
      points.push(`${PAGE_WIDTH}px ${deadBottom}px`);
      // After the dead zone: back to 0px width
      points.push(`0px ${deadBottom}px`);
    }

    points.push(`0px ${visualPages * (PAGE_HEIGHT + PAGE_GAP)}px`);
    return `polygon(${points.join(', ')})`;
  }, [visualPages]);

  // Dynamically grow pages when content expands
  useEffect(() => {
    if (!editorRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].target.scrollHeight;
      const requiredPages = Math.max(1, Math.ceil(height / (PAGE_HEIGHT + PAGE_GAP)));
      if (requiredPages > visualPages) {
        setVisualPages(requiredPages);
      }
    });
    observer.observe(editorRef.current);
    return () => observer.disconnect();
  }, [visualPages]);

  // Initial content and AI clause appending
  useEffect(() => {
    if (editorRef.current) {
      if (!initialized.current && clauses.length > 0) {
        initialized.current = true;
        prevClausesLen.current = clauses.length;

        const headerHtml = `
          <h1 style="font-size: 32px; font-weight: 600; color: #111; margin-bottom: 8px; line-height: 1.3;">Master Service Agreement</h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; color: #999; text-transform: uppercase; margin-bottom: 0;">Project ID: LX-2024-0892</p>
          <hr style="border: none; border-top: 1px solid #d8d3c7; margin: 24px 0;" />
        `;

        let html = headerHtml;
        clauses.forEach((c: any) => {
          html += `
            <h2 id="clause-${c.id}-title" style="font-size: 18px; font-weight: 700; color: #111; margin-bottom: 6px;">${c.title}</h2>
            <p id="clause-${c.id}-content" style="font-size: 14px; color: #333; line-height: 1.6; margin-bottom: 20px; text-align: justify;">${c.content}</p>
          `;
        });

        editorRef.current.innerHTML = html;
      }
      else if (initialized.current && clauses.length > prevClausesLen.current) {
        const newClauses = clauses.slice(prevClausesLen.current);
        prevClausesLen.current = clauses.length;

        let appendHtml = "";
        newClauses.forEach((c: any) => {
          appendHtml += `
            <h2 id="clause-${c.id}-title" style="font-size: 18px; font-weight: 700; color: #111; margin-bottom: 6px;">${c.title}</h2>
            <p id="clause-${c.id}-content" style="font-size: 14px; color: #333; line-height: 1.6; margin-bottom: 20px; text-align: justify;">${c.content}</p>
          `;
        });

        editorRef.current.insertAdjacentHTML('beforeend', appendHtml);
      }
    }
  }, [clauses]);

  // Scroll to focused clause
  useEffect(() => {
    if (focusedClauseId) {
      const el = document.getElementById(`clause-${focusedClauseId.replace('c', '')}-title`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedClauseId]);

  const handleSave = () => {
    if (newTitle.trim() && newContent.trim()) {
      onAddClause(newTitle.trim(), newContent.trim());
      setNewTitle("");
      setNewContent("");
      setDrafting(false);
    }
  };

  const totalHeight = visualPages * (PAGE_HEIGHT + PAGE_GAP);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#eceae1]/50 overflow-hidden relative">
      <EditorToolbar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-12 relative">

        <div className="relative" style={{ width: PAGE_WIDTH, minHeight: totalHeight }}>

          {/* Visual Physical Pages (Underlay) */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {Array.from({ length: visualPages }).map((_, i) => (
              <div
                key={i}
                className="bg-[#fdfaf5] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] absolute border border-[#e6e2d6]"
                style={{
                  width: PAGE_WIDTH,
                  height: PAGE_HEIGHT,
                  top: i * (PAGE_HEIGHT + PAGE_GAP),
                  left: 0,
                }}
              >
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <span className="font-sans text-[10px] font-semibold tracking-[0.1em] text-[#aaa] uppercase">
                    Page {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Single continuous native content container */}
          <div className="absolute inset-0 z-10" style={{ width: PAGE_WIDTH, height: totalHeight }}>

            {/* The Comb Float - Blocks text from entering page gaps */}
            <div
              contentEditable={false}
              aria-hidden="true"
              style={{
                float: 'left',
                width: 0,
                height: totalHeight,
                shapeOutside: shapePolygon,
                pointerEvents: 'none',
              }}
            />

            {/* The single continuous contentEditable canvas */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="outline-none legal-editor"
              style={{
                width: PAGE_WIDTH,
                minHeight: totalHeight,
                paddingLeft: MARGIN_LEFT,
                paddingRight: MARGIN_RIGHT,
                paddingTop: MARGIN_TOP,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Drafting Block */}
        <div style={{ width: PAGE_WIDTH, paddingLeft: MARGIN_LEFT, paddingRight: MARGIN_RIGHT }} className="mt-12 mb-32 z-20 box-border">
          {drafting ? (
            <div className="border border-[#e6e2d6] rounded-xl p-6 space-y-4 bg-white/80 backdrop-blur shadow-sm">
              <input
                type="text"
                placeholder="Clause title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full font-serif text-xl font-semibold text-[#111] bg-transparent border-b border-[#e6e2d6] pb-2 outline-none placeholder:text-[#888]"
              />
              <textarea
                placeholder="Write your clause content here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                className="w-full font-serif text-base text-[#333] bg-transparent border border-[#e6e2d6] rounded-lg p-3 outline-none resize-none placeholder:text-[#888] focus:ring-1 focus:ring-[#d4cfc1]"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="bg-[#2a303a] text-white rounded-lg py-2.5 px-6 font-sans text-[13px] font-semibold tracking-wide hover:bg-[#1f252c] transition-colors shadow-sm"
                >
                  Save Clause
                </button>
                <button
                  onClick={() => { setDrafting(false); setNewTitle(""); setNewContent(""); }}
                  className="rounded-lg py-2.5 px-6 font-sans text-[13px] font-semibold text-[#666] hover:bg-[#e6e2d6] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setDrafting(true)}
              className="w-full border-[1.5px] border-dashed border-[#d3ccbf] bg-[#fbf9f4] rounded-lg py-5 px-6 text-center hover:border-[#b5af9f] hover:bg-[#f6f4eb] transition-all cursor-pointer"
            >
              <p className="font-serif text-[15px] text-[#888] italic tracking-wide">
                Click here to begin drafting Clause {clauses.length + 1}...
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
