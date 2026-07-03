import { Lock, FileText, Clock, Settings, ChevronDown, ChevronRight, Users, Trash2 } from "lucide-react";
import { useState } from "react";
import nyayaLogo from "@/assets/nyaya-logo.png";

interface Draft {
  id: string;
  title: string;
  subtitle: string;
  date: string;
}

interface SidebarProps {
  drafts: any[]; // Changed from Draft[] to any[] or we can just import/type it loosely
  activeDraft: string;
  onSelectDraft: (id: string) => void;
  onNewDraftClick?: () => void;
  onDeleteDraft?: (id: string, e: React.MouseEvent) => void;
}

const Sidebar = ({ drafts, activeDraft, onSelectDraft, onNewDraftClick, onDeleteDraft }: SidebarProps) => {
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <div className="w-[260px] min-w-[260px] bg-[#e6e2da]/20 flex flex-col h-full border-r border-[#d4cfc1]/60">
      <div className="p-5 pt-8">
        <button
          onClick={onNewDraftClick}
          className="w-full bg-[#353b49] text-white/95 rounded shadow-md py-3 px-4 font-sans font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#2b303b] transition-colors border border-white/10"
        >
          + New Draft
        </button>
      </div>

      <nav className="px-3 space-y-1">
        <NavItem
          icon={<Users size={18} />}
          label="Your Drafts"
          hasChevron
          open={draftsOpen}
          onClick={() => setDraftsOpen(!draftsOpen)}
        />
        {draftsOpen && (
          <div className="pl-2 space-y-1">
            {drafts.map((draft) => (
              <DraftItem
                key={draft.id}
                title={draft.title}
                subtitle={draft.subtitle}
                date={draft.date}
                active={draft.id === activeDraft}
                icon={Lock}
                onClick={() => onSelectDraft(draft.id)}
                onDelete={(e) => onDeleteDraft && onDeleteDraft(draft.id, e)}
              />
            ))}
          </div>
        )}
        <NavItem
          icon={<FileText size={18} />}
          label="Templates"
          hasChevron
          open={templatesOpen}
          onClick={() => setTemplatesOpen(!templatesOpen)}
        />
        {templatesOpen && (
          <div className="pl-7 space-y-1">
            <p className="text-xs text-muted-foreground py-2 px-2">No templates yet</p>
          </div>
        )}
        <NavItem icon={<Clock size={18} />} label="History" />
      </nav>

      <div className="mt-auto px-3 pb-2">
        <NavItem icon={<Settings size={18} />} label="Settings" />
      </div>

      <div className="border-t border-border p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10" />
        </div>
        <div className="min-w-0">
          <p className="font-sans font-semibold text-sm text-foreground truncate">Param Shah</p>
          <p className="font-sans text-xs text-muted-foreground flex items-center gap-1">
            Settings <ChevronDown size={12} />
          </p>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({
  icon,
  label,
  hasChevron,
  open,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hasChevron?: boolean;
  open?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-sans text-foreground hover:bg-accent transition-colors"
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {hasChevron && (open ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />)}
  </button>
);

const DraftItem = ({
  title,
  subtitle,
  date,
  active,
  icon: Icon,
  onClick,
  onDelete,
}: {
  title: string;
  subtitle: string;
  date: string;
  active: boolean;
  icon: any;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-3 rounded-lg transition-all font-sans relative group ${active
        ? "bg-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border-t border-l border-white/80"
        : "hover:bg-white/30 border border-transparent"
      }`}
  >
    <div className="flex items-start gap-3">
      <Icon size={16} className={`${active ? "text-[#555]" : "text-[#777]"} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[13.5px] font-medium text-[#222] truncate">{title}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#666] truncate">{subtitle}</p>
          <span className="text-[10px] text-[#888] flex-shrink-0 absolute right-3 top-[32%] group-hover:opacity-0 transition-opacity">{date}</span>
        </div>
      </div>

      {/* Delete Draft Action Button */}
      {onDelete && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50/50 transition-all duration-200 z-30 cursor-pointer"
          title="Delete Draft"
        >
          <Trash2 size={13.5} />
        </span>
      )}

      {/* Active Indicator dot (hidden on hover if delete button is visible) */}
      {active && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#111] group-hover:opacity-0 transition-opacity" />}
    </div>
  </button>
);

export default Sidebar;
