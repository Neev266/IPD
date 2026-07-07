import { useState, useRef, useEffect, useCallback } from "react";
import type { Clause } from "@/types/document";
import EditorToolbar from "@/features/document-editor/components/EditorToolbar";

// US Letter paper: 8.5" × 11" at 96 DPI
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const MARGIN_TOP = 96;
const MARGIN_BOTTOM = 96;
const MARGIN_LEFT = 96;
const MARGIN_RIGHT = 96;
const PAGE_GAP = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

// ─── Unique page ID generator ───
let _pageIdSeed = 0;
function createPageId() {
  return `pg_${Date.now()}_${++_pageIdSeed}`;
}

interface PageData {
  id: string;
  html: string;
}

function buildClausesHtml(clauses: Clause[]): string {
  let html = `<h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">Master Service Agreement</h1>`;
  html += `<p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Project ID: LX-2024-0892</p>`;
  html += `<hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />`;

  clauses.forEach((c) => {
    html += `<h2 id="clause-${c.id}-title" style="font-size:18px;font-weight:700;color:#111;margin-bottom:6px">${c.title}</h2>`;
    html += `<p id="clause-${c.id}-content" style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">${c.content}</p>`;
  });

  return html;
}

// ─── Individual Page Component ───
const PageView = ({
  page,
  pageIndex,
  onOverflow,
  onDeletePage,
  registerRef,
}: {
  page: PageData;
  pageIndex: number;
  onOverflow: (pageIndex: number, overflowHtml: string) => void;
  onDeletePage: (pageIndex: number) => void;
  registerRef: (pageIndex: number, el: HTMLDivElement | null) => void;
}) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const isChecking = useRef(false);

  // Set innerHTML ONCE on mount
  useEffect(() => {
    if (elRef.current) {
      elRef.current.innerHTML = page.html;
      // Check overflow after content is painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => detectOverflow());
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only on mount

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      elRef.current = el;
      registerRef(pageIndex, el);
    },
    [pageIndex, registerRef]
  );

  // ── Overflow detection ──
  // Finds any child elements whose bottom exceeds CONTENT_HEIGHT,
  // removes them from this page, and passes them to the parent.
  const detectOverflow = useCallback(() => {
    const el = elRef.current;
    if (!el || isChecking.current) return;
    isChecking.current = true;

    if (el.scrollHeight > CONTENT_HEIGHT + 4) {
      const children = Array.from(el.children) as HTMLElement[];
      const overflow: HTMLElement[] = [];

      // Walk backwards to find every element that exceeds the page
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child.offsetTop + child.offsetHeight > CONTENT_HEIGHT) {
          overflow.unshift(child);
        } else {
          break;
        }
      }

      if (overflow.length > 0) {
        const tmp = document.createElement("div");
        overflow.forEach((node) => {
          tmp.appendChild(node.cloneNode(true));
          el.removeChild(node);
        });
        isChecking.current = false;
        onOverflow(pageIndex, tmp.innerHTML);
        return;
      }
    }

    isChecking.current = false;
  }, [pageIndex, onOverflow]);

  const handleInput = useCallback(() => {
    requestAnimationFrame(() => detectOverflow());
  }, [detectOverflow]);

  // Check if the page is effectively empty
  const isPageEmpty = useCallback(() => {
    const el = elRef.current;
    if (!el) return true;
    const text = el.innerText.replace(/\n/g, "").trim();
    return text.length === 0;
  }, []);

  // Check if cursor is at the very start of the page
  const isCursorAtStart = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;

    const el = elRef.current;
    if (!el) return false;

    // Cursor is at start if offset is 0 and the container is
    // either the editable root or its first child
    if (range.startOffset !== 0) return false;
    let node: Node | null = range.startContainer;
    while (node && node !== el) {
      if (node.previousSibling) return false;
      node = node.parentNode;
    }
    return true;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "    ");
        return;
      }
      if (e.key === "Enter") {
        // Double-RAF so the new line is actually in the DOM
        requestAnimationFrame(() =>
          requestAnimationFrame(() => detectOverflow())
        );
      }
      // Backspace on an empty non-first page → delete the page
      if (e.key === "Backspace" && pageIndex > 0) {
        if (isPageEmpty() || (isCursorAtStart() && isPageEmpty())) {
          e.preventDefault();
          onDeletePage(pageIndex);
        }
      }
    },
    [detectOverflow, pageIndex, isPageEmpty, isCursorAtStart, onDeletePage]
  );

  const handlePaste = useCallback(() => {
    setTimeout(() => detectOverflow(), 80);
  }, [detectOverflow]);

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        marginBottom: PAGE_GAP,
      }}
    >
      {/* Paper background */}
      <div className="absolute inset-0 bg-[#fdfaf5] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-[#e6e2d6] pointer-events-none">
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <span className="font-sans text-[10px] font-semibold tracking-[0.1em] text-[#aaa] uppercase">
            Page {pageIndex + 1}
          </span>
        </div>
      </div>

      {/* Editable content area — height is FIXED, overflow hidden */}
      <div
        ref={setRef}
        contentEditable
        suppressContentEditableWarning
        className="absolute outline-none legal-editor z-10"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{
          top: MARGIN_TOP,
          left: MARGIN_LEFT,
          width: CONTENT_WIDTH,
          height: CONTENT_HEIGHT,
          overflow: "hidden",
        }}
      />
    </div>
  );
};

// ─── Main Editor ───
export const DocumentEditor = ({
  clauses,
  onAddClause,
  focusedClauseId,
  initialHtml,
  onChange,
  onSave,
  isSaving,
}: any) => {
  const [drafting, setDrafting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Build pages with initial content from clauses or raw HTML —
  // this runs on FIRST render so the first page already has HTML
  const [pages, setPages] = useState<PageData[]>(() => [
    { id: createPageId(), html: initialHtml || buildClausesHtml(clauses) },
  ]);

  const pageElRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevClausesLen = useRef(clauses.length);

  const registerRef = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      pageElRefs.current[index] = el;
    },
    []
  );

  // ── Overflow check callable from parent (for AI inserts) ──
  const triggerOverflowCheck = useCallback(
    (pageIndex: number) => {
      const el = pageElRefs.current[pageIndex];
      if (!el) return;

      if (el.scrollHeight > CONTENT_HEIGHT + 4) {
        const children = Array.from(el.children) as HTMLElement[];
        const overflow: HTMLElement[] = [];

        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (child.offsetTop + child.offsetHeight > CONTENT_HEIGHT) {
            overflow.unshift(child);
          } else {
            break;
          }
        }

        if (overflow.length > 0) {
          const tmp = document.createElement("div");
          overflow.forEach((node) => {
            tmp.appendChild(node.cloneNode(true));
            el.removeChild(node);
          });
          const overflowHtml = tmp.innerHTML;

          // Create a new page with the overflow
          setPages((prev) => [
            ...prev,
            { id: createPageId(), html: overflowHtml },
          ]);

          // After new page mounts, check if IT also overflows (chain reaction)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              triggerOverflowCheck(pageIndex + 1);
            });
          });
        }
      }
    },
    []
  );

  // ── Append new AI-inserted clauses to the last page ──
  useEffect(() => {
    if (clauses.length > prevClausesLen.current) {
      const added = clauses.slice(prevClausesLen.current);
      prevClausesLen.current = clauses.length;

      let appendHtml = "";
      added.forEach((c: any) => {
        appendHtml += `<h2 id="clause-${c.id}-title" style="font-size:18px;font-weight:700;color:#111;margin-bottom:6px">${c.title}</h2>`;
        appendHtml += `<p id="clause-${c.id}-content" style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">${c.content}</p>`;
      });

      // Directly append to the last page's DOM
      const lastIdx = pages.length - 1;
      const lastEl = pageElRefs.current[lastIdx];
      if (lastEl) {
        lastEl.insertAdjacentHTML("beforeend", appendHtml);

        // Auto-detect overflow after the DOM paints
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            triggerOverflowCheck(lastIdx);
          });
        });
      }
    }
  }, [clauses, pages.length]);

  // ── Handle overflow from a page ──
  const handleOverflow = useCallback(
    (fromIndex: number, overflowHtml: string) => {
      const nextIndex = fromIndex + 1;
      const nextEl = pageElRefs.current[nextIndex];

      if (nextEl) {
        // Prepend overflow HTML into existing next page
        nextEl.insertAdjacentHTML("afterbegin", overflowHtml);
      } else {
        // Create a brand-new page with the overflow content
        setPages((prev) => [
          ...prev,
          { id: createPageId(), html: overflowHtml },
        ]);
      }

      // Move cursor to the start of the next page
      requestAnimationFrame(() => {
        const target = pageElRefs.current[nextIndex];
        if (target) {
          target.focus();
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.setStart(target.firstChild || target, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
    },
    []
  );

  // ── Handle page deletion (Backspace on empty non-first page) ──
  const handleDeletePage = useCallback(
    (pageIndex: number) => {
      if (pageIndex <= 0) return; // never delete the first page

      // Grab any remaining content from the page being deleted
      const deletedEl = pageElRefs.current[pageIndex];
      const leftoverHtml = deletedEl ? deletedEl.innerHTML.trim() : "";

      // If there's leftover content, append it to the previous page
      if (leftoverHtml && leftoverHtml !== "<br>") {
        const prevEl = pageElRefs.current[pageIndex - 1];
        if (prevEl) {
          prevEl.insertAdjacentHTML("beforeend", leftoverHtml);
        }
      }

      // Remove the page from state
      setPages((prev) => prev.filter((_, i) => i !== pageIndex));

      // Focus cursor at the end of the previous page
      requestAnimationFrame(() => {
        const prevEl = pageElRefs.current[pageIndex - 1];
        if (prevEl) {
          prevEl.focus();
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(prevEl);
            range.collapse(false); // collapse to end
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
    },
    []
  );

  // ── Scroll to focused clause ──
  useEffect(() => {
    if (focusedClauseId) {
      const el = document.getElementById(
        `clause-${focusedClauseId.replace("c", "")}-title`
      );
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#eceae1]/50 overflow-hidden relative">
      <EditorToolbar onSave={onSave} isSaving={isSaving} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-12 relative">
        {/* ── Pages ── */}
        {pages.map((page, i) => (
          <PageView
            key={page.id}
            page={page}
            pageIndex={i}
            onOverflow={handleOverflow}
            onDeletePage={handleDeletePage}
            registerRef={registerRef}
          />
        ))}

        {/* ── Drafting Block ── */}
        <div
          style={{
            width: PAGE_WIDTH,
            paddingLeft: MARGIN_LEFT,
            paddingRight: MARGIN_RIGHT,
          }}
          className="mt-4 mb-32 z-20 box-border"
        >
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
                  onClick={() => {
                    setDrafting(false);
                    setNewTitle("");
                    setNewContent("");
                  }}
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
