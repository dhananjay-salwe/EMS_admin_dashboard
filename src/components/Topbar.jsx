import React, { useState, useRef, useEffect } from 'react';

const IconMenu = (props) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);
const IconSearch = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const IconBell = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
const IconChevron = (props) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const IconLogout = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export default function Topbar({ admin, collapsed, mobileOpen, onToggleSidebar, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const sidebarIsOpen = mobileOpen || !collapsed;

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

// FIX: Pull the first letter of the full name instead of username
  // const initial = admin?.full_name ? admin.full_name.charAt(0).toUpperCase() : '?';
  // First, determine what name we are actually displaying
  const displayName = admin?.full_name || 'Admin';
  
  // Then, safely grab the first letter of that display name
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggleSidebar} aria-label={sidebarIsOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <IconMenu />
        </button>
      </div>

      <div className="topbar-right">
        <div className="profile-menu" ref={menuRef}>
          <button className="profile-trigger" onClick={() => setMenuOpen(o => !o)}>
            <span className="profile-avatar">{initial}</span>
            <span className="profile-info">
              {/* <span className="profile-name">{admin?.full_name}</span> */}
              <span className="profile-name" style={{ fontWeight: 700 }}>
                {admin?.full_name || 'Admin'}
              </span>
            </span>
            <IconChevron />
          </button>

          {menuOpen && (
            <div className="profile-dropdown">
              <button className="danger" onClick={onLogout}>
                <IconLogout /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}