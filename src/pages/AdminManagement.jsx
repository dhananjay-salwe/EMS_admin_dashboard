import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

export default function AdminManagement({ currentAdminRole }) {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'SubAdmin' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    const data = await apiCall('/admins/all');
    if (data.success) setAdmins(data.admins);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/admins/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      setFormData({ username: '', password: '', role: 'SubAdmin' });
      fetchAdmins();
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this admin account?')) {
      const res = await apiCall(`/admins/${id}`, { method: 'DELETE' });
      if (res.success) fetchAdmins();
    }
  };

  if (currentAdminRole !== 'SuperAdmin') {
    return (
      <div>
        <div className="page-title-box">
          <div>
            <h1>Admin Management</h1>
            <div className="breadcrumb">
              <span>Dashboard</span> / <span className="current">Admin Management</span>
            </div>
          </div>
        </div>
        <div className="alert alert-danger">
          Access denied. Only SuperAdmins can manage admin accounts.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Admin Management</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Admin Management</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <div className="card-header"><h2>Create Admin Account</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text" required className="form-control"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password" required className="form-control"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="SubAdmin">SubAdmin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>System Administrators</h2>
            <span className="muted">{admins.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Date Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((adm) => (
                  <tr key={adm.id}>
                    <td>{adm.id}</td>
                    <td><strong>{adm.username}</strong></td>
                    <td>
                      <span className={`badge ${adm.role === 'SuperAdmin' ? 'badge-soft-success' : 'badge-soft-info'}`}>
                        {adm.role}
                      </span>
                    </td>
                    <td>{new Date(adm.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(adm.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No admin accounts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}