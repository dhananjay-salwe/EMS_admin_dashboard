import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

export default function LocationManagement() {
  const [formData, setFormData] = useState({
    state_name: '', lga_name: '', ward_name: '', booth_name: '', unique_booth_code: ''
  });
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    const data = await apiCall('/locations/all');
    if (data.success) setLocations(data.locations);
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/locations/hierarchy', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    setSubmitting(false);

    if (res.success) {
      alert('Location added successfully!');
      setFormData({ state_name: '', lga_name: '', ward_name: '', booth_name: '', unique_booth_code: '' });
      fetchLocations();
    } else {
      alert(res.message);
    }
  };

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

      <div className="two-col-grid">
        <div className="card">
          <div className="card-header"><h2>Add Geographic Polling Unit</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">State Name</label>
                <input
                  type="text" required className="form-control" placeholder="e.g. Lagos"
                  value={formData.state_name}
                  onChange={e => setFormData({ ...formData, state_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">LGA (Local Government Area)</label>
                <input
                  type="text" required className="form-control" placeholder="e.g. Ikeja"
                  value={formData.lga_name}
                  onChange={e => setFormData({ ...formData, lga_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ward (Area)</label>
                <input
                  type="text" required className="form-control" placeholder="e.g. Ward 01"
                  value={formData.ward_name}
                  onChange={e => setFormData({ ...formData, ward_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Polling Unit Name (Booth)</label>
                <input
                  type="text" required className="form-control" placeholder="e.g. Central Primary School"
                  value={formData.booth_name}
                  onChange={e => setFormData({ ...formData, booth_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unique Booth Code</label>
                <input
                  type="text" required className="form-control" placeholder="e.g. BOOTH-LGS-001"
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
            <h2>Registered Polling Units</h2>
            <span className="muted">{locations.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>LGA</th>
                  <th>Ward</th>
                  <th>Booth Code &amp; Name</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc, idx) => (
                  <tr key={idx}>
                    <td>{loc.state_name}</td>
                    <td>{loc.lga_name}</td>
                    <td>{loc.ward_name}</td>
                    <td><strong>{loc.unique_booth_code}</strong> — {loc.booth_name}</td>
                  </tr>
                ))}
                {locations.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No polling units registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}