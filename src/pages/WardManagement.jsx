import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function WardManagement() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ state_name: '', lga_name: '', ward_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLocations = async () => {
    const data = await apiCall('/locations/all');
    if (data.success) setLocations(data.locations);
  };

  useEffect(() => { fetchLocations(); }, []);

  // Distinct states and LGAs for dropdown suggestions
  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();
  const lgaOptions = [...new Set(
    locations.filter(l => l.state_name === formData.state_name).map(l => l.lga_name).filter(Boolean)
  )].sort();

  // Extract unique wards list
  const uniqueWards = Array.from(
    new Map(
      locations.filter(l => l.ward_id).map(l => [l.ward_id, { ward_id: l.ward_id, ward_name: l.ward_name, lga_name: l.lga_name, state_name: l.state_name }])
    ).values()
  );

  const filteredWards = uniqueWards.filter(w => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return w.ward_name?.toLowerCase().includes(term) || w.lga_name?.toLowerCase().includes(term) || w.state_name?.toLowerCase().includes(term);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/locations/ward/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      setFormData({ state_name: '', lga_name: '', ward_name: '' });
      fetchLocations();
    } else {
      alert(res.message);
    }
  };

  const handleDeleteWard = async (wardId) => {
    if (window.confirm('Delete this electoral ward?')) {
      await apiCall(`/locations/ward/${wardId}`, { method: 'DELETE' });
      fetchLocations();
    }
  };

  return (
    <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
      <div className="card">
        <div className="card-header"><h2>Create Electoral Ward</h2></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                list="state-list"
                required
                className="form-control"
                placeholder="Select or enter State"
                value={formData.state_name}
                onChange={e => setFormData({ ...formData, state_name: e.target.value, lga_name: '' })}
              />
              <datalist id="state-list">
                {stateOptions.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">LGA (Local Government Area)</label>
              <input
                type="text"
                list="lga-list"
                required
                className="form-control"
                placeholder="Select or enter LGA"
                value={formData.lga_name}
                onChange={e => setFormData({ ...formData, lga_name: e.target.value })}
              />
              <datalist id="lga-list">
                {lgaOptions.map(l => <option key={l} value={l} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Ward Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Ward 01 / Central Ward"
                value={formData.ward_name}
                onChange={e => setFormData({ ...formData, ward_name: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving Ward…' : 'Save Ward'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Electoral Wards</h2>
          <span className="muted">{filteredWards.length} wards</span>
        </div>
        <div className="card-search">
          <input
            type="text"
            className="form-control"
            placeholder="Search ward, LGA, or state…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>LGA</th>
                <th>Ward Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWards.map(w => (
                <tr key={w.ward_id}>
                  <td>{w.state_name}</td>
                  <td>{w.lga_name}</td>
                  <td><strong>{w.ward_name}</strong></td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      title="Delete"
                      onClick={() => handleDeleteWard(w.ward_id)}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredWards.length === 0 && (
                <tr><td colSpan={4} className="empty-state">No wards found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}