import { useState, useRef, useEffect, useCallback } from "react";
import type { Clause } from "@/types/document";
import EditorToolbar from "@/features/document-editor/components/EditorToolbar";

const PAGE_HEIGHT = 1344;
const PAGE_PADDING_Y = 120;
const PAGE_PADDING_X = 96;
const PAGE_GAP = 40;
const MAX_CONTENT_HEIGHT = PAGE_HEIGHT - (PAGE_PADDING_Y * 2);

interface DocumentEditorProps {
  clauses: Clause[];
  onAddClause: (title: string, content: string) => void;
  focusedClauseId?: string | null;
}

const EditableBlock = ({ 
  id,
  tag: Tag, 
  initialContent, 
  className, 
  onHeightChange,
  onSave 
}: { 
  id: string;
  tag: any; 
  initialContent: string; 
  className?: string; 
  onHeightChange: (id: string, height: number) => void;
  onSave?: (val: string) => void;
}) => {
  const ref = useRef<HTMLElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerText = initialContent;
      initialized.current = true;
    }
  }, [initialContent]);

  // Use ResizeObserver to track actual DOM height
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        onHeightChange(id, entry.target.getBoundingClientRect().height);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id, onHeightChange]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`${className} outline-none cursor-text focus:bg-[#fcfaf5] hover:bg-black/[0.02] transition-colors rounded p-1 -ml-1`}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        if (onSave) onSave(e.currentTarget.innerText);
      }}
    />
  );
};

export const DocumentEditor = ({ clauses, onAddClause, focusedClauseId }: DocumentEditorProps) => {
  const [drafting, setDrafting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [heights, setHeights] = useState<Record<string, number>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHeightChange = useCallback((id: string, height: number) => {
    setHeights(prev => {
      if (prev[id] === height) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  const handleSave = () => {
    if (newTitle.trim() && newContent.trim()) {
      onAddClause(newTitle.trim(), newContent.trim());
      setNewTitle("");
      setNewContent("");
      setDrafting(false);
    }
  };

  // Scroll to focused clause
  useEffect(() => {
    if (focusedClauseId) {
      const el = document.getElementById(`block-wrapper-clause-${focusedClauseId.replace('c', '')}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedClauseId]);

  // Calculate Layout
  let currentY = 0;
  let currentPage = 0;
  const positions: Record<string, { top: number, page: number }> = {};

  const blocks = [
    { id: 'header-title', tag: 'h1', content: 'Master Service Agreement', className: 'font-serif text-[42px] font-medium text-[#222] leading-tight tracking-[-0.01em]', mb: 16 },
    { id: 'header-proj', tag: 'p', content: 'Project ID: LX-2024-0892', className: 'font-sans text-[11px] font-semibold tracking-[0.12em] text-[#888] uppercase w-max', mb: 40 },
    { id: 'header-divider', isDivider: true, mb: 40 },
    ...clauses.map(c => ({ id: `clause-${c.id}`, isClause: true, clause: c, mb: 40 }))
  ];

  // Measure all standard blocks
  for (const block of blocks) {
    const h = heights[block.id] || (block.isDivider ? 1 : 50);
    
    if (currentY + h > MAX_CONTENT_HEIGHT && currentY > 0) {
      currentPage++;
      currentY = 0;
    }
    
    positions[block.id] = {
      top: currentPage * (PAGE_HEIGHT + PAGE_GAP) + PAGE_PADDING_Y + currentY,
      page: currentPage
    };
    
    currentY += h + block.mb;
  }

  // Measure drafting block
  const draftingId = 'drafting-block';
  const draftingH = heights[draftingId] || 150;
  if (currentY + draftingH > MAX_CONTENT_HEIGHT && currentY > 0) {
    currentPage++;
    currentY = 0;
  }
  positions[draftingId] = {
    top: currentPage * (PAGE_HEIGHT + PAGE_GAP) + PAGE_PADDING_Y + currentY,
    page: currentPage
  };

  const totalPages = currentPage + 1;
  const containerHeight = totalPages * (PAGE_HEIGHT + PAGE_GAP);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#eceae1]/50 overflow-hidden relative">
      <EditorToolbar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-12 relative" ref={containerRef}>
        
        {/* The absolute positioning container */}
        <div className="relative w-[816px]" style={{ height: containerHeight }}>
          
          {/* Page Backgrounds */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div 
                key={i}
                className="w-full bg-[#fdfaf5] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] absolute border border-[#e6e2d6]"
                style={{ 
                  height: PAGE_HEIGHT, 
                  top: i * (PAGE_HEIGHT + PAGE_GAP),
                  left: 0 
                }}
              >
                <div className="absolute bottom-10 left-0 right-0 text-center">
                  <span className="font-sans text-[10px] font-semibold tracking-[0.1em] text-[#888] uppercase">
                    Page {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Absolute Content Blocks */}
          <div className="absolute inset-0 z-10" style={{ paddingLeft: PAGE_PADDING_X, paddingRight: PAGE_PADDING_X }}>
            {blocks.map(block => {
              const pos = positions[block.id] || { top: 0, page: 0 };
              
              if (block.isDivider) {
                return (
                  <div 
                    key={block.id} 
                    className="absolute w-[calc(100%-192px)] h-px bg-[#e6e2d6] transition-all duration-300"
                    style={{ top: pos.top }}
                  />
                );
              }

              if (block.isClause) {
                const c = block.clause!;
                const isFocused = focusedClauseId && parseInt(focusedClauseId.replace('c', '')) === c.id;
                
                return (
                  <div 
                    key={block.id}
                    id={`block-wrapper-${block.id}`}
                    className={`absolute w-[calc(100%-192px)] transition-all duration-300 ease-out group p-3 -ml-3 rounded-[8px] ${
                      isFocused ? "bg-[#f5efd9]" : "bg-transparent focus-within:bg-white focus-within:shadow-[0_1px_4px_rgba(0,0,0,0.04)] focus-within:border focus-within:border-[#e6e2d6]"
                    }`}
                    style={{ top: pos.top - 12 }} // offset for padding
                  >
                    <div ref={(el) => {
                      if (el) {
                        const observer = new ResizeObserver(entries => handleHeightChange(block.id, entries[0].target.getBoundingClientRect().height));
                        observer.observe(el);
                        return () => observer.disconnect();
                      }
                    }}>
                      <EditableBlock 
                        id={`${block.id}-title`}
                        tag="h2"
                        initialContent={c.title}
                        className="font-serif text-[22px] font-semibold text-[#111] mb-4 tracking-tight"
                        onHeightChange={() => {}} // handled by wrapper
                      />
                      <EditableBlock 
                        id={`${block.id}-content`}
                        tag="p"
                        initialContent={c.content}
                        className="font-serif text-[15.5px] text-[#333] leading-[1.8] tracking-wide"
                        onHeightChange={() => {}}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={block.id} 
                  className="absolute w-[calc(100%-192px)] transition-all duration-300"
                  style={{ top: pos.top }}
                >
                  <EditableBlock 
                    id={block.id}
                    tag={block.tag}
                    initialContent={block.content!}
                    className={block.className}
                    onHeightChange={handleHeightChange}
                  />
                </div>
              );
            })}

            {/* Drafting Block */}
            <div 
              className="absolute w-[calc(100%-192px)] transition-all duration-300"
              style={{ top: positions[draftingId]?.top || 0 }}
            >
              <div ref={(el) => {
                if (el) {
                  const observer = new ResizeObserver(entries => handleHeightChange(draftingId, entries[0].target.getBoundingClientRect().height));
                  observer.observe(el);
                  return () => observer.disconnect();
                }
              }}>
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
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
