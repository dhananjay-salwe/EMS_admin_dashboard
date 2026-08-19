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

  // --- Ward Filter & Pagination States ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('');
  const [wardCurrentPage, setWardCurrentPage] = useState(1);
  const [selectedWardDetail, setSelectedWardDetail] = useState(null);
  const WARDS_PAGE_SIZE = 10;

  
  // --- Party Standings LGA Filter & Pagination ---
  const [partyLgaFilter, setPartyLgaFilter] = useState('');
  const [partyCurrentPage, setPartyCurrentPage] = useState(1);
  const PARTY_PAGE_SIZE = 10;

  const allLgas = [...new Set((data.ward_details || []).map(w => w.lga_name).filter(Boolean))].sort();

  // Dynamically calculate LGA-specific standings if an LGA is selected
  let displayedLeaderboard = data.leaderboard || [];
  if (partyLgaFilter) {
    const lgaStats = {};
    // Setup baseline with 0 seats/votes for all parties
    displayedLeaderboard.forEach(p => {
      lgaStats[p.party_id] = { ...p, seats_won: 0, total_popular_votes: 0, won_wards: [] };
    });

    // Tally up votes and seats strictly for the chosen LGA
    (data.ward_details || []).filter(w => w.lga_name === partyLgaFilter).forEach(ward => {
      (ward.candidates || []).forEach((c, idx) => {
        if (lgaStats[c.party_id]) {
          lgaStats[c.party_id].total_popular_votes += (c.total_votes || 0);
          if (idx === 0 && c.total_votes > 0) {
            lgaStats[c.party_id].seats_won += 1;
            lgaStats[c.party_id].won_wards.push({
              ward_name: ward.ward_name,
              lga_name: ward.lga_name,
              state_name: ward.state_name,
              candidate_name: c.candidate_name,
              candidate_votes: c.total_votes
            });
          }
        }
      });
    });
    // Sort by seats, then by popular vote
    displayedLeaderboard = Object.values(lgaStats).sort((a, b) => b.seats_won - a.seats_won || b.total_popular_votes - a.total_popular_votes);
  }

  // Apply Pagination only if an LGA is selected
  let paginatedLeaderboard = displayedLeaderboard;
  let totalPartyPages = 1;
  if (partyLgaFilter) {
    totalPartyPages = Math.max(1, Math.ceil(displayedLeaderboard.length / PARTY_PAGE_SIZE));
    paginatedLeaderboard = displayedLeaderboard.slice(
      (partyCurrentPage - 1) * PARTY_PAGE_SIZE,
      partyCurrentPage * PARTY_PAGE_SIZE
    );
  }

  const fetchStats = async () => {
    const res = await apiCall('/votes/dashboard-summary');
    if (res.success) setData(res);
  };

  // Extract distinct cascading dropdown values from data.ward_details
  const stateList = [...new Set((data.ward_details || []).map(w => w.state_name).filter(Boolean))].sort();
  
  const lgaList = [...new Set(
    (data.ward_details || [])
      .filter(w => !selectedState || w.state_name === selectedState)
      .map(w => w.lga_name)
      .filter(Boolean)
  )].sort();

  const wardFilterList = [...new Set(
    (data.ward_details || [])
      .filter(w => (!selectedState || w.state_name === selectedState) && (!selectedLga || w.lga_name === selectedLga))
      .map(w => w.ward_name)
      .filter(Boolean)
  )].sort();

  // Filtered wards based on selected dropdowns
  const filteredWardList = (data.ward_details || []).filter(w => {
    if (selectedState && w.state_name !== selectedState) return false;
    if (selectedLga && w.lga_name !== selectedLga) return false;
    if (selectedWardFilter && w.ward_name !== selectedWardFilter) return false;
    return true;
  });

  const totalWardPages = Math.max(1, Math.ceil(filteredWardList.length / WARDS_PAGE_SIZE));
  const paginatedWards = filteredWardList.slice(
    (wardCurrentPage - 1) * WARDS_PAGE_SIZE,
    wardCurrentPage * WARDS_PAGE_SIZE
  );

  const hasSelectedFilters = selectedState || selectedLga || selectedWardFilter;

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
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Wards covered</div>
            {/* <button 
              type="button"
              className="btn btn-outline btn-sm" 
              style={{ marginTop: 10 }} 
              onClick={() => setShowWardModal(true)}
            >
              View ward results
            </button> */}
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

      {/* Ward Filter & Results Section */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>Ward Standings &amp; Results</h2>
            <span className="muted">{filteredWardList.length} wards available</span>
          </div>

          {/* Cascading Direct Dropdowns */}
{/* Inline Cascading Dropdowns */}
<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
  {/* State Dropdown */}
  <select
    className="form-control"
    style={{ minWidth: 180, width: 'auto' }}
    value={selectedState}
    onChange={e => {
      setSelectedState(e.target.value);
      setSelectedLga('');
      setSelectedWardFilter('');
      setWardCurrentPage(1);
    }}
  >
    <option value="">Select State</option>
    {stateList.map(s => <option key={s} value={s}>{s}</option>)}
  </select>

  {/* LGA Dropdown */}
  <select
    className="form-control"
    style={{ minWidth: 180, width: 'auto' }}
    value={selectedLga}
    disabled={!selectedState}
    onChange={e => {
      setSelectedLga(e.target.value);
      setSelectedWardFilter('');
      setWardCurrentPage(1);
    }}
  >
    <option value="">Select LGA</option>
    {lgaList.map(l => <option key={l} value={l}>{l}</option>)}
  </select>

  {/* Ward Dropdown */}
  <select
    className="form-control"
    style={{ minWidth: 180, width: 'auto' }}
    value={selectedWardFilter}
    disabled={!selectedLga}
    onChange={e => {
      setSelectedWardFilter(e.target.value);
      setWardCurrentPage(1);
    }}
  >
    <option value="">Select Ward</option>
    {wardFilterList.map(w => <option key={w} value={w}>{w}</option>)}
  </select>

  {hasSelectedFilters && (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      style={{ whiteSpace: 'nowrap' }}
      onClick={() => {
        setSelectedState('');
        setSelectedLga('');
        setSelectedWardFilter('');
        setWardCurrentPage(1);
      }}
    >
      Clear
    </button>
  )}
</div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ward Name</th>
                <th>LGA</th>
                <th>State</th>
                <th>Total Candidates</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWards.map((ward) => (
                <tr key={ward.ward_id}>
                  <td><strong>{ward.ward_name}</strong></td>
                  <td>{ward.lga_name}</td>
                  <td>{ward.state_name}</td>
                  <td>{ward.candidates ? ward.candidates.length : 0} candidates</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedWardDetail(ward)}
                    >
                      View standings
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedWards.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">No wards found matching the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 10-item Pagination Controls */}
        {totalWardPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '16px 0' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={wardCurrentPage === 1}
              onClick={() => setWardCurrentPage(p => Math.max(1, p - 1))}
            >
              &larr; Prev
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              Page {wardCurrentPage} of {totalWardPages}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={wardCurrentPage === totalWardPages}
              onClick={() => setWardCurrentPage(p => Math.min(totalWardPages, p + 1))}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

<div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h2>Party-wise seat standings</h2>
          
          {/* Main Page LGA Dropdown */}
          <select
            className="form-control"
            style={{ minWidth: 200, width: 'auto', padding: '6px 12px' }}
            value={partyLgaFilter}
            onChange={e => {
              setPartyLgaFilter(e.target.value);
              setPartyCurrentPage(1);
            }}
          >
            <option value="">All LGAs (Global Standings)</option>
            {allLgas.map(lga => <option key={lga} value={lga}>{lga}</option>)}
          </select>
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
              {/* Note: We map over paginatedLeaderboard instead of data.leaderboard */}
              {paginatedLeaderboard.map((party, idx) => (
                <tr key={party.party_id}>
                  <td>
                    <strong>#{partyLgaFilter ? ((partyCurrentPage - 1) * PARTY_PAGE_SIZE) + idx + 1 : idx + 1}</strong>
                  </td>
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
              {paginatedLeaderboard.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 10-item Pagination Controls (Only renders if LGA is selected and > 1 page) */}
        {partyLgaFilter && totalPartyPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '16px 0' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={partyCurrentPage === 1}
              onClick={() => setPartyCurrentPage(p => Math.max(1, p - 1))}
            >
              &larr; Prev
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              Page {partyCurrentPage} of {totalPartyPages}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={partyCurrentPage === totalPartyPages}
              onClick={() => setPartyCurrentPage(p => Math.min(totalPartyPages, p + 1))}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
      

      {/* Party Breakdown Modal */}
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





      {/* Ward Candidate Standings Modal (Sorted Descending by Votes) */}
      {selectedWardDetail && (
        <div className="modal-overlay" onClick={() => setSelectedWardDetail(null)}>
          <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedWardDetail.ward_name} — Candidate Standings</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  {selectedWardDetail.lga_name}, {selectedWardDetail.state_name}
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedWardDetail(null)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Symbol</th>
                      <th>Candidate Name</th>
                      <th>Party Name</th>
                      <th>Total Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(selectedWardDetail.candidates || [])]
                      .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
                      .map((cand, idx) => (
                        <tr key={cand.candidate_id || idx} className={idx === 0 && cand.total_votes > 0 ? 'row-highlight' : ''}>
                          <td><strong>#{idx + 1}</strong></td>
                          <td>
                            {cand.party_icon_url ? (
                              <img src={cand.party_icon_url} alt="" className="avatar-sm" />
                            ) : (
                              <span className="avatar-title">{cand.party_name?.charAt(0) || 'P'}</span>
                            )}
                          </td>
                          <td><strong>{cand.candidate_name}</strong></td>
                          <td>
                            <span className="badge badge-soft-secondary">
                              {cand.party_name} {cand.party_code ? `(${cand.party_code})` : ''}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: 15 }}>{(cand.total_votes || 0).toLocaleString()}</strong>
                          </td>
                        </tr>
                      ))}
                    {(!selectedWardDetail.candidates || selectedWardDetail.candidates.length === 0) && (
                      <tr>
                        <td colSpan={5} className="empty-state">No candidate votes recorded for this ward.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedWardDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}