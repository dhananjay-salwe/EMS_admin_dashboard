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

  const [collapsed, setCollapsed] = useState(false);

  // Sync active tab to localStorage whenever it changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('ems_active_tab', tab);
  };

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
    <div className={`app-wrapper ${collapsed ? 'collapsed' : ''}`}>
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      <Topbar
        admin={admin}
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed(c => !c)}
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