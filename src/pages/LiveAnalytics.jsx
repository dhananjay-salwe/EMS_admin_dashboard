import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
  const [data, setData] = useState({
    total_wards: 0,
    total_booths: 0,
    total_candidates: 0,
    total_votes: 0,
    leaderboard: [],
    ward_details: []
  });
  const [selectedParty, setSelectedParty] = useState(null);
  const [showWardModal, setShowWardModal] = useState(false);

  // FIX: Manual refresh UI controls state and handler
  const [refreshing, setRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };


  // --- Ward & Booth Filter States ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('');
  const [selectedBoothFilter, setSelectedBoothFilter] = useState('');
  const [wardCurrentPage, setWardCurrentPage] = useState(1);
  const [selectedWardDetail, setSelectedWardDetail] = useState(null);
  const WARDS_PAGE_SIZE = 10;


  // --- Party Standings LGA Filter & Pagination ---
  const [partyLgaFilter, setPartyLgaFilter] = useState('');
  const [partyCurrentPage, setPartyCurrentPage] = useState(1);
  const PARTY_PAGE_SIZE = 10;

  const allLgas = [...new Set((data.ward_details || []).map(w => w.lga_name).filter(Boolean))].sort();

  const CHART_COLORS = ['#556ee6', '#34c38f', '#f1b44c', '#f46a6a', '#50a5f1', '#e83e8c', '#343a40'];

  const [loading, setLoading] = useState(true);

  // Dynamically calculate LGA-specific standings if an LGA is selected, based on WARD REPORT TABLE winners
  let displayedLeaderboard = data.leaderboard || [];
  if (partyLgaFilter) {
    const lgaStats = {};
    // Setup baseline with 0 seats/votes for all parties
    displayedLeaderboard.forEach(p => {
      lgaStats[p.party_id] = { ...p, seats_won: 0, total_popular_votes: 0, won_wards: [] };
    });

    // Tally up votes and seats strictly for the chosen LGA based on ward report table (data.ward_details)
    (data.ward_details || []).filter(w => w.lga_name === partyLgaFilter).forEach(ward => {
      const explicitWinner = (ward.candidates || []).find(c => c.is_winner);
      const sortedCandidates = [...(ward.candidates || [])].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
      const winningCand = explicitWinner || (sortedCandidates[0]?.total_votes > 0 ? sortedCandidates[0] : null);

      (ward.candidates || []).forEach(c => {
        if (lgaStats[c.party_id]) {
          lgaStats[c.party_id].total_popular_votes += (c.total_votes || 0);
        }
      });

      if (winningCand && lgaStats[winningCand.party_id]) {
        lgaStats[winningCand.party_id].seats_won += 1;
        lgaStats[winningCand.party_id].won_wards.push({
          ward_name: ward.ward_name,
          lga_name: ward.lga_name,
          state_name: ward.state_name,
          candidate_name: winningCand.candidate_name,
          candidate_votes: winningCand.total_votes
        });
      }
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
    try {
      const res = await apiCall('/votes/dashboard-summary');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Extract distinct cascading dropdown values from data.ward_details and data.booth_details
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

  const boothFilterList = [...new Set(
    (data.booth_details || [])
      .filter(b =>
        (!selectedState || b.state_name === selectedState) &&
        (!selectedLga || b.lga_name === selectedLga) &&
        (!selectedWardFilter || b.ward_name === selectedWardFilter)
      )
      .map(b => `${b.booth_name} (${b.unique_booth_code})`)
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

  const hasSelectedFilters = selectedState || selectedLga || selectedWardFilter || selectedBoothFilter;

  // OLD CODE:
  // useEffect(() => {
  //   fetchStats();
  //   const interval = setInterval(fetchStats, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  // FIX: Added visibilitychange listener to prevent background bandwidth drain
  useEffect(() => {
    fetchStats();

    let intervalId = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (document.visibilityState === 'visible') {
            fetchStats();
          }
        }, 10000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const leadingParty = data.leaderboard.length > 0 ? data.leaderboard[0] : null;

  return (
    <div>
      {/* OLD CODE:
      <div className="page-title-box">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Live Tallies</span>
          </div>
        </div>
      </div>
      */}

      {/* FIX: Added page title box with manual refresh trigger */}
      <div className="page-title-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Live Tallies</span>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', minHeight: '34px' }}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Live Data'}
          </button>
        </div>
      </div>


      {/* Top 4 Stat Metric Cards */}
      <div className="stat-grid">
        {/* Total Wards */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Wards</div>
            {loading ? (
              <div className="skeleton-box" style={{ width: 80, height: 28, marginTop: 4 }} />
            ) : (
              <div className="stat-value">{(data.total_wards ?? 0).toLocaleString()}</div>
            )}
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Wards covered</div>
          </div>
          <div className="stat-icon info"><IconLayers /></div>
        </div>

        {/* Total Booths */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Booths</div>
            {loading ? (
              <div className="skeleton-box" style={{ width: 80, height: 28, marginTop: 4 }} />
            ) : (
              <div className="stat-value">{(data.total_booths ?? 0).toLocaleString()}</div>
            )}
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Registered polling units</div>
          </div>
          <div className="stat-icon primary"><IconTrophy /></div>
        </div>

        {/* Total Candidates */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Candidates</div>
            {loading ? (
              <div className="skeleton-box" style={{ width: 80, height: 28, marginTop: 4 }} />
            ) : (
              <div className="stat-value">{(data.total_candidates ?? 0).toLocaleString()}</div>
            )}
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Contesting across wards</div>
          </div>
          <div className="stat-icon warning"><IconUsers /></div>
        </div>

        {/* Total Voting */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Voting</div>
            {loading ? (
              <div className="skeleton-box" style={{ width: 110, height: 28, marginTop: 4 }} />
            ) : (
              <div className="stat-value">{(data.total_votes ?? 0).toLocaleString()}</div>
            )}
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Ward report votes polled</div>
          </div>
          <div className="stat-icon success"><IconActivity /></div>
        </div>
      </div>

      {/* Ward & Booth Filter & Results Section */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header responsive-header">
          <div className="header-title-group">
            <h2>Ward &amp; Booth Standings &amp; Results</h2>
            <span className="muted">
              {selectedBoothFilter
                ? 'Showing selected booth (Moderator Verified)'
                : selectedWardFilter
                  ? 'Showing selected ward (Ward Report)'
                  : 'Select a ward or booth to view standings'}
            </span>
          </div>

          {/* Cascading Direct Dropdowns */}
          <div className="filter-toolbar">
            <CustomSelect
              className="filter-select-responsive"
              value={selectedState}
              placeholder="Select State"
              options={stateList}
              onChange={e => {
                setSelectedState(e.target.value);
                setSelectedLga('');
                setSelectedWardFilter('');
                setSelectedBoothFilter('');
              }}
            />
            <CustomSelect
              className="filter-select-responsive"
              value={selectedLga}
              placeholder="Select LGA"
              disabled={!selectedState}
              options={lgaList}
              onChange={e => {
                setSelectedLga(e.target.value);
                setSelectedWardFilter('');
                setSelectedBoothFilter('');
              }}
            />
            <CustomSelect
              className="filter-select-responsive"
              value={selectedWardFilter}
              placeholder="Select Ward"
              disabled={!selectedLga}
              options={wardFilterList}
              onChange={e => {
                setSelectedWardFilter(e.target.value);
                setSelectedBoothFilter('');
              }}
            />
            <CustomSelect
              className="filter-select-responsive"
              value={selectedBoothFilter}
              placeholder="Select Booth"
              disabled={!selectedWardFilter}
              options={boothFilterList}
              onChange={e => setSelectedBoothFilter(e.target.value)}
            />

            {hasSelectedFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm filter-clear-btn"
                onClick={() => {
                  setSelectedState('');
                  setSelectedLga('');
                  setSelectedWardFilter('');
                  setSelectedBoothFilter('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Display: Show Grid if Ward or Booth is selected */}
        {(selectedBoothFilter || selectedWardFilter) ? (() => {
          let displayCandidates = [];
          let isBoothView = Boolean(selectedBoothFilter);

          if (isBoothView) {
            const activeBooth = (data.booth_details || []).find(
              b => `${b.booth_name} (${b.unique_booth_code})` === selectedBoothFilter || b.booth_name === selectedBoothFilter
            );
            displayCandidates = activeBooth && activeBooth.candidates
              ? [...activeBooth.candidates].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
              : [];
          } else {
            const activeWard = (data.ward_details || []).find(w => w.ward_name === selectedWardFilter);
            displayCandidates = activeWard && activeWard.candidates
              ? [...activeWard.candidates].sort((a, b) => {
                  if (a.is_winner && !b.is_winner) return -1;
                  if (!a.is_winner && b.is_winner) return 1;
                  return (b.total_votes || 0) - (a.total_votes || 0);
                })
              : [];
          }

          return (
            <div className="ward-analysis-grid">
              {/* Left Side: Candidate List */}
              <div className="ward-list-side">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Candidate Name</th>
                      <th>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCandidates.map((cand, idx) => {
                      const isWinner = isBoothView ? (idx === 0 && cand.total_votes > 0) : (cand.is_winner || (idx === 0 && cand.total_votes > 0));
                      return (
                        <tr key={cand.candidate_id || idx} className={isWinner ? 'row-highlight' : ''}>
                          <td>
                            {cand.party_icon_url ? (
                              <img src={cand.party_icon_url} alt="" className="avatar-sm" />
                            ) : (
                              <span className="avatar-title">{cand.party_name?.charAt(0) || 'P'}</span>
                            )}
                          </td>
                          <td>
                            <strong>{cand.candidate_name}</strong>
                            {isWinner && !isBoothView && (
                              <span className="badge badge-soft-success" style={{ marginLeft: 8 }}>Winner</span>
                            )}
                            <div className="muted" style={{ fontSize: 12 }}>{cand.party_name} ({cand.party_code})</div>
                          </td>
                          <td>
                            <strong style={{ fontSize: 15 }}>{(cand.total_votes || 0).toLocaleString()}</strong>
                          </td>
                        </tr>
                      );
                    })}
                    {displayCandidates.length === 0 && (
                      <tr>
                        <td colSpan={3} className="empty-state">
                          No candidates found for this {isBoothView ? 'booth' : 'ward'}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right Side: Bar Chart */}
              <div className="ward-chart-side">
                <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>
                  {isBoothView ? 'Booth Vote Distribution (Moderator Verified)' : 'Ward Report Vote Distribution'}
                </h4>
                {displayCandidates.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={displayCandidates}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: -20, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="party_code" type="category" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value) => [value.toLocaleString(), 'Votes']}
                        cursor={{ fill: '#f8f9fa' }}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="total_votes" fill="#556ee6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No data to display
                  </div>
                )}
              </div>
            </div>
          );
        })() : null}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header responsive-header">
          <div className="header-title-group">
            <h2>Party-wise seat standings</h2>
          </div>

          {/* Main Page LGA Dropdown with Clear Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CustomSelect
              className="filter-select-responsive"
              placeholder="All LGAs (Global Standings)"
              options={allLgas}
              value={partyLgaFilter}
              onChange={e => {
                setPartyLgaFilter(e.target.value);
                setPartyCurrentPage(1);
              }}
              style={{ maxWidth: '240px' }}
            />
            {partyLgaFilter && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPartyLgaFilter('');
                  setPartyCurrentPage(1);
                }}
                style={{
                  whiteSpace: 'nowrap',
                  height: '38px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '600'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="party-standings-grid">
          {/* Table Column */}
          <div className="party-list-side">
            <div className="table-wrap" style={{ flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Party</th>
                    <th>Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // Render 4 placeholder skeleton rows
                    [...Array(4)].map((_, i) => (
                      <tr key={`skeleton-row-${i}`}>
                        <td><div className="skeleton-circle" style={{ width: 32, height: 32 }} /></td>
                        <td><div className="skeleton-box" style={{ width: '70%', height: 16 }} /></td>
                        <td><div className="skeleton-box" style={{ width: 55, height: 20, borderRadius: 12 }} /></td>
                      </tr>
                    ))
                  ) : (
                    paginatedLeaderboard.map((party) => (
                      <tr key={party.party_id}>
                        <td>
                          {party.party_icon_url
                            ? <img src={party.party_icon_url} alt="" className="avatar-sm" />
                            : <span className="avatar-title">{party.party_name?.charAt(0)}</span>}
                        </td>
                        <td>
                          <strong>{party.party_name}</strong> <span className="muted">({party.party_code})</span>
                        </td>
                        <td>
                          <span className="badge badge-soft-primary">{party.seats_won} seats</span>
                        </td>
                      </tr>
                    ))
                  )}
                  {!loading && paginatedLeaderboard.length === 0 && (
                    <tr><td colSpan={3} className="empty-state">No results yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Column */}
          <div className="party-chart-side">
            <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>Seat Distribution</h4>
            <div style={{ flex: 1, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? (
                // Circular Skeleton matching the Pie Chart boundary
                <div className="skeleton-circle" style={{ width: 180, height: 180 }} />
              ) : paginatedLeaderboard.filter(p => p.seats_won > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paginatedLeaderboard.filter(p => p.seats_won > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="seats_won"
                      nameKey="party_code"
                    >
                      {paginatedLeaderboard.filter(p => p.seats_won > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Seats`, 'Won']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No seats won yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 10-item Pagination Controls integrated inside the list side */}
        {partyLgaFilter && totalPartyPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '16px 0', borderTop: '1px solid #e2e5f1' }}>
            <button type="button" className="btn btn-outline btn-sm" disabled={partyCurrentPage === 1} onClick={() => setPartyCurrentPage(p => Math.max(1, p - 1))}>
              &larr; Prev
            </button>
            <span className="muted" style={{ fontSize: 13 }}>Page {partyCurrentPage} of {totalPartyPages}</span>
            <button type="button" className="btn btn-outline btn-sm" disabled={partyCurrentPage === totalPartyPages} onClick={() => setPartyCurrentPage(p => Math.min(totalPartyPages, p + 1))}>
              Next &rarr;
            </button>
          </div>
        )}
      </div>

  {/* Party Breakdown Modal */ }
  {
    selectedParty && (
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
    )
  }

  {/* All Wards Detailed Modal */ }
  {
    showWardModal && (
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
    )
  }





  {/* Ward Candidate Standings Modal (Sorted Descending by Votes) */ }
  {
    selectedWardDetail && (
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
    )
  }

    </div >
  );
}