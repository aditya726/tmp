import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Layers } from 'lucide-react';

export function AppSidebar() {
  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-slate-900 text-white">
      {/* Brand */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <Layers size={14} className="text-white" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-white tracking-tight leading-none block">
              AIS Dynamic
            </span>
            <span className="text-[11px] text-slate-500 leading-none block mt-0.5">
              Report Engine
            </span>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/8 mb-3" />

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <NavLink
          to="/templates"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
        >
          <LayoutDashboard size={15} />
          Templates
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-white/8 my-2" />
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2">
          <Settings size={12} className="text-slate-600" />
          <span className="text-[11px] text-slate-600">v2.0</span>
        </div>
      </div>
    </aside>
  );
}
