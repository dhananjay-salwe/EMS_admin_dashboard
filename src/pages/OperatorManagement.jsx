import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const PAGE_SIZE = 6;

export default function OperatorManagement() {
  const [operators, setOperators] = useState([]);
  const [booths, setBooths] = useState([]);
  const [formData, setFormData] = useState({ full_name: '', username: '', password: '', assigned_booth_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter & search state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    const opRes = await apiCall('/operators/all');
    if (opRes.success) setOperators(opRes.operators);

    const locRes = await apiCall('/locations/all');
    if (locRes.success) {
      const validBooths = locRes.locations.filter(l => l.booth_id);
      setBooths(validBooths);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Reset to page 1 whenever a filter/search value changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterState, filterLga, filterWard, searchTerm]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ full_name: '', username: '', password: '', assigned_booth_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (editingId) {
      await apiCall(`/operators/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
    } else {
      await apiCall('/operators/add', { method: 'POST', body: JSON.stringify(formData) });
    }
    setSubmitting(false);
    resetForm();
    fetchData();
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setFormData({ full_name: op.full_name, username: op.username, password: '', assigned_booth_id: op.assigned_booth_id || '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this booth Officer?')) {
      await apiCall(`/operators/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // Booth officers don't carry ward/lga/state directly — join them to their
  // assigned booth (which does) so we can filter by location.
  const boothById = booths.reduce((acc, b) => {
    acc[b.booth_id] = b;
    return acc;
  }, {});

  // ---- Filter option lists (cascading State -> LGA -> Ward), derived from booths ----
  const stateOptions = [...new Set(booths.map(b => b.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    booths
      .filter(b => !filterState || b.state_name === filterState)
      .map(b => b.lga_name)
      .filter(Boolean)
  )].sort();

  const wardOptions = [...new Set(
    booths
      .filter(b => (!filterState || b.state_name === filterState) && (!filterLga || b.lga_name === filterLga))
      .map(b => b.ward_name)
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

  // ---- Apply filters + search ----
  const filteredOperators = operators.filter(op => {
    const assignedBooth = boothById[op.assigned_booth_id];

    if (filterState || filterLga || filterWard) {
      // An officer with no assigned booth can't match a location filter
      if (!assignedBooth) return false;
      if (filterState && assignedBooth.state_name !== filterState) return false;
      if (filterLga && assignedBooth.lga_name !== filterLga) return false;
      if (filterWard && assignedBooth.ward_name !== filterWard) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches =
        op.full_name?.toLowerCase().includes(term) ||
        op.username?.toLowerCase().includes(term);
      if (!matches) return false;
    }

    return true;
  });

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredOperators.length / PAGE_SIZE));
  const pageOperators = filteredOperators.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Booth Officer</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Booth Officers</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 1.8fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2>{editingId ? 'Edit booth officer' : 'Register booth officer'}</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">App Username</label>
                <input
                  type="text" required className="form-control"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {editingId ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password" required={!editingId} className="form-control"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Polling Unit / Booth</label>
                <select
                  className="form-control"
                  value={formData.assigned_booth_id}
                  onChange={e => setFormData({ ...formData, assigned_booth_id: e.target.value })}
                >
                  <option value="">-- No assigned booth (operator picks dynamic) --</option>
                  {booths.map(b => (
                    <option key={b.booth_id} value={b.booth_id}>
                      {b.unique_booth_code} — {b.booth_name} ({b.ward_name})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Update Booth Officer' : 'Create Booth Officer'}
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
            <h2>Registered booth officers &amp; booth assignments</h2>
            <span className="muted">{filteredOperators.length} of {operators.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booth Officer</th>
                  <th>Username</th>
                  <th>Assigned Booth</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageOperators.map(op => (
                  <tr key={op.id}>
                    <td>
                      <div className="party-cell">
                        <span className="avatar-title">{op.full_name?.charAt(0)}</span>
                        {op.full_name}
                      </div>
                    </td>
                    <td>{op.username}</td>
                    <td>
                      {op.unique_booth_code ? (
                        <span><strong className="text-primary">{op.unique_booth_code}</strong> ({op.booth_name})</span>
                      ) : (
                        <span className="badge badge-soft-warning">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => handleEdit(op)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(op.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredOperators.length === 0 && operators.length > 0 && (
                  <tr><td colSpan={4} className="empty-state">No booth officers match the selected filters.</td></tr>
                )}
                {operators.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No booth officers registered yet.</td></tr>
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
              <label className="form-label">Search Officer</label>
              <input
                type="text" className="form-control" placeholder="Search name or username…"
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