import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const PARTY_COLORS = ['#556ee6', '#34c38f', '#f1b44c', '#50a5f1', '#f46a6a', '#7b61e0'];

const IconTrophy = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h2.5a2.5 2.5 0 0 1 0 5H17M7 5H4.5a2.5 2.5 0 0 0 0 5H7" />
  </svg>
);
const IconUsers = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.4c1.7.4 3 2 3 3.8s-1.3 3.4-3 3.8" />
    <path d="M21.5 20c0-3-2-5.3-4.8-5.9" />
  </svg>
);
const IconActivity = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default function LiveAnalytics() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLeaderboard = async () => {
    const data = await apiCall('/votes/dashboard-stats');
    if (data.success) setLeaderboard(data.leaderboard);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const leadingParty = leaderboard.length > 0 ? leaderboard[0] : null;
  const totalVotes = leaderboard.reduce((sum, i) => sum + (parseInt(i.total_votes, 10) || 0), 0);

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Live Vote Tallies</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Live Tallies</span>
          </div>
        </div>
        {lastUpdated && <span className="muted">Last updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Leading Political Party</div>
            <div className="stat-value">{leadingParty ? leadingParty.party_name : 'N/A'}</div>
            {leadingParty && <span className="badge badge-soft-success" style={{ marginTop: 10, display: 'inline-block' }}>Currently leading</span>}
          </div>
          <div className="stat-icon primary"><IconTrophy /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Candidate Entries</div>
            <div className="stat-value">{leaderboard.length}</div>
          </div>
          <div className="stat-icon info"><IconUsers /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Votes Counted</div>
            <div className="stat-value">{totalVotes.toLocaleString()}</div>
          </div>
          <div className="stat-icon success"><IconActivity /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Live National Vote Results</h2>
          <span className="muted">{leaderboard.length} entries</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Political Party</th>
                <th>Candidate Name</th>
                <th>Total Accumulated Votes</th>
                <th>Standing</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((item, index) => (
                <tr key={index}>
                  <td><strong>#{index + 1}</strong></td>
                  <td>
                    <div className="party-cell">
                      {item.party_icon_url ? (
                        <img src={item.party_icon_url} alt="" className="avatar-xs" />
                      ) : (
                        <span
                          className="avatar-title"
                          style={{ background: `${PARTY_COLORS[index % PARTY_COLORS.length]}22`, color: PARTY_COLORS[index % PARTY_COLORS.length] }}
                        >
                          {item.party_name?.charAt(0)}
                        </span>
                      )}
                      {item.party_name}
                    </div>
                  </td>
                  <td>{item.candidate_name}</td>
                  <td><strong style={{ fontSize: 14.5 }}>{parseInt(item.total_votes, 10).toLocaleString()}</strong></td>
                  <td>
                    {index === 0
                      ? <span className="badge badge-soft-success">Projected Winner</span>
                      : <span className="badge badge-soft-secondary">Runner Up</span>}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}