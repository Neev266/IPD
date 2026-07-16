import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Type, Highlighter, ChevronDown, Download, FileType, FileText as FileTextIcon,
  Undo, Redo, Minus, Plus, Save, Sparkles
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Fonts available in the editor ──
const FONTS = [
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
  { label: "Garamond", value: "Garamond" },
  { label: "Arial", value: "Arial" },
  { label: "Inter", value: "Inter" },
  { label: "Courier New", value: "Courier New" },
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

const COLORS = [
  "#000000", "#333333", "#555555", "#888888",
  "#b91c1c", "#c2410c", "#a16207", "#15803d",
  "#1d4ed8", "#7c3aed", "#be185d", "#0e7490",
];

const HIGHLIGHT_COLORS = [
  "transparent", "#fef08a", "#bbf7d0", "#bfdbfe",
  "#fecaca", "#fed7aa", "#e9d5ff", "#fbcfe8",
];

// ── Helper: Execute formatting command on the contentEditable ──
const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

// ── Toolbar Button ──
const ToolbarButton = ({
  icon: Icon, active = false, label, onClick
}: {
  icon: any; active?: boolean; label?: string; onClick?: () => void;
}) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
    className={`p-1.5 rounded transition-all duration-200 flex items-center justify-center
      ${active ? "bg-[#d4cfc1] text-[#111]" : "text-[#555] hover:bg-[#e6e2da] hover:text-[#222]"}`}
    title={label}
  >
    <Icon size={16} />
  </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-[#d4cfc1] mx-1.5" />;

const EditorToolbar = ({
  onSave,
  isSaving,
  onIngest,
  isIngesting,
}: {
  onSave?: () => void;
  isSaving?: boolean;
  onIngest?: () => void;
  isIngesting?: boolean;
}) => {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isFontOpen, setIsFontOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isHighlightOpen, setIsHighlightOpen] = useState(false);

  const [currentFont, setCurrentFont] = useState("Times New Roman");
  const [currentSize, setCurrentSize] = useState(14);

  // Active formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderlined, setIsUnderlined] = useState(false);

  const downloadRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) setIsDownloadOpen(false);
      if (fontRef.current && !fontRef.current.contains(event.target as Node)) setIsFontOpen(false);
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) setIsSizeOpen(false);
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) setIsColorOpen(false);
      if (highlightRef.current && !highlightRef.current.contains(event.target as Node)) setIsHighlightOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll formatting state from selection
  useEffect(() => {
    const poll = () => {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderlined(document.queryCommandState("underline"));
    };
    document.addEventListener("selectionchange", poll);
    return () => document.removeEventListener("selectionchange", poll);
  }, []);

  // ── Font Family ──
  const applyFont = (font: string) => {
    exec("fontName", font);
    setCurrentFont(font);
    setIsFontOpen(false);
  };

  // ── Font Size (uses inline style via execCommand fontSize hack) ──
  const applySize = (size: number) => {
    // execCommand fontSize only supports 1-7, so we use a workaround
    exec("fontSize", "7"); // Apply max size marker
    // Then find all font[size="7"] and replace with inline style
    const editor = document.querySelector(".legal-editor");
    if (editor) {
      const fontEls = editor.querySelectorAll('font[size="7"]');
      fontEls.forEach((el) => {
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;
        span.innerHTML = el.innerHTML;
        el.replaceWith(span);
      });
    }
    setCurrentSize(size);
    setIsSizeOpen(false);
  };

  const incrementSize = () => {
    const idx = FONT_SIZES.indexOf(currentSize);
    if (idx < FONT_SIZES.length - 1) applySize(FONT_SIZES[idx + 1]);
  };

  const decrementSize = () => {
    const idx = FONT_SIZES.indexOf(currentSize);
    if (idx > 0) applySize(FONT_SIZES[idx - 1]);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-[#e6e2da] px-4 py-2 flex items-center gap-1 shadow-sm shrink-0 flex-wrap">

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={Undo} label="Undo (Ctrl+Z)" onClick={() => exec("undo")} />
        <ToolbarButton icon={Redo} label="Redo (Ctrl+Y)" onClick={() => exec("redo")} />
      </div>

      <ToolbarDivider />

      {/* Font Family Dropdown */}
      <div className="relative" ref={fontRef}>
        <button
          onMouseDown={(e) => { e.preventDefault(); setIsFontOpen(!isFontOpen); }}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[12px] font-sans font-medium text-[#333] hover:bg-[#e6e2da] transition-colors min-w-[110px]"
        >
          <span className="truncate">{currentFont}</span>
          <ChevronDown size={12} className="text-[#888] shrink-0" />
        </button>
        <AnimatePresence>
          {isFontOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[#e6e2da] overflow-hidden py-1 z-50"
            >
              {FONTS.map((f) => (
                <button
                  key={f.value}
                  onMouseDown={(e) => { e.preventDefault(); applyFont(f.value); }}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#f6f4eb] transition-colors ${currentFont === f.value ? "bg-[#f0ede4] font-semibold" : ""}`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ToolbarDivider />

      {/* Font Size */}
      <div className="flex items-center gap-0.5" ref={sizeRef}>
        <button
          onMouseDown={(e) => { e.preventDefault(); decrementSize(); }}
          className="p-1 text-[#666] hover:text-[#111] hover:bg-[#e6e2da] rounded transition-colors"
        >
          <Minus size={12} />
        </button>

        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); setIsSizeOpen(!isSizeOpen); }}
            className="text-[12px] font-sans font-semibold text-[#333] px-2 py-1 min-w-[32px] text-center hover:bg-[#e6e2da] rounded transition-colors"
          >
            {currentSize}
          </button>
          <AnimatePresence>
            {isSizeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-20 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[#e6e2da] overflow-hidden py-1 z-50 max-h-60 overflow-y-auto"
              >
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); applySize(s); }}
                    className={`w-full text-center px-3 py-1.5 text-[13px] hover:bg-[#f6f4eb] transition-colors ${currentSize === s ? "bg-[#f0ede4] font-semibold" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onMouseDown={(e) => { e.preventDefault(); incrementSize(); }}
          className="p-1 text-[#666] hover:text-[#111] hover:bg-[#e6e2da] rounded transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <ToolbarDivider />

      {/* Bold / Italic / Underline */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={Bold} active={isBold} label="Bold (Ctrl+B)" onClick={() => exec("bold")} />
        <ToolbarButton icon={Italic} active={isItalic} label="Italic (Ctrl+I)" onClick={() => exec("italic")} />
        <ToolbarButton icon={Underline} active={isUnderlined} label="Underline (Ctrl+U)" onClick={() => exec("underline")} />
      </div>

      <ToolbarDivider />

      {/* Text Color */}
      <div className="relative" ref={colorRef}>
        <ToolbarButton
          icon={Type}
          label="Text Color"
          onClick={() => setIsColorOpen(!isColorOpen)}
        />
        <AnimatePresence>
          {isColorOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[#e6e2da] p-3 z-50"
            >
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => { e.preventDefault(); exec("foreColor", c); setIsColorOpen(false); }}
                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Highlight Color */}
      <div className="relative" ref={highlightRef}>
        <ToolbarButton
          icon={Highlighter}
          label="Highlight Color"
          onClick={() => setIsHighlightOpen(!isHighlightOpen)}
        />
        <AnimatePresence>
          {isHighlightOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[#e6e2da] p-3 z-50"
            >
              <div className="grid grid-cols-4 gap-2">
                {HIGHLIGHT_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", c); setIsHighlightOpen(false); }}
                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c === "transparent" ? "#fff" : c }}
                    title={c === "transparent" ? "None" : c}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ToolbarDivider />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={AlignLeft} label="Align Left" onClick={() => exec("justifyLeft")} />
        <ToolbarButton icon={AlignCenter} label="Align Center" onClick={() => exec("justifyCenter")} />
        <ToolbarButton icon={AlignRight} label="Align Right" onClick={() => exec("justifyRight")} />
        <ToolbarButton icon={AlignJustify} label="Justify" onClick={() => exec("justifyFull")} />
      </div>

      <ToolbarDivider />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={List} label="Bullet List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => exec("insertOrderedList")} />
      </div>

      <div className="flex-1" />

      {/* Save Button */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`p-2 rounded-full transition-all duration-300 text-[#555] hover:bg-[#1a202c] hover:text-white hover:shadow-md ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSaving ? "Saving..." : "Save Document"}
        >
          <Save size={18} className={isSaving ? "animate-spin" : ""} />
        </button>
      )}

      {/* Index for Semantic Search Button */}
      {onIngest && (
        <button
          onClick={onIngest}
          disabled={isIngesting}
          className={`p-2 rounded-full transition-all duration-300 text-[#555] hover:bg-[#1a202c] hover:text-white hover:shadow-md ${isIngesting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isIngesting ? "Indexing document..." : "Index for Semantic Search"}
        >
          <Sparkles size={18} className={isIngesting ? "animate-spin text-amber-500" : ""} />
        </button>
      )}

      {/* Download Button */}
      <div className="relative" ref={downloadRef}>
        <button
          onClick={() => setIsDownloadOpen(!isDownloadOpen)}
          className={`p-2 rounded-full transition-all duration-300 ${isDownloadOpen ? 'bg-[#1a202c] text-white shadow-md' : 'text-[#555] hover:bg-[#1a202c] hover:text-white hover:shadow-md'}`}
          title="Download Document"
        >
          <Download size={18} />
        </button>

        <AnimatePresence>
          {isDownloadOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[#e6e2da] overflow-hidden py-1 z-50"
            >
              <button className="w-full text-left px-4 py-2.5 hover:bg-[#f6f4eb] flex items-center gap-3 transition-colors group">
                <FileType size={16} className="text-[#888] group-hover:text-[#b91c1c] transition-colors" />
                <span className="font-sans text-[13px] font-medium text-[#333]">Download as PDF</span>
              </button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-[#f6f4eb] flex items-center gap-3 transition-colors group">
                <FileTextIcon size={16} className="text-[#888] group-hover:text-[#2563eb] transition-colors" />
                <span className="font-sans text-[13px] font-medium text-[#333]">Download as DOCX</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EditorToolbar;
