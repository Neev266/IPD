import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Type, Highlighter, Heading1, Heading2, Heading3, Table, FileText, ZoomIn, ZoomOut,
  Undo, Redo, ChevronDown, Download, FileType, FileText as FileTextIcon
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToolbarButton = ({ icon: Icon, active = false, label }: { icon: any, active?: boolean, label?: string }) => (
  <button 
    className={`p-1.5 rounded transition-all duration-200 flex items-center justify-center
      ${active ? "bg-[#d4cfc1] text-[#111]" : "text-[#555] hover:bg-[#e6e2da] hover:text-[#222]"}`}
    title={label}
  >
    <Icon size={16} />
  </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-[#d4cfc1] mx-1.5" />;

const EditorToolbar = () => {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-[#e6e2da] px-6 py-2.5 flex items-center gap-1 shadow-sm shrink-0">
      
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={Undo} label="Undo" />
        <ToolbarButton icon={Redo} label="Redo" />
      </div>
      
      <ToolbarDivider />

      {/* Font Family */}
      <button className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[13px] font-sans font-medium text-[#333] hover:bg-[#e6e2da] transition-colors">
        Inter <ChevronDown size={14} className="text-[#888]" />
      </button>
      
      <ToolbarDivider />

      {/* Font Size */}
      <div className="flex items-center gap-1">
        <span className="text-[13px] font-sans font-medium text-[#333] px-1 w-6 text-center">11</span>
      </div>

      <ToolbarDivider />

      {/* Text Styles */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={Bold} active label="Bold" />
        <ToolbarButton icon={Italic} label="Italic" />
        <ToolbarButton icon={Underline} label="Underline" />
      </div>

      <ToolbarDivider />

      {/* Text Color / Highlight */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={Type} label="Text Color" />
        <ToolbarButton icon={Highlighter} label="Highlight Color" />
      </div>

      <ToolbarDivider />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={AlignLeft} active label="Align Left" />
        <ToolbarButton icon={AlignCenter} label="Align Center" />
        <ToolbarButton icon={AlignRight} label="Align Right" />
        <ToolbarButton icon={AlignJustify} label="Justify" />
      </div>

      <ToolbarDivider />

      {/* Lists & Spacing */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={List} label="Bullet List" />
        <ToolbarButton icon={ListOrdered} label="Numbered List" />
      </div>

      <ToolbarDivider />

      {/* Insert */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={Table} label="Insert Table" />
        <ToolbarButton icon={FileText} label="Insert Clause" />
      </div>

      <ToolbarDivider />

      {/* Zoom */}
      <div className="flex items-center gap-1 px-2">
        <button className="p-1 text-[#666] hover:text-[#111] transition-colors"><ZoomOut size={14} /></button>
        <span className="text-[12px] font-sans font-semibold text-[#444] min-w-[3ch] text-center">100%</span>
        <button className="p-1 text-[#666] hover:text-[#111] transition-colors"><ZoomIn size={14} /></button>
      </div>

      <div className="flex-1" />

      {/* Download Button right section */}
      <div className="relative" ref={dropdownRef}>
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
