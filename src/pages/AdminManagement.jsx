import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const actionIconStyle = (variant) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid ' + (variant === 'danger' ? '#f46a6a' : '#556ee6'),
  background: '#fff',
  color: variant === 'danger' ? '#f46a6a' : '#556ee6',
  cursor: 'pointer',
});

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

  // Only one SuperAdmin should exist — once one is present, remove it from
  // the create-account role options so a second one can't be added here.
  const hasSuperAdmin = admins.some(a => a.role === 'SuperAdmin');

  if (currentAdminRole !== 'SuperAdmin') {
    return (
      <div>
        <div className="page-title-box">
          <div>
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
      {/* <div className="page-title-box">
        <div>

          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Admin Management</span>
          </div>
        </div>
      </div> */}

      <div className="two-col-grid two-col-grid--form-table">
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
                  {!hasSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                </select>
                {hasSuperAdmin && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    A SuperAdmin account already exists — only one is allowed.
                  </div>
                )}
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
                {admins.map((adm, index) => (
                  <tr key={adm.id}>
                    <td>{index + 1}</td>
                    <td><strong>{adm.username}</strong></td>
                    <td>
                      <span className={`badge ${adm.role === 'SuperAdmin' ? 'badge-soft-success' : 'badge-soft-info'}`}>
                        {adm.role}
                      </span>
                    </td>
                    <td>{new Date(adm.created_at).toLocaleDateString()}</td>
                    <td>
                      {adm.role === 'SuperAdmin' ? (
                        <span className="muted" style={{ fontSize: 12 }}>Protected</span>
                      ) : (
                        <button className="btn-icon" style={actionIconStyle('danger')} title="Delete" aria-label="Delete party" onClick={() => handleDelete(p.id)}>
                          <DeleteIcon />
                        </button>
                      )}
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