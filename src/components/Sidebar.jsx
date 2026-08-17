import React from 'react';

const IconBolt = (props) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
  </svg>
);

const IconChart = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
);

const IconPin = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
);

const IconUsers = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.4c1.7.4 3 2 3 3.8s-1.3 3.4-3 3.8" />
    <path d="M21.5 20c0-3-2-5.3-4.8-5.9" />
  </svg>
);

const IconCamera = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);

const IconLandmark = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 21h16" />
    <path d="M5 21V10M9 21V10M15 21V10M19 21V10" />
    <path d="M3 10 12 4l9 6" />
  </svg>
);

const IconUser = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8" />
  </svg>
);

const IconShield = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3 5 6v6c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6l-7-3Z" />
    <path d="m9.5 12 2 2 3.5-3.5" />
  </svg>
);

const NAV_ITEMS = [
  { key: 'analytics', label: 'Live Vote Tallies', Icon: IconChart },
  { key: 'parties', label: 'Political Parties', Icon: IconLandmark },
  { key: 'candidates', label: 'Candidates', Icon: IconUser },
  { key: 'locations', label: 'Location & Booths', Icon: IconPin },
  { key: 'operators', label: 'Booth Officers', Icon: IconUsers },
  { key: 'audit', label: 'Booth Report', Icon: IconCamera },
  { key: 'admins', label: 'Admin Management', Icon: IconShield },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Only visible/interactive below the 780px breakpoint (see App.css);
          tapping it closes the off-canvas drawer. */}
      <div
        className="sidebar-backdrop"
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />

      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark"><IconBolt /></div>
          <span className="sidebar-brand-text">EMS</span>
        </div>


        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`nav-link ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}