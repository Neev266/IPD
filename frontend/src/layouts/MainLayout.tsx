import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-legal-ivory">
      <Sidebar />
      
      {/* Main Content Area */}
      <main style={{ paddingLeft: '272px' }} className="flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-legal-border shadow-sm px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-legal-textLight">
            <span className="font-semibold text-legal-navy uppercase tracking-wider">LexIntel</span>
            <span className="text-legal-gold">·</span>
            <span>AI-Powered Legal Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-legal-textLight">
            <span className="px-2 py-1 bg-legal-emerald/10 text-legal-emerald border border-legal-emerald/20 rounded font-semibold uppercase tracking-wider text-[10px]">
              Attorney-Client Privileged
            </span>
            <span>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-8 max-w-screen-2xl mx-auto w-full">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="border-t border-legal-border bg-white/50 px-8 py-3 text-center">
          <p className="text-[10px] text-gray-400 tracking-widest uppercase">
            © 2026 LexIntel Inc. · All information within this platform is attorney-client privileged and confidential.
          </p>
        </footer>
      </main>
    </div>
  );
}
