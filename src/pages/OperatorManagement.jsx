import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'react-hot-toast';
import { exportToCSV, exportToExcel } from '../utils/exportImportUtils';

const PAGE_SIZE = 6;

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

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

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

const IconChevron = (props) => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" {...props}>
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function SearchableSelect({ value, onChange, options = [], placeholder = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectOption = (opt) => {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="combobox" ref={wrapRef}>
      <input
        type="text"
        className="form-control combobox-input"
        value={open ? query : (selected ? selected.label : '')}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } }}
      />
      <button
        type="button"
        className="combobox-toggle"
        tabIndex={-1}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle options"
      >
        <IconChevron className={open ? 'combobox-chevron open' : 'combobox-chevron'} />
      </button>

      {open && (
        <div className="combobox-panel">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <button
                type="button"
                key={opt.value || 'none'}
                className={`combobox-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => selectOption(opt)}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className="combobox-empty">No matching booth</div>
          )}
        </div>
      )}
    </div>
  );
}



const SORT_OPTIONS = [
  { value: 'full_name-asc', label: 'Name (A–Z)' },
  { value: 'full_name-desc', label: 'Name (Z–A)' },
  { value: 'username-asc', label: 'Username (A–Z)' },
  { value: 'username-desc', label: 'Username (Z–A)' },
];

export default function OperatorManagement() {
  const [operators, setOperators] = useState([]);
  const [booths, setBooths] = useState([]);
  const [formData, setFormData] = useState({ full_name: '', username: '', password: '', assigned_booth_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [sortKey, setSortKey] = useState('full_name-asc');
  const [deletingOperator, setDeletingOperator] = useState(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };
    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportOpen]);

  const fetchData = async () => {
    try { 
    const opRes = await apiCall('/operators/all');
    if (opRes.success) setOperators(opRes.operators);

    const locRes = await apiCall('/locations/all');
    if (locRes.success) {
      const validBooths = locRes.locations.filter(l => l.booth_id);
      setBooths(validBooths);
    }
  } catch (err) {
    console.error("Error fetching data:", err);
  } finally {
    setLoading(false);
  }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterState, filterLga, filterWard, searchTerm, sortKey]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ full_name: '', username: '', password: '', assigned_booth_id: '' });
  };

  const handleCloseModal = () => {
    resetForm();
    setIsCreateModalOpen(false);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    let res;
    if (editingId) {
      res = await apiCall(`/operators/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
    } else {
      res = await apiCall('/operators/add', { method: 'POST', body: JSON.stringify(formData) });
    }
    
    setSubmitting(false);

    if (res.success) {
      toast.success(editingId ? 'Booth officer updated successfully!' : 'Booth officer registered successfully!');
      resetForm();
      setIsCreateModalOpen(false);
      fetchData();
    } else {
      toast.error(res.message || 'Failed to save booth officer.');
    }
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setFormData({ full_name: op.full_name, username: op.username, password: '', assigned_booth_id: op.assigned_booth_id || '' });
    setIsCreateModalOpen(true);
  };

// 1. Opens the modal and sets the target operator
  const handleDeleteClick = (op) => {
    setDeletingOperator(op);
  };

  // 2. Fires when the user clicks "Confirm" inside the modal
  const handleDelete = async () => {
    if (!deletingOperator) return;
    
    const res = await apiCall(`/operators/${deletingOperator.id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Booth officer deleted successfully!');
      fetchData();
    } else {
      toast.error(res.message || 'Failed to delete booth officer.');
    }
    setDeletingOperator(null);
  };

  const boothById = booths.reduce((acc, b) => {
    acc[b.booth_id] = b;
    return acc;
  }, {});

  const stateOptions = [...new Set(booths.map(b => b.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    booths.filter(b => b.state_name === filterState).map(b => b.lga_name).filter(Boolean)
  )].sort();

  const wardOptions = [...new Set(
    booths.filter(b => b.state_name === filterState && b.lga_name === filterLga).map(b => b.ward_name).filter(Boolean)
  )].sort();

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
  };

  const hasActiveFilters = filterState || filterLga || filterWard;

  // ---- Apply filters + search ----
  const filteredOperators = operators.filter(op => {
    const assignedBooth = boothById[op.assigned_booth_id];

    if (filterState || filterLga || filterWard) {
      // An officer with no assigned booth can't match a location filter
      if (!assignedBooth) return false;
      if (filterState && assignedBooth.state_name !== filterState) return false;
      if (filterLga && assignedBooth.lga_name !== filterLga) return false;
      if (filterWard && assignedBooth.ward_name !== filterWard) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches =
        op.full_name?.toLowerCase().includes(term) ||
        op.username?.toLowerCase().includes(term);
      if (!matches) return false;
    }

    return true;
  });

  const [sortField, sortDir] = sortKey.split('-');
  const sortedOperators = [...filteredOperators].sort((a, b) => {
    const cmp = (a[sortField] || '').localeCompare(b[sortField] || '');
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // Dynamic data export: full list if unfiltered, constrained list if filtered
  const isFiltered = Boolean(hasActiveFilters || (searchTerm && searchTerm.trim()));
  const dataToExport = isFiltered ? sortedOperators : operators;

  const handleExport = (format) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast.error('No booth officers available to export');
      return;
    }

    try {
      const filename = isFiltered ? 'booth_officers_filtered' : 'booth_officers_all';
      const title = isFiltered 
        ? `Booth Officers List (Filtered - ${dataToExport.length} Records)` 
        : `Registered Booth Officers List (All - ${dataToExport.length} Records)`;

      const columns = [
        { label: 'S.No', key: (_, index) => index + 1 },
        { label: 'Full Name', key: 'full_name' },
        { label: 'App Username', key: 'username' },
        { label: 'Assigned Booth Code', key: (op) => op.unique_booth_code || boothById[op.assigned_booth_id]?.unique_booth_code || 'Unassigned' },
        { label: 'Polling Unit / Booth Name', key: (op) => op.booth_name || boothById[op.assigned_booth_id]?.booth_name || 'Unassigned' },
        { label: 'Ward', key: (op) => op.ward_name || boothById[op.assigned_booth_id]?.ward_name || 'N/A' },
        { label: 'LGA', key: (op) => op.lga_name || boothById[op.assigned_booth_id]?.lga_name || 'N/A' },
        { label: 'State', key: (op) => op.state_name || boothById[op.assigned_booth_id]?.state_name || 'N/A' },
      ];

      if (format === 'csv') {
        exportToCSV({
          data: dataToExport,
          columns,
          filename,
          title,
        });
        toast.success(`Exported ${dataToExport.length} booth officers as CSV!`);
      } else if (format === 'excel') {
        exportToExcel({
          data: dataToExport,
          columns,
          filename,
          sheetName: 'Booth Officers',
          title,
        });
        toast.success(`Exported ${dataToExport.length} booth officers as Excel!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export booth officers data');
    } finally {
      setExportOpen(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sortedOperators.length / PAGE_SIZE));
  const pageOperators = sortedOperators.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>

      <div className="card">
          <div className="card-header responsive-header">
            <div className="header-title-group">
              <h2>Registered booth officers</h2>
              <span className="muted">{filteredOperators.length} of {operators.length} total</span>
            </div>
            <div className="header-controls-group">
              <div className="sort-filter-actions">
                <span className="sort-label-text">
                  Sort by
                </span>
                <CustomSelect
                  className="sort-select-responsive"
                  value={sortKey}
                  options={SORT_OPTIONS}
                  onChange={e => setSortKey(e.target.value)}
                />
                <button
                  type="button" title="Search" aria-label="Toggle search"
                  style={iconBtnStyle(searchOpen)}
                  onClick={() => { setSearchOpen(o => !o); if (filterOpen) setFilterOpen(false); setExportOpen(false); }}
                >
                  <SearchIcon />
                </button>
                <button
                  type="button" title="Filter" aria-label="Toggle filter"
                  style={iconBtnStyle(filterOpen || hasActiveFilters)}
                  onClick={() => { setFilterOpen(o => !o); if (searchOpen) setSearchOpen(false); setExportOpen(false); }}
                >
                  <FilterIcon />
                </button>
                <div className="export-menu-container" ref={exportMenuRef}>
                  <button
                    type="button"
                    title="Export List (CSV / Excel)"
                    aria-label="Export booth officers list"
                    aria-expanded={exportOpen}
                    style={iconBtnStyle(exportOpen)}
                    onClick={() => { setExportOpen(o => !o); if (searchOpen) setSearchOpen(false); if (filterOpen) setFilterOpen(false); }}
                  >
                    <DownloadIcon />
                  </button>
                  {exportOpen && (
                    <div className="export-dropdown-menu">
                      <div className="export-dropdown-header">
                        <span>Export Options</span>
                        <span className="export-badge">
                          {isFiltered ? `${dataToExport.length} filtered` : `${dataToExport.length} total`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="export-dropdown-item"
                        onClick={() => handleExport('csv')}
                      >
                        <div className="export-format-badge csv">CSV</div>
                        <div className="export-item-info">
                          <span className="export-item-title">Export as CSV</span>
                          <span className="export-item-desc">Comma-separated values (.csv)</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="export-dropdown-item"
                        onClick={() => handleExport('excel')}
                      >
                        <div className="export-format-badge excel">XLS</div>
                        <div className="export-item-info">
                          <span className="export-item-title">Export as Excel</span>
                          <span className="export-item-desc">Microsoft Excel formatted (.xls)</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-add-entity"
                  onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                >
                  <PlusIcon />
                  <span>Add Officer</span>
                </button>
              </div>
            </div>
          </div>

          {searchOpen && (
            <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="text" className="form-control" placeholder="Type to search..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
                style={{ maxWidth: '240px' }}
              />
            </div>
          )}

          {filterOpen && (
            <div className="filter-toolbar" style={{ padding: '12px 16px 0' }}>
              {filterState && <Chip label={filterState} onRemove={() => { setFilterState(''); setFilterLga(''); setFilterWard(''); }} />}
              {filterLga && <Chip label={filterLga} onRemove={() => { setFilterLga(''); setFilterWard(''); }} />}
              {filterWard && <Chip label={filterWard} onRemove={() => setFilterWard('')} />}

              {!filterState && (
                <CustomSelect
                  className="filter-select-responsive"
                  value={filterState}
                  placeholder="Select State…"
                  options={stateOptions}
                  onChange={e => setFilterState(e.target.value)}
                />
              )}
              {filterState && !filterLga && (
                <CustomSelect
                  className="filter-select-responsive"
                  value={filterLga}
                  placeholder="Select LGA…"
                  options={lgaOptions}
                  onChange={e => setFilterLga(e.target.value)}
                />
              )}
              {filterState && filterLga && !filterWard && (
                <CustomSelect
                  className="filter-select-responsive"
                  value={filterWard}
                  placeholder="Select Ward…"
                  options={wardOptions}
                  onChange={e => setFilterWard(e.target.value)}
                />
              )}
              {hasActiveFilters && (
                <button type="button" className="btn btn-secondary btn-sm filter-clear-btn" onClick={clearFilters}>Clear</button>
              )}
            </div>
          )}

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
                {loading ? (
                  // Render 4 skeleton rows while fetching
                  [...Array(4)].map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td>
                        <div className="party-cell">
                          <div className="skeleton-circle" style={{ width: 32, height: 32 }} />
                          <div className="skeleton-box" style={{ width: 120, height: 16 }} />
                        </div>
                      </td>
                      <td><div className="skeleton-box" style={{ width: 100, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 140, height: 16 }} /></td>
                      <td>
                        <div style={{ display: 'flex' }}>
                          <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6, marginRight: 8 }} />
                          <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  pageOperators.map(op => (
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
                        <button className="btn-icon" style={{ ...actionIconStyle('primary'), marginRight: 8 }} title="Edit" aria-label="Edit officer" onClick={() => handleEdit(op)}>
                          <EditIcon />
                        </button>
                        <button className="btn-icon" style={actionIconStyle('danger')} title="Delete" aria-label="Delete officer" onClick={() => handleDeleteClick(op)}>
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredOperators.length === 0 && operators.length > 0 && (
                  <tr><td colSpan={4} className="empty-state">No booth officers match the selected filters.</td></tr>
                )}
                {!loading && operators.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No booth officers registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '14px 0 4px' }}>
              <button
                type="button" className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="muted">Page {currentPage} of {totalPages}</span>
              <button
                type="button" className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>


      {/* FEATURE: Custom Delete Confirmation Modal */}
      {deletingOperator && (
        <div className="modal-overlay" onClick={() => setDeletingOperator(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeletingOperator(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove the booth officer <strong>{deletingOperator.full_name}</strong>?</p>
              <p className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeletingOperator(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: '#f46a6a', borderColor: '#f46a6a' }} onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE: Floating Operator Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="admin-edit-modal-box" onClick={e => e.stopPropagation()}>
            <div className="admin-edit-modal-header">
              <div>
                <h3 className="admin-edit-modal-title">{editingId ? 'Edit Booth Officer' : 'Register Booth Officer'}</h3>
                <p className="admin-edit-modal-subtitle">{editingId ? 'Update assigned booth and login credentials' : 'Register a new polling unit booth operator'}</p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-edit-modal-form">
              <div className="admin-edit-modal-body">
                <div className="form-group admin-modal-form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text" required className="form-control"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group admin-modal-form-group">
                  <label className="form-label">App Username</label>
                  <input
                    type="text" required className="form-control"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="form-group admin-modal-form-group">
                  <label className="form-label">
                    {editingId ? 'Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password" required={!editingId} className="form-control"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="form-group admin-modal-lga-group">
                  <label className="form-label">Assign Polling Unit / Booth</label>
                  <SearchableSelect
                    placeholder="Search booth by code, name, or ward…"
                    value={formData.assigned_booth_id}
                    onChange={val => setFormData({ ...formData, assigned_booth_id: val })}
                    options={[
                      { value: '', label: '-- No assigned booth (operator picks dynamic) --' },
                      ...booths.map(b => ({
                        value: b.booth_id,
                        label: `${b.unique_booth_code} — ${b.booth_name} (${b.ward_name})`,
                      })),
                    ]}
                  />
                </div>
              </div>
              <div className="admin-edit-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Update Booth Officer' : 'Create Booth Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}