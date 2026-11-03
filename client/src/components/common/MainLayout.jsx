import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { panelOptions } from '../../config/navigation';

const PANEL_KEY = 'transport_crm_panel';

function getInitialPanel() {
  const savedPanel = sessionStorage.getItem(PANEL_KEY);
  return panelOptions.some((panel) => panel.value === savedPanel)
    ? savedPanel
    : 'super_admin';
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(getInitialPanel);

  const changePanel = (nextRole) => {
    sessionStorage.setItem(PANEL_KEY, nextRole);
    setUserRole(nextRole);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <Sidebar
        userRole={userRole}
        onRoleChange={changePanel}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} userRole={userRole} />
      <main className="px-4 pb-6 pt-20 sm:px-6 lg:pl-72">
        <Outlet context={{ userRole }} />
      </main>
    </div>
  );
}