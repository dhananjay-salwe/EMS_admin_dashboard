import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';

const PAGE_SIZE = 8;

const IconChevron = (props) => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" {...props}>
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Styled, searchable dropdown that still allows free text — needed for the
// State/LGA fields below since creating a ward can introduce a brand-new
// state or LGA that isn't in the options list yet (a plain <select> can't
// offer a value that doesn't exist yet). Kept local to this file since
// nothing else in the app needs it.
function Combobox({ value, onChange, options = [], placeholder = '', disabled = false, required = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  const selectOption = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div className={`combobox ${disabled ? 'disabled' : ''}`} ref={wrapRef}>
      <input
        type="text"
        className="form-control combobox-input"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
      />
      <button
        type="button"
        className="combobox-toggle"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle options"
      >
        <IconChevron className={open ? 'combobox-chevron open' : 'combobox-chevron'} />
      </button>

      {open && !disabled && (
        <div className="combobox-panel">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <button
                type="button"
                key={opt}
                className={`combobox-option ${opt === value ? 'selected' : ''}`}
                onClick={() => selectOption(opt)}
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="combobox-empty">
              {value ? `No match — "${value}" will be saved as new` : 'No options yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Icons + inline style helpers — mirrored 1:1 from LocationManagement /
// OperatorManagement so the search/filter/delete controls match the rest
// of the app's theme instead of using the old CSS-class-based look.
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
  { value: 'ward_name-asc', label: 'Ward Name (A–Z)' },
  { value: 'ward_name-desc', label: 'Ward Name (Z–A)' },
  { value: 'state_name-asc', label: 'State (A–Z)' },
  { value: 'state_name-desc', label: 'State (Z–A)' },
  { value: 'lga_name-asc', label: 'LGA (A–Z)' },
  { value: 'lga_name-desc', label: 'LGA (Z–A)' },
];

export default function WardManagement() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ state_name: '', lga_name: '', ward_name: '' });
  const [submitting, setSubmitting] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [sortKey, setSortKey] = useState('ward_name-asc');
  const [currentPage, setCurrentPage] = useState(1);

  const searchInputRef = useRef(null);

  const fetchLocations = async () => {
    const data = await apiCall('/locations/all');
    if (data.success) setLocations(data.locations);
  };

  useEffect(() => { fetchLocations(); }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterState, filterLga, sortKey]);

  // Suggestions for the "create ward" combobox (free text still allowed)
  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();
  const lgaOptionsForForm = [...new Set(
    locations.filter(l => l.state_name === formData.state_name).map(l => l.lga_name).filter(Boolean)
  )].sort();

  // Options for the filter dropdowns
  const lgaOptionsForFilter = [...new Set(
    locations.filter(l => l.state_name === filterState).map(l => l.lga_name).filter(Boolean)
  )].sort();

  // Extract unique wards list
  const uniqueWards = Array.from(
    new Map(
      locations.filter(l => l.ward_id).map(l => [l.ward_id, { ward_id: l.ward_id, ward_name: l.ward_name, lga_name: l.lga_name, state_name: l.state_name }])
    ).values()
  );

  const hasActiveFilters = filterState || filterLga;

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
  };

  const filteredWards = uniqueWards.filter(w => {
    if (filterState && w.state_name !== filterState) return false;
    if (filterLga && w.lga_name !== filterLga) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches =
        w.ward_name?.toLowerCase().includes(term) ||
        w.lga_name?.toLowerCase().includes(term) ||
        w.state_name?.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

  const [sortField, sortDir] = sortKey.split('-');
  const sortedWards = [...filteredWards].sort((a, b) => {
    const cmp = (a[sortField] || '').localeCompare(b[sortField] || '');
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedWards.length / PAGE_SIZE));
  const pageWards = sortedWards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiCall('/locations/ward/add', { method: 'POST', body: JSON.stringify(formData) });
    setSubmitting(false);

    if (res.success) {
      setFormData({ state_name: '', lga_name: '', ward_name: '' });
      fetchLocations();
    } else {
      alert(res.message);
    }
  };

  const handleDeleteWard = async (wardId) => {
    if (window.confirm('Delete this electoral ward?')) {
      await apiCall(`/locations/ward/${wardId}`, { method: 'DELETE' });
      fetchLocations();
    }
  };

  const toggleSearch = () => {
    setSearchOpen(o => !o);
    setFilterOpen(false);
  };

  const toggleFilter = () => {
    setFilterOpen(o => !o);
    setSearchOpen(false);
  };

  return (
    <div className="two-col-grid two-col-grid--form-table">
      <div className="card">
        <div className="card-header"><h2>Create Electoral Ward</h2></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">State</label>
              <Combobox
                required
                options={stateOptions}
                placeholder="Select or enter State"
                value={formData.state_name}
                onChange={val => setFormData({ ...formData, state_name: val, lga_name: '' })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">LGA (Local Government Area)</label>
              <Combobox
                required
                options={lgaOptionsForForm}
                placeholder="Select or enter LGA"
                disabled={!formData.state_name}
                value={formData.lga_name}
                onChange={val => setFormData({ ...formData, lga_name: val })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ward Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Ward 01 / Central Ward"
                value={formData.ward_name}
                onChange={e => setFormData({ ...formData, ward_name: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving Ward…' : 'Save Ward'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header responsive-header">
          <div className="header-title-group">
            <h2>Electoral Wards</h2>
            <span className="muted">{sortedWards.length} of {uniqueWards.length} total</span>
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
                onClick={toggleSearch}
              >
                <SearchIcon />
              </button>
              <button
                type="button" title="Filter" aria-label="Toggle filter"
                style={iconBtnStyle(filterOpen || hasActiveFilters)}
                onClick={toggleFilter}
              >
                <FilterIcon />
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div style={{ padding: '12px 22px 0' }}>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control search-input-responsive"
              placeholder="Search ward, LGA, or state…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {filterOpen && (
          <div className="filter-toolbar" style={{ padding: '12px 16px 0' }}>
            {filterState && <Chip label={filterState} onRemove={() => { setFilterState(''); setFilterLga(''); }} />}
            {filterLga && <Chip label={filterLga} onRemove={() => setFilterLga('')} />}

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
                options={lgaOptionsForFilter}
                onChange={e => setFilterLga(e.target.value)}
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
                <th>State</th>
                <th>LGA</th>
                <th>Ward Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pageWards.map(w => (
                <tr key={w.ward_id}>
                  <td>{w.state_name}</td>
                  <td>{w.lga_name}</td>
                  <td><strong>{w.ward_name}</strong></td>
                  <td>
                    <button
                      type="button"
                      style={actionIconStyle('danger')}
                      title="Delete"
                      aria-label="Delete ward"
                      onClick={() => handleDeleteWard(w.ward_id)}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedWards.length === 0 && uniqueWards.length > 0 && (
                <tr><td colSpan={4} className="empty-state">No wards match the selected filters.</td></tr>
              )}
              {uniqueWards.length === 0 && (
                <tr><td colSpan={4} className="empty-state">No wards found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0 4px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="muted">Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}