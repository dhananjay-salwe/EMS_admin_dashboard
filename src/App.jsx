import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LiveAnalytics from './pages/LiveAnalytics';
import PartyManagement from './pages/PartyManagement';
import CandidateManagement from './pages/CandidateManagement';
import LocationManagement from './pages/LocationManagement';
import OperatorManagement from './pages/OperatorManagement';
import AuditSubmissions from './pages/AuditSubmissions';
import AdminManagement from './pages/AdminManagement';
import Login from './pages/Login';

const MOBILE_BREAKPOINT = 780; // keep in sync with the @media max-width in App.css

export default function App() {
  // Initialize state directly from localStorage so page refreshes persist the session
  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem('ems_admin_user');
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('ems_active_tab') || 'analytics';
  });

  // Desktop (>780px): shrinks the sidebar to an icon-only rail.
  const [collapsed, setCollapsed] = useState(false);
  // Mobile/tablet (<=780px): sidebar is off-canvas; this opens/closes it as a drawer.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync active tab to localStorage whenever it changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('ems_active_tab', tab);
    setMobileOpen(false); // auto-close the drawer after navigating on mobile
  };

  // One toggle button, two behaviors depending on viewport — this is what
  // was missing before: the button always called setCollapsed, but on
  // mobile the collapsed state was visually meaningless because CSS forced
  // the sidebar to the same 72px width either way.
  const handleToggleSidebar = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  // If the window is resized past the breakpoint while the mobile drawer is
  // open, close it so it doesn't get stuck open once desktop layout kicks in.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('ems_admin_user', JSON.stringify(adminData));
  };

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('ems_admin_user');
    localStorage.removeItem('ems_active_tab');
  };

  if (!admin) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-wrapper ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <Topbar
        admin={admin}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleSidebar={handleToggleSidebar}
        onLogout={handleLogout}
      />

      <div className="app-main">
        <div className="page-content">
          {activeTab === 'analytics' && <LiveAnalytics />}
          {activeTab === 'parties' && <PartyManagement />}
          {activeTab === 'candidates' && <CandidateManagement />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'operators' && <OperatorManagement />}
          {activeTab === 'audit' && <AuditSubmissions />}
          {activeTab === 'admins' && <AdminManagement currentAdminRole={admin.role} />}
        </div>
      </div>
    </div>
  );
}