import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';
import {toast} from 'react-hot-toast';

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

// FEATURE: Replicated search, sort, and filter helpers from AuditSubmissions.jsx
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const Chip = ({ label, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#eef1fb', color: '#556ee6', borderRadius: 16,
    padding: '4px 10px', fontSize: 13, fontWeight: 500,
  }}>
    {label}
    <button
      type="button" onClick={onRemove}
      style={{ border: 'none', background: 'transparent', color: '#556ee6', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
      aria-label={`Remove ${label} filter`}
    >
      ×
    </button>
  </span>
);

const SORT_OPTIONS = [
  { value: 'asc', label: 'Name (A–Z)' },
  { value: 'desc', label: 'Name (Z–A)' },
];

const iconBtnStyle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid ' + (active ? 'var(--bs-primary, #556ee6)' : '#e2e5f1'),
  background: active ? 'var(--bs-primary, #556ee6)' : '#fff',
  color: active ? '#fff' : '#556ee6',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
  boxSizing: 'border-box'
});

export default function AdminManagement({ currentAdminRole }) {
  const [admins, setAdmins] = useState([]);
  
  // FIX: Updated form data fields to support rich profile schema
  const [formData, setFormData] = useState({ full_name: '', email: '', contact_number: '+234', password: '', role: 'State Headquarter Officer', lga_id: '' });
  
  // FEATURE: New states for LGAs list and current user under edit modal
  const [lgas, setLgas] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  
  // FEATURE: Search, Sort & Filter states replicated from AuditSubmissions.jsx
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
  const [filterRole, setFilterRole] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  const [deletingUser, setDeletingUser] = useState(null);

  const fetchAdmins = async () => {
    try { 
    const data = await apiCall('/admins/all');
    if (data.success) setAdmins(data.admins);
    } catch (error) { 
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // FEATURE: Fetch LGAs list from backend API server
  const fetchLgas = async () => {
    try { 
    const data = await apiCall('/admins/lga');
    if (data.success) setLgas(data.lgas);
    } catch (error) { 
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /*
  useEffect(() => { fetchAdmins(); }, []);
  */
  // FIX: Run initial fetch for both admins list and LGAs list
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchAdmins(),fetchLgas()]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  // FEATURE: Auto-generate password from first name and last 3 digits of phone number
  const generatePassword = () => {
    const firstName = formData.full_name.trim().split(' ')[0] || '';
    const cleanContact = formData.contact_number.replace(/\D/g, '');
    const last3Digits = cleanContact.slice(-3);
    setFormData(prev => ({
      ...prev,
      password: `${firstName}${last3Digits}`
    }));
  };

  // FEATURE: Auto-generate password in edit user modal from first name and last 3 digits of contact
  const generateEditPassword = () => {
    if (!editingUser) return;
    const firstName = (editingUser.full_name || '').trim().split(' ')[0] || '';
    const cleanContact = (editingUser.contact_number || '').replace(/\D/g, '');
    const last3Digits = cleanContact.slice(-3);
    setEditingUser(prev => ({
      ...prev,
      password: `${firstName}${last3Digits}`
    }));
  };

  // FIX: Added validation block for email format, phone length, and conditional LGA selection
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Verify contact number length
    const digitsOnly = formData.contact_number.startsWith('+234')
      ? formData.contact_number.slice(4)
      : formData.contact_number;

    if (digitsOnly.length !== 10) {
      toast.error('Please enter a valid 10-digit contact number (excluding +234 prefix).');
      return;
    }

    // Verify LGA Officer lga_id selection
    if (formData.role === 'LGA Officer' && !formData.lga_id) {
      toast.error('LGA selection is required for LGA Officer accounts.');
      return;
    }

    setSubmitting(true);
    const res = await apiCall('/admins/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      toast.success('User account created successfully!');
      setFormData({ full_name: '', email: '', contact_number: '+234', password: '', role: 'State Headquarter Officer', lga_id: '' });
      fetchAdmins();
    } else {
      toast.error(res.message || 'Failed to create user.');
    }
  };

  // FIX: Save edited user with validation checks on email format, phone length, and required LGA
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUser.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Verify contact number length
    const digitsOnly = (editingUser.contact_number || '').startsWith('+234')
      ? editingUser.contact_number.slice(4)
      : editingUser.contact_number;

    if (digitsOnly.length !== 10) {
      toast.error('Please enter a valid 10-digit contact number (excluding +234 prefix).');
      return;
    }

    // Verify LGA Officer lga_id selection
    if (editingUser.role === 'LGA Officer' && !editingUser.lga_id) {
      toast.error('LGA selection is required for LGA Officer accounts.');
      return;
    }

    const res = await apiCall(`/admins/${editingUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        full_name: editingUser.full_name,
        email: editingUser.email,
        contact_number: editingUser.contact_number,
        role: editingUser.role,
        lga_id: editingUser.lga_id,
        password: editingUser.password || ''
      })
    });

    if (res.success) {
      toast.success('User details updated successfully!');
      setEditingUser(null);
      fetchAdmins();
    } else {
      toast.error(res.message || 'Failed to update user.');
    }
  };

// 1. Opens the modal and sets the target user
  const handleDelete = (user) => {
    setDeletingUser(user);
  };

  // 2. Fires when the user clicks "Confirm" inside the modal
  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    const res = await apiCall(`/admins/${deletingUser.id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('User account deleted successfully!');
      fetchAdmins();
    } else {
      toast.error(res.message || 'Failed to delete user.');
    }
    // Close the modal
    setDeletingUser(null);
  };

  // Only one SuperAdmin should exist — once one is present, remove it from
  // the create-account role options so a second one can't be added here.
  const hasSuperAdmin = admins.some(a => a.role === 'SuperAdmin');

  // FEATURE: Filter and Sort logic derived variables based on state config
  const filteredAndSortedUsers = admins
    .filter(user => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesFullName = (user.full_name || '').toLowerCase().includes(term);
        const matchesEmail = (user.email || '').toLowerCase().includes(term);
        if (!matchesFullName && !matchesEmail) return false;
      }
      if (filterRole && user.role !== filterRole) return false;
      return true;
    })
    .sort((a, b) => {
      const field = sortConfig.key || 'full_name';
      const valA = a[field] || '';
      const valB = b[field] || '';
      const cmp = String(valA).localeCompare(String(valB));
      return sortConfig.direction === 'desc' ? -cmp : cmp;
    });

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

      {/* FEATURE: Applied overflow visible style to ensure LGA dropdown is not clipped */}
      <div className="two-col-grid two-col-grid--form-table" style={{ overflow: 'visible' }}>
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header"><h2>Create User Account</h2></div>
          <div className="card-body" style={{ overflow: 'visible' }}>
            
            {/* FIX: Form containing required input indicators, read-only contact code prefix display, and drop-down clipping overrides */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <CustomSelect
                  value={formData.role}
                  options={hasSuperAdmin ? ['State Headquarter Officer', 'General Collation Center Administrator', 'LGA Officer'] : ['State Headquarter Officer', 'General Collation Center Administrator', 'LGA Officer', 'SuperAdmin']}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                />
                {hasSuperAdmin && formData.role === 'SuperAdmin' && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    A SuperAdmin account already exists — only one is allowed.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email" required className="form-control"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <div style={{ display: 'flex' }}>
                  <span style={{
                    background: '#f1f2f6',
                    border: '1px solid #ced4da',
                    borderRight: 'none',
                    borderRadius: '6px 0 0 6px',
                    padding: '8px 12px',
                    color: '#495057',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    +234
                  </span>
                  <input
                    type="text"
                    required
                    className="form-control"
                    style={{
                      borderRadius: '0 6px 6px 0',
                      flex: 1
                    }}
                    placeholder="e.g. 8031234567"
                    value={formData.contact_number.startsWith('+234') ? formData.contact_number.slice(4) : formData.contact_number}
                    onChange={e => {
                      const cleanVal = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, contact_number: `+234${cleanVal}` });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" required className="form-control"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={generatePassword}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>

              {/* FIX: Add relative positioning with high z-index stacking context to LGA dropdown wrapper to prevent clipping */}
              {formData.role === 'LGA Officer' && (
                <div className="form-group" style={{ position: 'relative', zIndex: 999 }}>
                  <label className="form-label">LGA</label>
                  <CustomSelect
                    value={formData.lga_id}
                    options={lgas.map(lga => ({ value: lga.id, label: lga.lga_name }))}
                    onChange={e => setFormData({ ...formData, lga_id: e.target.value })}
                    placeholder="Select LGA..."
                    style={{ width: '100%' }}
                    dropdownStyle={{
                      position: 'absolute',
                      bottom: '100%',
                      top: 'auto',
                      zIndex: 9999,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      width: '100%',
                      left: 0,
                      right: 0,
                      boxSizing: 'border-box',
                      marginTop: '0px',
                      marginBottom: '4px'
                    }}
                  />
                  <input
                    type="text"
                    required
                    value={formData.lga_id || ''}
                    onChange={() => {}}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', bottom: 0 }}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ overflow: 'visible' }}>
          {/* FIX: Render general System Users list table with search input, sort selectors, filter toolbar, and full profile column definitions */}
          <div className="card-header responsive-header" style={{ overflow: 'visible' }}>
            <div className="header-title-group">
              <h2>System Users</h2>
              <span className="muted">{filteredAndSortedUsers.length} of {admins.length} total</span>
            </div>
            <div className="header-controls-group">
              <input
                type="text"
                className="form-control search-input-responsive"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="sort-filter-actions">
                <span className="sort-label-text">
                  Sort by
                </span>
                <CustomSelect
                  className="sort-select-responsive"
                  value={sortConfig.direction}
                  options={SORT_OPTIONS}
                  onChange={e => setSortConfig({ ...sortConfig, direction: e.target.value })}
                />
                <button
                  type="button" title="Filter" aria-label="Toggle filter"
                  style={iconBtnStyle(filterOpen || filterRole)}
                  onClick={() => setFilterOpen(o => !o)}
                >
                  <FilterIcon />
                </button>
              </div>
            </div>
          </div>

          {filterOpen && (
            <div className="filter-toolbar" style={{ padding: '12px 16px 12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', overflow: 'visible' }}>
              {filterRole ? (
                <Chip label={`Role: ${filterRole}`} onRemove={() => setFilterRole('')} />
              ) : (
                <CustomSelect
                  className="filter-select-responsive"
                  value={filterRole}
                  placeholder="Select Role..."
                  options={[
                    { value: 'State Headquarter Officer', label: 'State Headquarter Officer' },
                    { value: 'General Collation Center Administrator', label: 'General Collation Center Administrator' },
                    { value: 'LGA Officer', label: 'LGA Officer' },
                    { value: 'SuperAdmin', label: 'SuperAdmin' }
                  ]}
                  onChange={e => setFilterRole(e.target.value)}
                  style={{ width: '220px' }}
                  dropdownStyle={{
                    position: 'absolute',
                    zIndex: 999,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                />
              )}
            </div>
          )}

          {/* FIX: Use responsive no-scrollbar wrapper class */}
          <div className="table-wrap table-wrap-no-scrollbar">
            {/* FIX: Apply responsive custom padding styles */}
            <table className="data-table admin-management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Render 5 skeleton rows while fetching
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td><div className="skeleton-box" style={{ width: 20, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 140, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 160, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 100, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 110, height: 20, borderRadius: 12 }} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
                          <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredAndSortedUsers.map((adm, index) => (
                    <tr key={adm.id}>
                      <td>{index + 1}</td>
                      <td>{adm.full_name || '-'}</td>
                      <td>{adm.email || '-'}</td>
                      <td>{adm.contact_number || '-'}</td>
                      <td>
                        <span className={`badge ${adm.role === 'SuperAdmin' ? 'badge-soft-success' : 'badge-soft-info'}`}>
                          {adm.role}
                        </span>
                      </td>
                      <td>
                        {adm.role === 'SuperAdmin' ? (
                          <span className="muted" style={{ fontSize: 12 }}>Protected</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-icon"
                              style={actionIconStyle('primary')}
                              title="Edit"
                              aria-label="Edit user"
                              onClick={() => setEditingUser(adm)}
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="btn-icon"
                              style={actionIconStyle('danger')}
                              title="Delete"
                              aria-label="Delete admin"
                              onClick={() => handleDelete(adm)}
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredAndSortedUsers.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No matching user accounts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

{/* FEATURE: Custom Delete Confirmation Modal */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeletingUser(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the account for <strong>{deletingUser.full_name || deletingUser.email}</strong>?</p>
              <p className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeletingUser(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: '#f46a6a', borderColor: '#f46a6a' }} onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* FEATURE: Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ overflow: 'visible' }}>
            <div className="modal-header">
              <h3>Edit User Details</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ overflow: 'visible' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text" required className="form-control"
                    value={editingUser.full_name || ''}
                    onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email" required className="form-control"
                    value={editingUser.email || ''}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{
                      background: '#f1f2f6',
                      border: '1px solid #ced4da',
                      borderRight: 'none',
                      borderRadius: '6px 0 0 6px',
                      padding: '8px 12px',
                      color: '#495057',
                      display: 'flex',
                      alignItems: 'center',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      +234
                    </span>
                    <input
                      type="text"
                      required
                      className="form-control"
                      style={{
                        borderRadius: '0 6px 6px 0',
                        flex: 1
                      }}
                      placeholder="e.g. 8031234567"
                      value={(editingUser.contact_number || '').startsWith('+234') ? editingUser.contact_number.slice(4) : editingUser.contact_number}
                      onChange={e => {
                        const cleanVal = e.target.value.replace(/\D/g, '');
                        setEditingUser({ ...editingUser, contact_number: `+234${cleanVal}` });
                      }}
                    />
                  </div>
                </div>

                {/* FEATURE: Password field in Edit Modal with Auto-Generate and Helper text */}
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter new password"
                      value={editingUser.password || ''}
                      onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={generateEditPassword}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px', fontSize: '11.5px' }}>
                    Leave blank to keep the current password.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <CustomSelect
                    value={editingUser.role}
                    options={['State Headquarter Officer', 'General Collation Center Administrator', 'LGA Officer']}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  />
                </div>
                
                {/* FIX: Add relative positioning with high z-index stacking context to Edit Modal LGA dropdown wrapper to prevent clipping */}
                {editingUser.role === 'LGA Officer' && (
                  <div className="form-group" style={{ position: 'relative', zIndex: 999 }}>
                    <label className="form-label">LGA</label>
                    <CustomSelect
                      value={editingUser.lga_id || ''}
                      options={lgas.map(lga => ({ value: lga.id, label: lga.lga_name }))}
                      onChange={e => setEditingUser({ ...editingUser, lga_id: e.target.value })}
                      placeholder="Select LGA..."
                      style={{ width: '100%' }}
                      dropdownStyle={{
                        position: 'absolute',
                        bottom: '100%',
                        top: 'auto',
                        zIndex: 9999,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        width: '100%',
                        left: 0,
                        right: 0,
                        boxSizing: 'border-box',
                        marginTop: '0px',
                        marginBottom: '4px'
                      }}
                    />
                    <input
                      type="text"
                      required
                      value={editingUser.lga_id || ''}
                      onChange={() => {}}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', bottom: 0 }}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}