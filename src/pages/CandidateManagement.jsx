import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';

const PAGE_SIZE = 6;

// Small inline icons so there's no dependency on an icon library
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

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({ candidate_name: '', party_id: '', ward_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Toolbar toggles
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter & search state
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [sortKey, setSortKey] = useState('candidate_name-asc');

  const fetchData = async () => {
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
    if (editingId) {
      await apiCall(`/candidates/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
    } else {
      await apiCall('/candidates/add', { method: 'POST', body: JSON.stringify(formData) });
    }
    setSubmitting(false);
    resetForm();
    fetchData();
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({ candidate_name: c.candidate_name, party_id: c.party_id, ward_id: c.ward_id });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this candidate?')) {
      await apiCall(`/candidates/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // ---- Cascading location option lists, derived from ward-level locations ----
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

  // ---- Pagination ----
  // const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  // const pageCandidates = filteredCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / PAGE_SIZE));
  const pageCandidates = sortedCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      {/* <div className="page-title-box">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Candidates</span>
          </div>
        </div>
      </div> */}

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
                  onClick={() => { setSearchOpen(o => !o); if (filterOpen) setFilterOpen(false); }}
                >
                  <SearchIcon />
                </button>
                <button
                  type="button" title="Filter" aria-label="Toggle filter"
                  style={iconBtnStyle(filterOpen || hasActiveFilters)}
                  onClick={() => { setFilterOpen(o => !o); if (searchOpen) setSearchOpen(false); }}
                >
                  <FilterIcon />
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
                {pageCandidates.map(c => (
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
                      <button className="btn-icon" style={actionIconStyle('danger')} title="Delete" aria-label="Delete candidate" onClick={() => handleDelete(c.id)}>
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && candidates.length > 0 && (
                  <tr><td colSpan={5} className="empty-state">No candidates match the selected filters.</td></tr>
                )}
                {candidates.length === 0 && (
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
    </div>
  );
}