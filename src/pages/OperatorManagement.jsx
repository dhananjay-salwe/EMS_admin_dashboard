import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

export default function OperatorManagement() {
  const [operators, setOperators] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchOperators = async () => {
    const data = await apiCall('/operators/all');
    if (data.success) setOperators(data.operators);
  };

  useEffect(() => { fetchOperators(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/operators/add', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    setSubmitting(false);

    if (res.success) {
      alert('Operator added!');
      setFormData({ username: '', password: '', full_name: '' });
      fetchOperators();
    } else {
      alert(res.message);
    }
  };

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Booth Operators</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Operators</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <div className="card-header"><h2>Register New Operator</h2></div>
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
                <label className="form-label">Username (For App Login)</label>
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
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Operator'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Registered Operators</h2>
            <span className="muted">{operators.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>App Username</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.id}>
                    <td>{op.id}</td>
                    <td>
                      <div className="party-cell">
                        <span className="avatar-title">{op.full_name?.charAt(0)}</span>
                        {op.full_name}
                      </div>
                    </td>
                    <td>{op.username}</td>
                  </tr>
                ))}
                {operators.length === 0 && (
                  <tr><td colSpan={3} className="empty-state">No operators registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}