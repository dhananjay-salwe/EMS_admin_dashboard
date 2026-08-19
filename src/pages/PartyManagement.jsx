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

const SORT_OPTIONS = [
  { value: 'party_name-asc', label: 'Party (A–Z)' },
  { value: 'party_name-desc', label: 'Party (Z–A)' },
  { value: 'party_code-asc', label: 'Code (A–Z)' },
  { value: 'party_code-desc', label: 'Code (Z–A)' },
];

export default function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({ party_name: '', party_code: '', party_icon_url: '' });
  const [iconFile, setIconFile] = useState(null); // State for direct file upload
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState({}); // Track broken image links
  const [fileInputKey, setFileInputKey] = useState(0); // Bump to force the file input to visually clear

  const [sortKey, setSortKey] = useState('party_name-asc');

  const fetchParties = async () => {
    const data = await apiCall('/parties/all');
    if (data.success) setParties(data.parties);
  };

  useEffect(() => { fetchParties(); }, []);

  const [sortField, sortDir] = sortKey.split('-');
  const sortedParties = [...parties].sort((a, b) => {
    const cmp = (a[sortField] || '').localeCompare(b[sortField] || '');
    return sortDir === 'desc' ? -cmp : cmp;
  });

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
      {/* <div className="page-title-box">
        <div>

          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Political Parties</span>
          </div>
        </div>
      </div> */}

      <div className="two-col-grid two-col-grid--form-table">
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
                <label className="form-label">Party Code / Abbreviation (e.g. APC)</label>
                <input
                  type="text" required className="form-control"
                  value={formData.party_code}
                  onChange={e => setFormData({ ...formData, party_code: e.target.value })}
                />
              </div>
              {/* <div className="form-group">
                <label className="form-label">Party Symbol URL (optional)</label>
                <input
                  type="text" className="form-control"
                  value={formData.party_icon_url}
                  placeholder="https://..."
                  onChange={e => setFormData({ ...formData, party_icon_url: e.target.value })}
                />
              </div> */}

              {/* <div className="form-divider">OR</div> */}

              <div className="form-group">
                <label className="form-label">Upload Party Image from device</label>
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
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2>Registered political parties</h2>
              <span className="muted">{parties.length} total</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Sort by
              </span>
              <select
                className="form-control ward-sort-select"
                value={sortKey}
                onChange={e => setSortKey(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
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
                {sortedParties.map(p => (
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
  <button className="btn-icon" style={{ ...actionIconStyle('primary'), marginRight: 8 }} title="Edit" aria-label="Edit party" onClick={() => handleEdit(p)}>
    <EditIcon />
  </button>
  <button className="btn-icon" style={actionIconStyle('danger')} title="Delete" aria-label="Delete party" onClick={() => handleDelete(p.id)}>
    <DeleteIcon />
  </button>
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