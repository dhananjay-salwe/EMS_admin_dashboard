import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const PAGE_SIZE = 6;

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    state_name: '',
    lga_name: '',
    ward_name: '',
    booth_name: '',
    unique_booth_code: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter & search state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLocations = async () => {
    const data = await apiCall('/locations/all');
    if (data.success) setLocations(data.locations);
  };

  useEffect(() => { fetchLocations(); }, []);

  // Reset to page 1 whenever a filter/search value changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterState, filterLga, filterWard, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/locations/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      setFormData({ state_name: '', lga_name: '', ward_name: '', booth_name: '', unique_booth_code: '' });
      fetchLocations();
    } else {
      alert(res.message);
    }
  };

  const handleDeleteBooth = async (boothId) => {
    if (window.confirm('Delete this polling booth?')) {
      await apiCall(`/locations/booth/${boothId}`, { method: 'DELETE' });
      fetchLocations();
    }
  };

  const booths = locations.filter(l => l.booth_id);

  // ---- Filter option lists (cascading State -> LGA -> Ward), derived from all location records ----
  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    locations
      .filter(l => !filterState || l.state_name === filterState)
      .map(l => l.lga_name)
      .filter(Boolean)
  )].sort();

  const wardOptions = [...new Set(
    locations
      .filter(l => (!filterState || l.state_name === filterState) && (!filterLga || l.lga_name === filterLga))
      .map(l => l.ward_name)
      .filter(Boolean)
  )].sort();

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

  // ---- Apply filters + search (booth name or booth code) ----
  const filteredBooths = booths.filter(l => {
    if (filterState && l.state_name !== filterState) return false;
    if (filterLga && l.lga_name !== filterLga) return false;
    if (filterWard && l.ward_name !== filterWard) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches =
        l.booth_name?.toLowerCase().includes(term) ||
        l.unique_booth_code?.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredBooths.length / PAGE_SIZE));
  const pageBooths = filteredBooths.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Location &amp; Booths</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Location & Booths</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 1.8fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2>Add geographic polling unit</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">State Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.state_name}
                  onChange={e => setFormData({ ...formData, state_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">LGA (Local Government Area / District)</label>
                <input
                  type="text" required className="form-control"
                  value={formData.lga_name}
                  onChange={e => setFormData({ ...formData, lga_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ward (Area / Seat)</label>
                <input
                  type="text" required className="form-control"
                  value={formData.ward_name}
                  onChange={e => setFormData({ ...formData, ward_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Polling Unit Name (Booth)</label>
                <input
                  type="text" required className="form-control"
                  value={formData.booth_name}
                  onChange={e => setFormData({ ...formData, booth_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unique Booth Code</label>
                <input
                  type="text" required className="form-control"
                  value={formData.unique_booth_code}
                  onChange={e => setFormData({ ...formData, unique_booth_code: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Hierarchy'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Registered polling units</h2>
            <span className="muted">{filteredBooths.length} of {booths.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>LGA</th>
                  <th>Ward</th>
                  <th>Booth Code &amp; Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageBooths.map(l => (
                  <tr key={l.booth_id}>
                    <td>{l.state_name}</td>
                    <td>{l.lga_name}</td>
                    <td>{l.ward_name}</td>
                    <td><strong>{l.unique_booth_code}</strong> — {l.booth_name}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooth(l.booth_id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredBooths.length === 0 && booths.length > 0 && (
                  <tr><td colSpan={5} className="empty-state">No polling units match the selected filters.</td></tr>
                )}
                {booths.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No polling units registered yet.</td></tr>
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
              <label className="form-label">Search Booth</label>
              <input
                type="text" className="form-control" placeholder="Search name or code…"
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
                {wardOptions.map(w => <option key={w} value={w}>{w}</option>)}
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