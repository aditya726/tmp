import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, FileCode2, Settings, Layers } from 'lucide-react';

export function AppSidebar() {
  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight leading-none block">
              AIS Dynamic
            </span>
            <span className="text-xs text-slate-400 leading-none block mt-0.5">
              Reports
            </span>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/10 mb-4" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        <NavLink
          to="/templates"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
        >
          <LayoutDashboard size={16} />
          Templates
        </NavLink>
        <div className="sidebar-link opacity-40 cursor-not-allowed select-none">
          <Database size={16} />
          XML Catalogue
          <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
        </div>
        <div className="sidebar-link opacity-40 cursor-not-allowed select-none">
          <FileCode2 size={16} />
          XML Viewer
          <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
        </div>
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-white/10 my-3" />
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">AIS Report Engine v2</span>
        </div>
      </div>
    </aside>
  );
}
