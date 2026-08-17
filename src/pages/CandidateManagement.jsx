import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const PAGE_SIZE = 6;

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({ candidate_name: '', party_id: '', ward_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter & search state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    const candRes = await apiCall('/candidates/all');
    if (candRes.success) setCandidates(candRes.candidates);

    const partyRes = await apiCall('/parties/all');
    if (partyRes.success) setParties(partyRes.parties);

    const locRes = await apiCall('/locations/all');
    if (locRes.success) {
      // Get unique wards
      const uniqueWards = [];
      const seen = new Set();
      locRes.locations.forEach(l => {
        if (l.ward_id && !seen.has(l.ward_id)) {
          seen.add(l.ward_id);
          uniqueWards.push(l);
        }
      });
      setLocations(uniqueWards);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Reset to page 1 whenever a filter/search value changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterState, filterLga, filterWard, searchTerm]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ candidate_name: '', party_id: '', ward_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (editingId) {
      await apiCall(`/candidates/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
    } else {
      await apiCall('/candidates/add', { method: 'POST', body: JSON.stringify(formData) });
    }
    setSubmitting(false);
    resetForm();
    fetchData();
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({ candidate_name: c.candidate_name, party_id: c.party_id, ward_id: c.ward_id });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this candidate?')) {
      await apiCall(`/candidates/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // ---- Filter option lists (cascading State -> LGA -> Ward), derived from ward-level locations ----
  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    locations
      .filter(l => !filterState || l.state_name === filterState)
      .map(l => l.lga_name)
      .filter(Boolean)
  )].sort();

  const wardOptions = locations
    .filter(l => (!filterState || l.state_name === filterState) && (!filterLga || l.lga_name === filterLga))
    .sort((a, b) => a.ward_name.localeCompare(b.ward_name));

  const handleFilterStateChange = (value) => {
    setFilterState(value);
    setFilterLga('');
    setFilterWard('');
  };

  const handleFilterLgaChange = (value) => {
    setFilterLga(value);
    setFilterWard('');
  };

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterState || filterLga || filterWard || searchTerm;

  // ---- Apply filters + search ----
  const filteredCandidates = candidates.filter(c => {
    if (filterState && c.state_name !== filterState) return false;
    if (filterLga && c.lga_name !== filterLga) return false;
    if (filterWard && c.ward_name !== filterWard) return false;
    if (searchTerm && !c.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const pageCandidates = filteredCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Candidates</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Candidates</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 1.8fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2>{editingId ? 'Edit candidate' : 'Register candidate'}</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.candidate_name}
                  onChange={e => setFormData({ ...formData, candidate_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Political Party</label>
                <select
                  className="form-control" required
                  value={formData.party_id}
                  onChange={e => setFormData({ ...formData, party_id: e.target.value })}
                >
                  <option value="">-- Select party --</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.party_name} ({p.party_code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contesting Ward (Constituency / Seat)</label>
                <select
                  className="form-control" required
                  value={formData.ward_id}
                  onChange={e => setFormData({ ...formData, ward_id: e.target.value })}
                >
                  <option value="">-- Select ward --</option>
                  {locations.map(w => (
                    <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.lga_name}, {w.state_name})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Update Candidate' : 'Save Candidate'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={resetForm}>
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Contesting candidates by ward</h2>
            <span className="muted">{filteredCandidates.length} of {candidates.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Party</th>
                  <th>Contested Ward</th>
                  <th>LGA / State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageCandidates.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.candidate_name}</strong></td>
                    <td>
                      <div className="party-cell">
                        {c.party_icon_url && <img src={c.party_icon_url} alt="" className="avatar-xs" />}
                        {c.party_name} ({c.party_code})
                      </div>
                    </td>
                    <td><span className="badge badge-soft-info">{c.ward_name}</span></td>
                    <td>{c.lga_name}, {c.state_name}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && candidates.length > 0 && (
                  <tr><td colSpan={5} className="empty-state">No candidates match the selected filters.</td></tr>
                )}
                {candidates.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No candidates registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '14px 0 4px' }}>
              <button
                type="button" className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="muted">Page {currentPage} of {totalPages}</span>
              <button
                type="button" className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h2>Filter &amp; Search</h2></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Search Candidate</label>
              <input
                type="text" className="form-control" placeholder="Search by name…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <select
                className="form-control"
                value={filterState}
                onChange={e => handleFilterStateChange(e.target.value)}
              >
                <option value="">-- All states --</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">LGA</label>
              <select
                className="form-control"
                value={filterLga}
                onChange={e => handleFilterLgaChange(e.target.value)}
                disabled={!filterState}
              >
                <option value="">-- All LGAs --</option>
                {lgaOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ward</label>
              <select
                className="form-control"
                value={filterWard}
                onChange={e => setFilterWard(e.target.value)}
                disabled={!filterLga}
              >
                <option value="">-- All wards --</option>
                {wardOptions.map(w => (
                  <option key={w.ward_id} value={w.ward_name}>{w.ward_name}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button type="button" className="btn btn-secondary btn-block" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}