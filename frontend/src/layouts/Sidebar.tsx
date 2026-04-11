import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PenTool, 
  Columns2, 
  Library, 
  ShieldAlert, 
  ClockArrowUp,
  Settings,
  Scale,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', description: 'Overview' },
  { icon: FileText, label: 'Contracts', path: '/contracts', description: 'All Matters' },
  { icon: PenTool, label: 'Draft Contract', path: '/draft', description: 'New Document' },
  { icon: Columns2, label: 'Compare Versions', path: '/compare', description: 'Redline View' },
  { icon: Library, label: 'Clause Library', path: '/library', description: 'Boilerplate' },
  { icon: ShieldAlert, label: 'Risk Alerts', path: '/risks', description: 'Flag Review' },
  { icon: ClockArrowUp, label: 'Audit History', path: '/audit', description: 'Review Trail' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex flex-col w-68 h-screen z-50 shadow-2xl" style={{ width: '272px', background: 'linear-gradient(180deg, #0B1F3A 0%, #0d2647 60%, #0a1e38 100%)' }}>
      
      {/* Firm Header */}
      <div className="relative px-6 pt-7 pb-5 border-b border-white/10">
        {/* Decorative horizontal gold line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-legal-gold to-transparent opacity-80" />
        
        <div className="flex items-center gap-3">
          {/* Emblem */}
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full border-2 border-legal-gold/50 bg-legal-emerald/30 shadow-inner">
            <Scale size={20} className="text-legal-gold" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-widest uppercase">LexIntel</h1>
            <p className="text-[10px] text-legal-gold/80 tracking-[0.25em] uppercase font-medium">Legal Intelligence</p>
          </div>
        </div>

        {/* Firm tagline */}
        <div className="mt-4 px-3 py-2 rounded-md border border-legal-gold/20 bg-white/3">
          <p className="text-[10px] text-gray-400 italic font-light leading-relaxed text-center">
            "Iustitia omnibus" — Justice for all
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-[9px] uppercase tracking-[0.25em] text-gray-500 font-semibold">Navigation</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/10 text-white border border-legal-gold/30" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-legal-gold rounded-r-full" />
                )}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-colors shrink-0",
                  isActive ? "bg-legal-gold/15 text-legal-gold" : "text-gray-500 group-hover:text-legal-gold/70"
                )}>
                  <item.icon size={16} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold", isActive ? "text-white" : "")}>{item.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{item.description}</div>
                </div>
                {isActive && <ChevronRight size={12} className="text-legal-gold opacity-70 shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border",
              isActive 
                ? "bg-white/10 text-legal-gold border-legal-gold/30" 
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
            )
          }
        >
          <Settings size={16} className="text-gray-500" strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>
        
        {/* User Profile Snippet */}
        <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-md border border-legal-gold/20 bg-legal-gold/5">
          <div className="w-8 h-8 rounded-full bg-legal-emerald flex items-center justify-center text-xs font-bold text-white border border-legal-gold/40 shrink-0">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Jane Doe, Esq.</p>
            <p className="text-[10px] text-legal-gold/80 truncate">Senior Counsel · Partner</p>
          </div>
        </div>

        {/* Bottom gold line */}
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-legal-gold/40 to-transparent" />
        <p className="text-center text-[9px] text-gray-600 mt-2 tracking-wider">CONFIDENTIAL · PRIVILEGED</p>
      </div>
    </aside>
  );
}
