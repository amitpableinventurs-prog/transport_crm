import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useOutletContext } from 'react-router-dom';
import MainLayout from '../components/common/MainLayout';
import { allModulePaths, moduleByPath, roleMenus } from '../config/navigation';
import BookingManagement from '../pages/Booking/BookingManagement';
import CustomerKycPortal from '../pages/Customer/CustomerKycPortal';
import CustomerManagement from '../pages/Customer/CustomerManagement';
import DashboardOverview from '../pages/Dashboard/DashboardOverview';
import VehicleManagement from '../pages/Fleet/VehicleManagement';
import ModuleWorkspace from '../pages/ModuleWorkspace';

function moduleElement(path) {
  if (path === '/crm/customers') return <CustomerManagement />;
  if (path === '/crm/portal') return <CustomerKycPortal />;
  if (path === '/crm/history' || path.startsWith('/bookings/')) return <BookingManagement />;
  if (path === '/fleet/register' || path === '/fleet/status') return <VehicleManagement />;
  return <ModuleWorkspace module={moduleByPath[path]} path={path} />;
}

function PanelModule({ path }) {
  const { userRole = 'super_admin' } = useOutletContext() || {};
  const hasAccess = (roleMenus[userRole] || roleMenus.super_admin).some((item) =>
    item.submenus?.some((submenu) => submenu.path === path)
  );
  return hasAccess ? moduleElement(path) : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/crm/register" element={<Navigate to="/crm/customers" replace />} />
          <Route path="/fuel/reports" element={<Navigate to="/reports/fuel" replace />} />
          <Route path="/trips/reports" element={<Navigate to="/reports/trip" replace />} />
          {allModulePaths.map((path) => (
            <Route key={path} path={path} element={<PanelModule path={path} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
