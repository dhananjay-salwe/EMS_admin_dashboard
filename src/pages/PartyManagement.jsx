import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

export default function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({ party_name: '', candidate_name: '', party_icon_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchParties = async () => {
    const data = await apiCall('/parties/all');
    if (data.success) setParties(data.parties);
  };

  useEffect(() => { fetchParties(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/parties/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      setFormData({ party_name: '', candidate_name: '', party_icon_url: '' });
      fetchParties();
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      const res = await apiCall(`/parties/${id}`, { method: 'DELETE' });
      if (res.success) fetchParties();
    }
  };

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Political Parties</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Political Parties</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <div className="card-header"><h2>Add Political Party</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Party Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.party_name}
                  onChange={e => setFormData({ ...formData, party_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Candidate Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.candidate_name}
                  onChange={e => setFormData({ ...formData, candidate_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Party Icon URL (Image Link)</label>
                <input
                  type="text" required className="form-control"
                  value={formData.party_icon_url}
                  onChange={e => setFormData({ ...formData, party_icon_url: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Party'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Registered Parties &amp; Candidates</h2>
            <span className="muted">{parties.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Icon</th>
                  <th>Party Name</th>
                  <th>Candidate Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party) => (
                  <tr key={party.id}>
                    <td>{party.id}</td>
                    <td>
                      {party.party_icon_url
                        ? <img src={party.party_icon_url} alt="" className="avatar-xs" />
                        : <span className="avatar-title">{party.party_name?.charAt(0)}</span>}
                    </td>
                    <td><strong>{party.party_name}</strong></td>
                    <td>{party.candidate_name}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(party.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {parties.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No parties registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}