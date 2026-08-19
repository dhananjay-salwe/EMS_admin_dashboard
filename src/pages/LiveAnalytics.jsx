import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const IconTrophy = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h2.5a2.5 2.5 0 0 1 0 5H17M7 5H4.5a2.5 2.5 0 0 0 0 5H7" />
  </svg>
);
const IconLayers = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);
const IconActivity = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconUsers = (props) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconFileText = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function LiveAnalytics() {
  const [data, setData] = useState({ total_wards: 0,
    total_booths: 0,
    total_candidates: 0,
    total_votes: 0,
    leaderboard: [],
    ward_details: [] });
  const [selectedParty, setSelectedParty] = useState(null);
  const [showWardModal, setShowWardModal] = useState(false);

  const fetchStats = async () => {
    const res = await apiCall('/votes/dashboard-summary');
    if (res.success) setData(res);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const leadingParty = data.leaderboard.length > 0 ? data.leaderboard[0] : null;

  return (
    <div>
      {/* <div className="page-title-box">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Live Tallies</span>
          </div>
        </div>
      </div> */}

<div className="stat-grid">
        {/* 1. Total Wards */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Wards</div>
            <div className="stat-value">{(data.total_wards ?? 0).toLocaleString()}</div>
            <button 
              type="button"
              className="btn btn-outline btn-sm" 
              style={{ marginTop: 10 }} 
              onClick={() => setShowWardModal(true)}
            >
              View ward results
            </button>
          </div>
          <div className="stat-icon info"><IconLayers /></div>
        </div>

        {/* 2. Total Booths */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Booths</div>
            <div className="stat-value">{(data.total_booths ?? 0).toLocaleString()}</div>
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Registered polling units</div>
          </div>
          <div className="stat-icon primary"><IconTrophy /></div>
        </div>

        {/* 3. Total Candidates */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Candidates</div>
            <div className="stat-value">{(data.total_candidates ?? 0).toLocaleString()}</div>
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Contesting across wards</div>
          </div>
          <div className="stat-icon warning"><IconUsers /></div>
        </div>

        {/* 4. Total Voting */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Voting</div>
            <div className="stat-value">{(data.total_votes ?? 0).toLocaleString()}</div>
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Cumulative votes polled</div>
          </div>
          <div className="stat-icon success"><IconActivity /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Party-wise seat standings</h2>
          <span className="muted">{data.leaderboard.length} parties</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Party</th>
                <th>Symbol</th>
                <th>Seats won / leading</th>
                <th>Total popular votes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((party, idx) => (
                <tr key={party.party_id}>
                  <td><strong>#{idx + 1}</strong></td>
                  <td><strong>{party.party_name}</strong> <span className="muted">({party.party_code})</span></td>
                  <td>
                    {party.party_icon_url
                      ? <img src={party.party_icon_url} alt="" className="avatar-sm" />
                      : <span className="avatar-title">{party.party_name?.charAt(0)}</span>}
                  </td>
                  <td><span className="badge badge-soft-primary">{party.seats_won} seats</span></td>
                  <td><strong>{party.total_popular_votes.toLocaleString()}</strong></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedParty(party)}>
                      <IconFileText style={{ marginRight: 5 }} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {data.leaderboard.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Party Breakdown Modal */}
      {selectedParty && (
        <div className="modal-overlay" onClick={() => setSelectedParty(null)}>
          <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedParty.party_name} — Won seats &amp; candidates</h3>
              <button className="modal-close" onClick={() => setSelectedParty(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 14, fontWeight: 600 }}>Seats won: {selectedParty.seats_won}</p>
              {selectedParty.won_wards.length === 0 ? (
                <p className="muted">No wards currently won by this party.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ward / seat</th>
                        <th>LGA &amp; state</th>
                        <th>Winning candidate</th>
                        <th>Votes polled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedParty.won_wards.map((w, i) => (
                        <tr key={i}>
                          <td><strong>{w.ward_name}</strong></td>
                          <td>{w.lga_name}, {w.state_name}</td>
                          <td>{w.candidate_name}</td>
                          <td>{w.candidate_votes.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedParty(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* All Wards Detailed Modal */}
      {showWardModal && (
        <div className="modal-overlay" onClick={() => setShowWardModal(false)}>
          <div className="modal-box modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ward-by-ward candidate standings</h3>
              <button className="modal-close" onClick={() => setShowWardModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {data.ward_details.map((ward) => (
                <div key={ward.ward_id} className="ward-card">
                  <div className="ward-card-header">
                    {ward.ward_name} <span>({ward.lga_name}, {ward.state_name})</span>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Party</th>
                          <th>Votes counted</th>
                          <th>Standing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ward.candidates.map((c, i) => (
                          <tr key={c.candidate_id} className={i === 0 && c.total_votes > 0 ? 'row-highlight' : ''}>
                            <td><strong>{c.candidate_name}</strong></td>
                            <td>{c.party_name} ({c.party_code})</td>
                            <td>{c.total_votes.toLocaleString()}</td>
                            <td>
                              {i === 0 && c.total_votes > 0
                                ? <span className="badge badge-soft-success">Seat winner</span>
                                : <span className="badge badge-soft-secondary">Runner up</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowWardModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}