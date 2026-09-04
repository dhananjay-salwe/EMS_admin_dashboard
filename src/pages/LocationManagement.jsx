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

const SORT_OPTIONS = [
  { value: 'booth_name-asc', label: 'Booth (A–Z)' },
  { value: 'booth_name-desc', label: 'Booth (Z–A)' },
  { value: 'state_name-asc', label: 'State (A–Z)' },
  { value: 'state_name-desc', label: 'State (Z–A)' },
  { value: 'lga_name-asc', label: 'LGA (A–Z)' },
  { value: 'lga_name-desc', label: 'LGA (Z–A)' },
  { value: 'ward_name-asc', label: 'Ward (A–Z)' },
  { value: 'ward_name-desc', label: 'Ward (Z–A)' },
];

const EXPORT_COLUMNS = [
  { label: 'S.No', key: (_, index) => index + 1 },
  { label: 'State', key: 'state_name' },
  { label: 'LGA', key: 'lga_name' },
  { label: 'Ward', key: 'ward_name' },
  { label: 'Unique Booth Code', key: 'unique_booth_code' },
  { label: 'Polling Unit Name', key: 'booth_name' },
];

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    state_name: '',
    lga_name: '',
    ward_name: '',
    booth_name: '',
    unique_booth_code: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] =  useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [sortKey, setSortKey] = useState('booth_name-asc');
  const [deletingBooth, setDeletingBooth] = useState(null);

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

  const fetchLocations = async () => {
    try{ 
    const data = await apiCall('/locations/all');
    if (data.success) setLocations(data.locations);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterState, filterLga, filterWard, searchTerm, sortKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/locations/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      toast.success('Polling unit registered successfully!');
      setFormData({ state_name: '', lga_name: '', ward_name: '', booth_name: '', unique_booth_code: '' });
      fetchLocations();
    } else {
      toast.error(res.message || 'Failed to register polling unit.');
    }
  };

// 1. Opens the modal and sets the target booth
  const handleDelete = (booth) => {
    setDeletingBooth(booth);
  };

  // 2. Fires when the user clicks "Confirm" inside the modal
  const confirmDelete = async () => {
    if (!deletingBooth) return;
    
    const res = await apiCall(`/locations/booth/${deletingBooth.booth_id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Polling unit deleted successfully!');
      fetchLocations();
    } else {
      toast.error(res.message || 'Failed to delete polling unit.');
    }
    setDeletingBooth(null);
  };

  const booths = locations.filter(l => l.booth_id);

  // ---- Cascading location option lists, derived from all location records ----
  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    locations.filter(l => l.state_name === filterState).map(l => l.lga_name).filter(Boolean)
  )].sort();

  const wardOptions = [...new Set(
    locations.filter(l => l.state_name === filterState && l.lga_name === filterLga).map(l => l.ward_name).filter(Boolean)
  )].sort();

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
  };

  const hasActiveFilters = filterState || filterLga || filterWard;

  // ---- Apply filters + search (booth name or booth code) ----
  const filteredBooths = booths.filter(l => {
    if (filterState && l.state_name !== filterState) return false;
    if (filterLga && l.lga_name !== filterLga) return false;
    if (filterWard && l.ward_name !== filterWard) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches =
        l.booth_name?.toLowerCase().includes(term) ||
        l.unique_booth_code?.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

  const [sortField, sortDir] = sortKey.split('-');
  const sortedBooths = [...filteredBooths].sort((a, b) => {
    const cmp = (a[sortField] || '').localeCompare(b[sortField] || '');
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const handleExport = (format) => {
    if (!sortedBooths || sortedBooths.length === 0) {
      toast.error('No polling units available to export');
      return;
    }

    try {
      const filename = 'polling_units_list';
      const title = 'Registered Polling Units List';

      if (format === 'csv') {
        exportToCSV({
          data: sortedBooths,
          columns: EXPORT_COLUMNS,
          filename,
          title,
        });
        toast.success(`Exported ${sortedBooths.length} polling units as CSV!`);
      } else if (format === 'excel') {
        exportToExcel({
          data: sortedBooths,
          columns: EXPORT_COLUMNS,
          filename,
          sheetName: 'Polling Units',
          title,
        });
        toast.success(`Exported ${sortedBooths.length} polling units as Excel!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export polling units data');
    } finally {
      setExportOpen(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sortedBooths.length / PAGE_SIZE));
  const pageBooths = sortedBooths.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>

      <div className="two-col-grid two-col-grid--form-table">
        <div className="card">
          <div className="card-header"><h2>Add geographic polling unit</h2></div>
          <div className="card-body">
<form onSubmit={handleSubmit}>
  {/* 1. SELECT STATE */}
  <div className="form-group">
    <label className="form-label">1. Select State</label>
    <CustomSelect
      value={formData.state_name}
      placeholder="-- Choose State --"
      options={stateOptions}
      onChange={e => setFormData({
        ...formData,
        state_name: e.target.value,
        lga_name: '',
        ward_name: ''
      })}
    />
  </div>

  {/* 2. SELECT LGA (Filtered by selected State) */}
  <div className="form-group">
    <label className="form-label">2. Select LGA</label>
    <CustomSelect
      disabled={!formData.state_name}
      value={formData.lga_name}
      placeholder={formData.state_name ? '-- Choose LGA --' : '-- First Select State --'}
      options={[...new Set(
        locations
          .filter(l => l.state_name === formData.state_name)
          .map(l => l.lga_name)
          .filter(Boolean)
      )].sort()}
      onChange={e => setFormData({
        ...formData,
        lga_name: e.target.value,
        ward_name: ''
      })}
    />
  </div>

  {/* 3. SELECT WARD (Filtered by selected LGA) */}
  <div className="form-group">
    <label className="form-label">3. Select Electoral Ward</label>
    <CustomSelect
      disabled={!formData.lga_name}
      value={formData.ward_name}
      placeholder={formData.lga_name ? '-- Choose Ward --' : '-- First Select LGA --'}
      options={[...new Set(
        locations
          .filter(l => l.state_name === formData.state_name && l.lga_name === formData.lga_name)
          .map(l => l.ward_name)
          .filter(Boolean)
      )].sort()}
      onChange={e => setFormData({
        ...formData,
        ward_name: e.target.value
      })}
    />
  </div>

  {/* 4. ENTER POLLING UNIT NAME */}
  <div className="form-group">
    <label className="form-label">4. Polling Unit Name (Booth)</label>
    <input
      type="text"
      required
      className="form-control"
      placeholder="e.g. National Stadium Unit"
      value={formData.booth_name}
      onChange={e => setFormData({ ...formData, booth_name: e.target.value })}
    />
  </div>

  {/* 5. ENTER BOOTH CODE */}
  <div className="form-group">
    <label className="form-label">5. Unique Booth Code</label>
    <input
      type="text"
      required
      className="form-control"
      placeholder="e.g. BOOTH-SUR-05"
      value={formData.unique_booth_code}
      onChange={e => setFormData({ ...formData, unique_booth_code: e.target.value })}
    />
  </div>

  <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
    {submitting ? 'Registering Booth…' : 'Register Polling Booth'}
  </button>
</form>
          </div>
        </div>

        <div className="card">
          <div className="card-header responsive-header">
            <div className="header-title-group">
              <h2>Registered polling units</h2>
              <span className="muted">{filteredBooths.length} of {booths.length} total</span>
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
                    aria-label="Export polling units list"
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
                        <span className="export-badge">{sortedBooths.length} records</span>
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
              </div>
            </div>
          </div>

          {searchOpen && (
            <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="text" className="form-control search-input-responsive" placeholder="Type to search..."
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

          <div className="table-wrap table-scroll-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>LGA</th>
                  <th>Ward</th>
                  <th>Booth Code &amp; Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Render 5 skeleton rows while fetching
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td><div className="skeleton-box" style={{ width: 80, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 80, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 80, height: 16 }} /></td>
                      <td><div className="skeleton-box" style={{ width: 180, height: 16 }} /></td>
                      <td>
                        <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  pageBooths.map(l => (
                    <tr key={l.booth_id}>
                      <td>{l.state_name}</td>
                      <td>{l.lga_name}</td>
                      <td>{l.ward_name}</td>
                      <td><strong>{l.unique_booth_code}</strong> — {l.booth_name}</td>
                      <td>
                        <button className="btn-icon" style={actionIconStyle('danger')} title="Delete" aria-label="Delete booth" onClick={() => handleDelete(l)}>
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredBooths.length === 0 && booths.length > 0 && (
                  <tr><td colSpan={5} className="empty-state">No polling units match the selected filters.</td></tr>
                )}
                {!loading && booths.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No polling units registered yet.</td></tr>
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
      </div>
      {/* FEATURE: Custom Delete Confirmation Modal */}
      {deletingBooth && (
        <div className="modal-overlay" onClick={() => setDeletingBooth(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeletingBooth(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the polling unit <strong>{deletingBooth.unique_booth_code} — {deletingBooth.booth_name}</strong>?</p>
              <p className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeletingBooth(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: '#f46a6a', borderColor: '#f46a6a' }} onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}