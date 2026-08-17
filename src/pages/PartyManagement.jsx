import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

export default function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({ party_name: '', party_code: '', party_icon_url: '' });
  const [iconFile, setIconFile] = useState(null); // State for direct file upload
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState({}); // Track broken image links
  const [fileInputKey, setFileInputKey] = useState(0); // Bump to force the file input to visually clear

  const fetchParties = async () => {
    const data = await apiCall('/parties/all');
    if (data.success) setParties(data.parties);
  };

  useEffect(() => { fetchParties(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ party_name: '', party_code: '', party_icon_url: '' });
    setIconFile(null);
    setFileInputKey(k => k + 1);
  };

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Switch to FormData to support file uploads
    const payload = new FormData();
    payload.append('party_name', formData.party_name);
    payload.append('party_code', formData.party_code);
    payload.append('party_icon_url', formData.party_icon_url);
    if (iconFile) {
      payload.append('icon_file', iconFile);
    }

    if (editingId) {
      await apiCall(`/parties/${editingId}`, { method: 'PUT', body: payload });
    } else {
      await apiCall('/parties/add', { method: 'POST', body: payload });
    }
    setSubmitting(false);
    resetForm();
    fetchParties();
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ party_name: p.party_name, party_code: p.party_code, party_icon_url: p.party_icon_url || '' });
    setIconFile(null);
    setFileInputKey(k => k + 1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this party? All associated candidates will also be removed.')) {
      await apiCall(`/parties/${id}`, { method: 'DELETE' });
      fetchParties();
    }
  };

  return (
    <div>
      <div className="page-title-box">
        <div>

          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Political Parties</span>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <div className="card-header"><h2>{editingId ? 'Edit political party' : 'Add political party'}</h2></div>
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
                <label className="form-label">Party Code / Abbreviation (e.g. APC, PDP, LP)</label>
                <input
                  type="text" required className="form-control"
                  value={formData.party_code}
                  onChange={e => setFormData({ ...formData, party_code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Party Symbol URL (optional)</label>
                <input
                  type="text" className="form-control"
                  value={formData.party_icon_url}
                  placeholder="https://..."
                  onChange={e => setFormData({ ...formData, party_icon_url: e.target.value })}
                />
              </div>

              <div className="form-divider">OR</div>

              <div className="form-group">
                <label className="form-label">Upload image from device</label>
                <input
                  key={fileInputKey}
                  type="file" accept="image/*" className="form-control"
                  onChange={e => setIconFile(e.target.files[0] || null)}
                />
                {iconFile && (
                  <div className="file-preview">
                    <img src={URL.createObjectURL(iconFile)} alt="" />
                    <span>{iconFile.name}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 20 }}>
                {submitting ? 'Saving…' : editingId ? 'Update Party' : 'Create Party'}
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
            <h2>Registered political parties</h2>
            <span className="muted">{parties.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Party Name</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.party_icon_url && !imageErrors[p.id] ? (
                        <img
                          src={p.party_icon_url}
                          alt=""
                          className="avatar-xs"
                          onError={() => handleImageError(p.id)}
                        />
                      ) : (
                        <span className="avatar-title">{p.party_name?.charAt(0)}</span>
                      )}
                    </td>
                    <td><strong>{p.party_name}</strong></td>
                    <td><span className="badge badge-soft-secondary">{p.party_code}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {parties.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No parties registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}