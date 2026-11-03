import React from 'react';
import { Menu, PanelTop } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { moduleByPath, panelOptions } from '../../config/navigation';

export default function Navbar({ onMenuClick, userRole = 'super_admin' }) {
  const { pathname } = useLocation();
  const currentModule = moduleByPath[pathname];
  const currentPanel = panelOptions.find((panel) => panel.value === userRole);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-6 lg:left-72">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:block">
            {currentModule?.category || 'Transport CRM'}
          </p>
          <h2 className="truncate text-sm font-bold text-slate-800 sm:text-base">
            {currentModule?.name || 'Operations overview'}
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <PanelTop size={15} className="text-emerald-700" />
        <span className="hidden text-xs font-semibold text-slate-700 sm:block">
          {currentPanel?.label || panelOptions[0].label}
        </span>
        <span className="text-xs font-semibold text-slate-700 sm:hidden">
          {currentPanel?.label.replace(' Panel', '') || 'Panel'}
        </span>
      </div>
    </header>
  );
}
