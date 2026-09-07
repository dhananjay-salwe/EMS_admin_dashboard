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
  { value: 'candidate_name-asc', label: 'Candidate (A–Z)' },
  { value: 'candidate_name-desc', label: 'Candidate (Z–A)' },
  { value: 'party_name-asc', label: 'Party (A–Z)' },
  { value: 'party_name-desc', label: 'Party (Z–A)' },
  { value: 'ward_name-asc', label: 'Ward (A–Z)' },
  { value: 'ward_name-desc', label: 'Ward (Z–A)' },
];

const EXPORT_COLUMNS = [
  { label: 'S.No', key: (_, index) => index + 1 },
  { label: 'Candidate Name', key: 'candidate_name' },
  { label: 'Party Name', key: 'party_name' },
  { label: 'Party Code', key: 'party_code' },
  { label: 'Contested Ward', key: 'ward_name' },
  { label: 'LGA', key: 'lga_name' },
  { label: 'State', key: 'state_name' },
];

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({ candidate_name: '', party_id: '', ward_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  // Toolbar toggles
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Filter & search state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [sortKey, setSortKey] = useState('candidate_name-asc');
  const [deletingCandidate, setDeletingCandidate] = useState(null);

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
    const candRes = await apiCall('/candidates/all');
    if (candRes.success) setCandidates(candRes.candidates);

    const partyRes = await apiCall('/parties/all');
    if (partyRes.success) setParties(partyRes.parties);

    const locRes = await apiCall('/locations/all');
    if (locRes.success) {
      // Get unique wards
      const uniqueWards = [];
      const seen = new Set();
      locRes.locations.forEach(l => {
        if (l.ward_id && !seen.has(l.ward_id)) {
          seen.add(l.ward_id);
          uniqueWards.push(l);
        }
      });
      setLocations(uniqueWards);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
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
    setFormData({ candidate_name: '', party_id: '', ward_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    let res;
    if (editingId) {
      res = await apiCall(`/candidates/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
    } else {
      res = await apiCall('/candidates/add', { method: 'POST', body: JSON.stringify(formData) });
    }
    
    setSubmitting(false);

    if (res.success) {
      toast.success(editingId ? 'Candidate updated successfully!' : 'Candidate registered successfully!');
      resetForm();
      fetchData();
    } else {
      toast.error(res.message || 'Failed to save candidate.');
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({ candidate_name: c.candidate_name, party_id: c.party_id, ward_id: c.ward_id });
  };

// 1. Opens the modal and sets the target candidate
  const handleDeleteClick = (candidate) => {
    setDeletingCandidate(candidate);
  };

  // 2. Fires when the user clicks "Confirm" inside the modal
  const handleDelete = async () => {
    if (!deletingCandidate) return;
    
    const res = await apiCall(`/candidates/${deletingCandidate.id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Candidate deleted successfully!');
      fetchData();
    } else {
      toast.error(res.message || 'Failed to delete candidate.');
    }
    setDeletingCandidate(null);
  };

  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    locations.filter(l => l.state_name === filterState).map(l => l.lga_name).filter(Boolean)
  )].sort();

  const wardOptions = locations
    .filter(l => l.state_name === filterState && l.lga_name === filterLga)
    .sort((a, b) => a.ward_name.localeCompare(b.ward_name));

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
  };

  const hasActiveFilters = filterState || filterLga || filterWard;

  // ---- Apply filters + search ----
  const filteredCandidates = candidates.filter(c => {
    if (filterState && c.state_name !== filterState) return false;
    if (filterLga && c.lga_name !== filterLga) return false;
    if (filterWard && c.ward_name !== filterWard) return false;
    if (searchTerm && !c.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const [sortField, sortDir] = sortKey.split('-');
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    const cmp = (a[sortField] || '').localeCompare(b[sortField] || '');
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const handleExport = (format) => {
    if (!sortedCandidates || sortedCandidates.length === 0) {
      toast.error('No candidates available to export');
      return;
    }

    try {
      const filename = 'candidates_list';
      const title = 'Contesting Candidates List';

      if (format === 'csv') {
        exportToCSV({
          data: sortedCandidates,
          columns: EXPORT_COLUMNS,
          filename,
          title,
        });
        toast.success(`Exported ${sortedCandidates.length} candidates as CSV!`);
      } else if (format === 'excel') {
        exportToExcel({
          data: sortedCandidates,
          columns: EXPORT_COLUMNS,
          filename,
          sheetName: 'Candidates',
          title,
        });
        toast.success(`Exported ${sortedCandidates.length} candidates as Excel!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export candidates data');
    } finally {
      setExportOpen(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / PAGE_SIZE));
  const pageCandidates = sortedCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>

      <div className="two-col-grid two-col-grid--form-table">
        <div className="card">
          <div className="card-header"><h2>{editingId ? 'Edit candidate' : 'Register candidate'}</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input
                  type="text" required className="form-control"
                  value={formData.candidate_name}
                  onChange={e => setFormData({ ...formData, candidate_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Political Party</label>
                <CustomSelect
                  value={formData.party_id}
                  placeholder="-- Select party --"
                  options={parties.map(p => ({ value: p.id, label: `${p.party_name} (${p.party_code})` }))}
                  onChange={e => setFormData({ ...formData, party_id: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contesting Ward (Constituency / Seat)</label>
                <CustomSelect
                  value={formData.ward_id}
                  placeholder="-- Select ward --"
                  options={locations.map(w => ({ value: w.ward_id, label: `${w.ward_name} (${w.lga_name}, ${w.state_name})` }))}
                  onChange={e => setFormData({ ...formData, ward_id: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Update Candidate' : 'Save Candidate'}
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
          <div className="card-header responsive-header">
            <div className="header-title-group">
              <h2>Contesting candidates by ward</h2>
              <span className="muted">{filteredCandidates.length} of {candidates.length} total</span>
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
                    aria-label="Export candidates list"
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
                        <span className="export-badge">{sortedCandidates.length} records</span>
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
                  options={wardOptions.map(w => ({ value: w.ward_name, label: w.ward_name }))}
                  onChange={e => setFilterWard(e.target.value)}
                />
              )}
              {hasActiveFilters && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
              )}
            </div>
          )}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Party</th>
                  <th>Contested Ward</th>
                  <th>LGA / State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Render 5 skeleton rows while fetching
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td><div className="skeleton-box" style={{ width: 120, height: 16 }} /></td>
                      <td>
                        <div className="party-cell">
                          <div className="skeleton-circle" style={{ width: 24, height: 24 }} />
                          <div className="skeleton-box" style={{ width: 100, height: 16 }} />
                        </div>
                      </td>
                      <td><div className="skeleton-box" style={{ width: 80, height: 20, borderRadius: 12 }} /></td>
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
                  pageCandidates.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.candidate_name}</strong></td>
                      <td>
                        <div className="party-cell">
                          {c.party_icon_url && <img src={c.party_icon_url} alt="" className="avatar-xs" />}
                          {c.party_name} ({c.party_code})
                        </div>
                      </td>
                      <td><span className="badge badge-soft-info">{c.ward_name}</span></td>
                      <td>{c.lga_name}, {c.state_name}</td>
                      <td>
                        <button className="btn-icon" style={{ ...actionIconStyle('primary'), marginRight: 8 }} title="Edit" aria-label="Edit candidate" onClick={() => handleEdit(c)}>
                          <EditIcon />
                        </button>
                        <button className="btn-icon" style={actionIconStyle('danger')} title="Delete" aria-label="Delete candidate" onClick={() => handleDeleteClick(c)}>
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredCandidates.length === 0 && candidates.length > 0 && (
                  <tr><td colSpan={5} className="empty-state">No candidates match the selected filters.</td></tr>
                )}
                {!loading && candidates.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No candidates registered yet.</td></tr>
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
      {deletingCandidate && (
        <div className="modal-overlay" onClick={() => setDeletingCandidate(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeletingCandidate(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove the candidate <strong>{deletingCandidate.candidate_name}</strong>?</p>
              <p className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeletingCandidate(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: '#f46a6a', borderColor: '#f46a6a' }} onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    
    </div>
  );
}