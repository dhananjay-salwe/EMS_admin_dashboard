import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LiveAnalytics from './pages/LiveAnalytics';
import LocationManagement from './pages/LocationManagement';
import OperatorManagement from './pages/OperatorManagement';
import AuditSubmissions from './pages/AuditSubmissions';
import Login from './pages/Login';

import PartyManagement from './pages/PartyManagement';
import AdminManagement from './pages/AdminManagement';

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [collapsed, setCollapsed] = useState(false);

  if (!admin) {
    return <Login onLoginSuccess={setAdmin} />;
  }

  return (
    <div className={`app-wrapper ${collapsed ? 'collapsed' : ''}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Topbar
        admin={admin}
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed(c => !c)}
        onLogout={() => setAdmin(null)}
      />

      <div className="app-main">
        <div className="page-content">
          {activeTab === 'analytics' && <LiveAnalytics />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'operators' && <OperatorManagement />}
          {activeTab === 'audit' && <AuditSubmissions />}
          {activeTab === 'parties' && <PartyManagement />}
          {activeTab === 'admins' && <AdminManagement currentAdminRole={admin.role} />}

        </div>
      </div>
    </div>
  );
}