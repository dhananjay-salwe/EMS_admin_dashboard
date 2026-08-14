import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

export default function OperatorManagement() {
  const [operators, setOperators] = useState([]);
  const [booths, setBooths] = useState([]);
  const [formData, setFormData] = useState({ full_name: '', username: '', password: '', assigned_booth_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
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
            <span className="muted">{operators.length} total</span>
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
                {operators.map(op => (
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
                {operators.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No booth officers registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}