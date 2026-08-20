import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';

const IconFileText = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconImage = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

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

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { value: 'asc', label: 'A–Z' },
  { value: 'desc', label: 'Z–A' },
];

export default function BoothReport() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');

  const fetchSubmissions = async () => {
    const data = await apiCall('/audit/submissions');
    if (data.success) {
      setSubmissions(data.submissions || []);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortDir, filterState, filterLga, filterWard]);

  // ---- Cascading location option lists, derived from submissions ----
  const stateOptions = [...new Set(submissions.map(s => s.state_name).filter(Boolean))].sort();

  const lgaOptions = [...new Set(
    submissions.filter(s => s.state_name === filterState).map(s => s.lga_name).filter(Boolean)
  )].sort();

  const wardOptions = [...new Set(
    submissions.filter(s => s.state_name === filterState && s.lga_name === filterLga).map(s => s.ward_name).filter(Boolean)
  )].sort();

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
  };

  const hasActiveFilters = filterState || filterLga || filterWard;

  // ---- Apply filters + search ----
  const filteredSubmissions = submissions.filter(sub => {
    if (filterState && sub.state_name !== filterState) return false;
    if (filterLga && sub.lga_name !== filterLga) return false;
    if (filterWard && sub.ward_name !== filterWard) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches =
        sub.operator_name?.toLowerCase().includes(term) ||
        sub.unique_booth_code?.toLowerCase().includes(term) ||
        sub.booth_name?.toLowerCase().includes(term);
      if (!matches) return false;
    }

    return true;
  });

  // ---- Sort A-Z / Z-A by operator name ----
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    const cmp = (a.operator_name || '').localeCompare(b.operator_name || '');
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / PAGE_SIZE));
  const pageSubmissions = sortedSubmissions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalSubmissions = submissions.length;

  const isPdf = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
  };

  return (
    <div>
      {/* <div className="page-title-box">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Booth Report</span>
          </div>
        </div>
      </div> */}

      <div className="card">
        <div className="card-header responsive-header">
          <div className="header-title-group">
            <h2>Booth Reports</h2>
            <span className="muted">{filteredSubmissions.length} of {totalSubmissions} submissions</span>
          </div>
          <div className="header-controls-group">
            <input
              type="text"
              className="form-control search-input-responsive"
              placeholder="Search operator, booth code, or booth name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="sort-filter-actions">
              <span className="sort-label-text">
                Sort by
              </span>
              <CustomSelect
                className="sort-select-responsive"
                value={sortDir}
                options={SORT_OPTIONS}
                onChange={e => setSortDir(e.target.value)}
              />
              <button
                type="button" title="Filter" aria-label="Toggle filter"
                style={iconBtnStyle(filterOpen || hasActiveFilters)}
                onClick={() => setFilterOpen(o => !o)}
              >
                <FilterIcon />
              </button>
            </div>
          </div>
        </div>

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
                <th>Booth Code &amp; Name</th>
                <th>Time Submitted</th>
                <th>Reports</th>
                <th>Photos</th>
              </tr>
            </thead>
            <tbody>
              {pageSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td><strong>{sub.operator_name || 'Booth Officer'}</strong></td>
                  <td>
                    <strong>{sub.unique_booth_code}</strong>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub.booth_name}</div>
                  </td>
                  <td>{new Date(sub.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedReport(sub)}
                    >
                      <IconFileText style={{ marginRight: 5 }} /> View report
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedImage({
                        url: sub.tally_sheet_url,
                        booth: sub.unique_booth_code,
                        operator: sub.operator_name
                      })}
                    >
                      <IconImage style={{ marginRight: 5 }} /> View Photo
                    </button>
                  </td>
                </tr>
              ))}
              {pageSubmissions.length === 0 && submissions.length > 0 && (
                <tr><td colSpan={5} className="empty-state">No submissions match the selected filters.</td></tr>
              )}
              {submissions.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No submissions yet.</td></tr>
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

      {/* 1. VIEW VOTE REPORT MODAL */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Submission Report — {selectedReport.unique_booth_code}</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  Submitted by {selectedReport.operator_name} at {new Date(selectedReport.created_at).toLocaleString()}
                </span>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <strong>Polling Booth: </strong> {selectedReport.booth_name} ({selectedReport.unique_booth_code})
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Party</th>
                      <th>Votes Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.votes_breakdown && selectedReport.votes_breakdown.length > 0 ? (
                      selectedReport.votes_breakdown.map((item, index) => (
                        <tr key={index}>
                          <td><strong>{item.candidate_name}</strong></td>
                          <td>
                            <span className="badge badge-soft-secondary">{item.party_name} ({item.party_code})</span>
                          </td>
                          <td><strong style={{ fontSize: 15 }}>{item.vote_count.toLocaleString()}</strong></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="empty-state">No candidate breakdown recorded for this entry.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. IN-APP TALLY SHEET & DOCUMENT PREVIEW MODAL */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div 
            className="modal-box" 
            style={{ 
              maxWidth: '800px', 
              width: '92%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden' 
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Tally Document — {selectedImage.booth}</h3>
                <span className="muted" style={{ fontSize: 12 }}>Operator: {selectedImage.operator}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedImage(null)}>&times;</button>
            </div>

            <div 
              className="modal-body" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#0f172a',
                padding: 16,
                maxHeight: '65vh',
                overflow: 'auto'
              }}
            >
              {selectedImage.url && 
               !selectedImage.url.includes('via.placeholder.com') && 
               selectedImage.url !== 'https://via.placeholder.com/600x800.png?text=No+Image' ? (
                isPdf(selectedImage.url) ? (
                  <iframe
                    src={selectedImage.url}
                    title="Tally Sheet PDF Preview"
                    style={{
                      width: '100%',
                      height: '62vh',
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: '#ffffff'
                    }}
                  />
                ) : (
                  <img
                    src={selectedImage.url}
                    alt="Uploaded Tally Sheet"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '62vh',
                      objectFit: 'contain',
                      borderRadius: 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}
                  />
                )
              ) : (
                <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No physical document captured</p>
                  <p style={{ fontSize: 13, margin: 0 }}>This submission was created without an attachment or using mock data.</p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '10px 16px' }}>
              <div>
                {selectedImage.url && 
                 !selectedImage.url.includes('via.placeholder.com') && (
                  <a
                    href={selectedImage.url}
                    download={`TallySheet_${selectedImage.booth}`}
                    className="btn btn-outline btn-sm"
                  >
                    Download File
                  </a>
                )}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedImage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}