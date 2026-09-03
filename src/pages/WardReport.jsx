import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'react-hot-toast';

// --- Icons & Helper Components ---
const EditIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const actionIconStyle = (variant = 'primary') => ({
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
  padding: 0,
  flexShrink: 0,
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
  boxSizing: 'border-box',
});

const Chip = ({ label, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#eef1fb', color: '#556ee6', borderRadius: 16,
    padding: '4px 10px', fontSize: 13, fontWeight: 500,
  }}>
    {label}
    <button
      type="button"
      onClick={onRemove}
      style={{ border: 'none', background: 'transparent', color: '#556ee6', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
      aria-label={`Remove ${label} filter`}
    >
      ×
    </button>
  </span>
);

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { value: 'asc', label: 'Ward (A–Z)' },
  { value: 'desc', label: 'Ward (Z–A)' },
];

export default function WardReport() {
  const [wards, setWards] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Sort, Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [stateList, setStateList] = useState([]);
  const [locations, setLocations] = useState([]);

  // Edit Modal states
  const [selectedWard, setSelectedWard] = useState(null);
  const [counts, setCounts] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch Ward Reports from Backend
  const fetchWardReports = async (page = 1) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        search: searchTerm,
        sort: sortDir,
        state: filterState,
        lga: filterLga,
      }).toString();

      const res = await apiCall(`/ward-reports?${query}`);
      if (res.success) {
        setWards(res.wards || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalRecords(res.pagination?.totalRecords || 0);
      } else {
        toast.error(res.message || 'Failed to load ward reports.');
      }
    } catch (err) {
      console.error('Error loading ward reports:', err);
      toast.error('Network error loading ward reports.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Location hierarchy for State & LGA filter dropdowns
  const fetchLocationOptions = async () => {
    try {
      const data = await apiCall('/locations/all');
      if (data.success && data.locations) {
        setLocations(data.locations);
        const uniqueStates = [...new Set(data.locations.map(l => l.state_name).filter(Boolean))].sort();
        setStateList(uniqueStates);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  useEffect(() => {
    fetchLocationOptions();
  }, []);

  useEffect(() => {
    fetchWardReports(currentPage);
  }, [currentPage, searchTerm, sortDir, filterState, filterLga]);

  // Derived LGA options based on selected State
  const lgaOptions = filterState
    ? [...new Set(locations.filter(l => l.state_name === filterState).map(l => l.lga_name).filter(Boolean))].sort()
    : [...new Set(locations.map(l => l.lga_name).filter(Boolean))].sort();

  // Reset to page 1 on search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortDir(e.target.value);
    setCurrentPage(1);
  };

  const handleStateFilterChange = (e) => {
    setFilterState(e.target.value);
    setFilterLga(''); // Reset LGA when State changes
    setCurrentPage(1);
  };

  const handleLgaFilterChange = (e) => {
    setFilterLga(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setCurrentPage(1);
  };

  // Open Edit Modal with candidates for this specific ward and EMPTY input values
  const openEditModal = async (ward) => {
    setSelectedWard(ward);
    setCounts({}); // CRITICAL: Reset counts so inputs start completely empty

    try {
      const res = await apiCall(`/ward-reports/candidates?ward_id=${ward.id}`);
      if (res.success) {
        setCandidates(res.candidates || []);
      } else {
        toast.error(res.message || 'Failed to load candidates for this ward.');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      toast.error('Network error loading candidates.');
    }
  };

  const closeEditModal = () => {
    setSelectedWard(null);
    setCounts({});
  };

  // Handle Count Change per candidate
  const handleCountChange = (candidateId, value) => {
    setCounts(prev => ({
      ...prev,
      [candidateId]: value
    }));
  };

  // Submit Upsert Vote Counts
  const handleSaveCounts = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedWard) return;

    // Build payload: array of { ward_id, candidate_id, total_votes }
    const payload = candidates.map(c => {
      const rawVal = counts[c.id];
      const parsedVal = rawVal === '' || rawVal === undefined ? 0 : parseInt(rawVal, 10);
      return {
        ward_id: selectedWard.id,
        candidate_id: c.id,
        total_votes: isNaN(parsedVal) ? 0 : parsedVal
      };
    });

    setSaving(true);
    try {
      const res = await apiCall('/ward-reports/upsert', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        toast.success(res.message || 'Vote counts saved successfully!');
        closeEditModal();
        fetchWardReports(currentPage);
      } else {
        toast.error(res.message || 'Failed to save counts.');
      }
    } catch (err) {
      console.error('Error saving counts:', err);
      toast.error('Network error saving counts.');
    } finally {
      setSaving(false);
    }
  };

  const hasActiveFilters = Boolean(filterState || filterLga);

  return (
    <div>
      <div className="card">
        {/* Responsive Header */}
        <div className="card-header responsive-header">
          <div className="header-title-group">
            <h2>Ward Reports</h2>
            <span className="muted">{totalRecords} wards found</span>
          </div>

          <div className="header-controls-group">
            <input
              type="text"
              className="form-control search-input-responsive"
              placeholder="Search by Ward Name..."
              value={searchTerm}
              onChange={handleSearchChange}
            />

            <div className="sort-filter-actions">
              <span className="sort-label-text">Sort by</span>
              <CustomSelect
                className="sort-select-responsive"
                value={sortDir}
                options={SORT_OPTIONS}
                onChange={handleSortChange}
              />

              <button
                type="button"
                title="Filter"
                aria-label="Toggle filter"
                style={iconBtnStyle(filterOpen || hasActiveFilters)}
                onClick={() => setFilterOpen(o => !o)}
              >
                <FilterIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        {filterOpen && (
          <div className="filter-toolbar" style={{ padding: '12px 16px 0' }}>
            {/* State Chip */}
            {filterState && (
              <Chip
                label={`State: ${filterState}`}
                onRemove={() => {
                  setFilterState('');
                  setFilterLga('');
                  setCurrentPage(1);
                }}
              />
            )}

            {/* LGA Chip */}
            {filterLga && (
              <Chip
                label={`LGA: ${filterLga}`}
                onRemove={() => {
                  setFilterLga('');
                  setCurrentPage(1);
                }}
              />
            )}

            {/* State Dropdown */}
            {!filterState && (
              <CustomSelect
                className="filter-select-responsive"
                value={filterState}
                placeholder="Filter by State…"
                options={stateList}
                onChange={handleStateFilterChange}
              />
            )}

            {/* LGA Dropdown */}
            {!filterLga && (
              <CustomSelect
                className="filter-select-responsive"
                value={filterLga}
                placeholder="Filter by LGA…"
                options={lgaOptions}
                onChange={handleLgaFilterChange}
              />
            )}

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm filter-clear-btn"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Table Wrapper */}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ward Name</th>
                <th>LGA</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Render skeleton placeholder rows while loading
                [...Array(PAGE_SIZE)].map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td>
                      <div className="skeleton-box" style={{ width: '60%', height: 16 }} />
                    </td>
                    <td>
                      <div className="skeleton-box" style={{ width: '45%', height: 16 }} />
                    </td>
                    <td>
                      <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} />
                    </td>
                  </tr>
                ))
              ) : (
                wards.map((ward) => (
                  <tr key={ward.id}>
                    <td>
                      <strong>{ward.ward_name}</strong>
                    </td>
                    <td>
                      <span>{ward.lga_name}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon"
                        style={actionIconStyle('primary')}
                        title="Edit Counts"
                        aria-label={`Edit counts for ${ward.ward_name}`}
                        onClick={() => openEditModal(ward)}
                      >
                        <EditIcon />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {!isLoading && wards.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">
                    {hasActiveFilters || searchTerm
                      ? 'No wards match the selected filters or search.'
                      : 'No wards found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '16px 0' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              &larr; Prev
            </button>
            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Edit Vote Counts Modal */}
      {selectedWard && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div
            className="modal-box modal-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Enter Vote Counts — {selectedWard.ward_name}</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  LGA: {selectedWard.lga_name}
                </span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeEditModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <form id="ward-count-form" onSubmit={handleSaveCounts}>
                <p className="muted" style={{ marginBottom: 20 }}>
                  Enter total vote counts for each candidate contesting in this ward.
                </p>

                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <div
                      className="form-group"
                      key={candidate.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 14,
                        paddingBottom: 10,
                        borderBottom: '1px solid var(--border-color, #eef0f4)'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <strong style={{ fontSize: 14, color: 'var(--text-dark, #343a40)' }}>
                          {candidate.candidate_name}
                        </strong>
                        <div style={{ marginTop: 2 }}>
                          <span className="badge badge-soft-primary">
                            {candidate.party_name} {candidate.party_code ? `(${candidate.party_code})` : ''}
                          </span>
                        </div>
                      </div>

                      {/* CRITICAL: Must not have default values, starts completely empty */}
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="form-control"
                        style={{ width: '130px', textAlign: 'center', fontSize: 16, fontWeight: 600 }}
                        value={counts[candidate.id] || ''}
                        onChange={(e) => handleCountChange(candidate.id, e.target.value)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No candidates found in the system.</div>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || candidates.length === 0}
                onClick={handleSaveCounts}
              >
                {saving ? 'Saving...' : 'Save Counts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
