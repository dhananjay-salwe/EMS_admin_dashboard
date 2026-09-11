import { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'react-hot-toast';
import { exportToCSV, exportToExcel } from '../utils/exportImportUtils';

const IconFileText = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconImage = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// FEATURE: SVG Icon component for displaying/auditing recorded video submissions
const IconVideo = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const EditIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

const iconBtnStyle = (active, disabled = false) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid ' + (disabled ? '#e2e5f1' : active ? 'var(--bs-primary, #556ee6)' : '#e2e5f1'),
  background: disabled ? '#f8f9fa' : active ? 'var(--bs-primary, #556ee6)' : '#fff',
  color: disabled ? '#b0b5c1' : active ? '#fff' : '#556ee6',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  flexShrink: 0,
  padding: 0,
  boxSizing: 'border-box',
});

const PAGE_SIZE = 8;

export default function BoothReport() {
  const [submissions, setSubmissions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);

  // Feature: State tracking for selected video modals
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [imageZoom, setImageZoom] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');

  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');

  const [verifyingReport, setVerifyingReport] = useState(null);
  const [verifiedCounts, setVerifiedCounts] = useState({});
  const [verifying, setVerifying] = useState(false);

  // Row export dropdown state
  const [openRowExportId, setOpenRowExportId] = useState(null);

  // Close row export dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('.row-export-container')) {
        setOpenRowExportId(null);
      }
    };
    if (openRowExportId) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [openRowExportId]);

  const openVerifyModal = async (report) => {
    let breakdown = report.votes_breakdown || [];

    // Fallback: If no breakdown exists yet (booth not synced from app), fetch candidates for booth
    if (breakdown.length === 0 && report.booth_id) {
      try {
        const res = await apiCall(`/candidates/by-booth/${report.booth_id}`);
        if (res.success && res.candidates) {
          breakdown = res.candidates.map(c => ({
            candidate_id: c.candidate_id,
            candidate_name: c.candidate_name,
            party_name: c.party_name,
            party_code: c.party_code,
            vote_count: 0,
            moderator_vote_count: null
          }));
        }
      } catch (err) {
        console.error('Failed to load booth candidates:', err);
      }
    }

    const initialCounts = {};
    breakdown.forEach(item => {
      const countVal = item.moderator_vote_count !== null && item.moderator_vote_count !== undefined
        ? item.moderator_vote_count
        : '';
      initialCounts[item.candidate_id] = countVal;
    });

    setVerifiedCounts(initialCounts);
    setVerifyingReport({ ...report, votes_breakdown: breakdown });
  };

  const handleVerifySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setVerifying(true);
    
    const payload = (verifyingReport.votes_breakdown || []).map(item => ({
      candidate_id: item.candidate_id,
      count: parseInt(verifiedCounts[item.candidate_id], 10) || 0
    }));

    try {
      const targetId = verifyingReport.id || 0;
      const res = await apiCall(`/audit/verify/${targetId}`, { 
        method: 'PUT', 
        body: JSON.stringify({ 
          booth_id: verifyingReport.booth_id,
          verified_votes: payload 
        }) 
      });

      if (res.success) {
        toast.success('Verified counts saved successfully!');
        setVerifyingReport(null);
        fetchSubmissions(currentPage); // Refresh the table
      } else {
        toast.error(res.message || 'Failed to save counts.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving counts.');
    } finally {
      setVerifying(false);
    }
  };

  const forceDownload = async (fileUrl, fileName) => {
    try {
      toast.loading('Downloading file...', { id: 'download-toast' });
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download complete!', { id: 'download-toast' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.', { id: 'download-toast' });
    }
  };

  // Server-side pagination fetch with guard clause: requires Ward selection
  const fetchSubmissions = async (page = 1) => {
    // Guard clause: table must remain completely empty until Ward is actively selected
    if (!filterWard) {
      setSubmissions([]);
      setTotalPages(1);
      setTotalRecords(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        state: filterState,
        lga: filterLga,
        ward: filterWard,
        search: searchTerm
      }).toString();

      const data = await apiCall(`/audit/submissions?${query}`);
      if (data.success) {
        setSubmissions(data.submissions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.totalRecords || 0);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const data = await apiCall('/locations/all');
        if (isSubscribed && data.success) {
          setLocations(data.locations || []);
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    fetchSubmissions(currentPage);
  }, [currentPage, searchTerm, filterState, filterLga, filterWard]);

  // Cascading location options derived from complete location hierarchy
  const stateOptions = [...new Set(locations.map(l => l.state_name).filter(Boolean))].sort();

  const lgaOptions = filterState
    ? [...new Set(
        locations.filter(l => l.state_name === filterState).map(l => l.lga_name).filter(Boolean)
      )].sort()
    : [];

  const wardOptions = filterState && filterLga
    ? [...new Set(
        locations.filter(l => l.state_name === filterState && l.lga_name === filterLga).map(l => l.ward_name).filter(Boolean)
      )].sort()
    : [];

  const clearFilters = () => {
    setFilterState('');
    setFilterLga('');
    setFilterWard('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(filterState || filterLga || filterWard);

  // Row-level export for a single moderator-verified booth report with format selection (CSV / Excel)
  const handleRowExport = (sub, format = 'csv') => {
    try {
      const breakdown = sub.votes_breakdown || [];
      if (breakdown.length === 0) {
        toast.error('No candidate vote details recorded for this booth');
        return;
      }

      const filename = `booth_audit_${(sub.unique_booth_code || 'booth').toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      const title = `Polling Unit Audit Report - ${sub.booth_name || 'Polling Unit'} (${sub.unique_booth_code || ''})`;

      const metadataRows = [
        `State: ${sub.state_name || filterState || 'N/A'} | LGA: ${sub.lga_name || filterLga || 'N/A'} | Ward: ${sub.ward_name || filterWard || 'N/A'} | Polling Unit: ${sub.booth_name || 'N/A'} (${sub.unique_booth_code || 'N/A'})`,
        `Booth Officer: ${sub.operator_name || 'Not assigned'} | Submitted: ${sub.created_at ? new Date(sub.created_at).toLocaleString() : 'N/A'} | Audited By: ${sub.updated_by_name || 'Moderator'} (${sub.updated_by_role || 'Admin'}) | Audit Date: ${sub.updated_at ? new Date(sub.updated_at).toLocaleString() : 'N/A'}`
      ];

      const columns = [
        { label: 'S.No', key: (_, index) => index + 1 },
        { label: 'Candidate Name', key: 'candidate_name' },
        { label: 'Party', key: (item) => `${item.party_name} (${item.party_code || ''})` },
        { 
          label: 'Original Count (Booth App)', 
          key: (item) => (item.vote_count !== null && item.vote_count !== undefined ? item.vote_count : 0) 
        },
        { 
          label: 'Audited Count (Moderator)', 
          key: (item) => (item.moderator_vote_count !== null && item.moderator_vote_count !== undefined ? item.moderator_vote_count : 'N/A') 
        },
        { 
          label: 'Variance / Difference', 
          key: (item) => {
            if (item.moderator_vote_count !== null && item.moderator_vote_count !== undefined) {
              const diff = item.moderator_vote_count - (item.vote_count || 0);
              return diff > 0 ? `+${diff}` : `${diff}`;
            }
            return '0';
          } 
        }
      ];

      if (format === 'excel') {
        exportToExcel({
          data: breakdown,
          columns,
          filename,
          sheetName: 'Booth Audit',
          title,
          metadataRows,
        });
        toast.success(`Exported audit report for ${sub.unique_booth_code} as Excel!`);
      } else {
        exportToCSV({
          data: breakdown,
          columns,
          filename,
          title,
          metadataRows,
        });
        toast.success(`Exported audit report for ${sub.unique_booth_code} as CSV!`);
      }
    } catch (err) {
      console.error('Row export error:', err);
      toast.error('Failed to export row audit report');
    }
  };

  const pageSubmissions = submissions;
  const totalSubmissions = totalRecords;


  const isPdf = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
  };

  return (
    <div>

      <div className="card">
        <div className="card-header responsive-header">
          <div className="header-title-group">
            <h2>Booth Reports</h2>
            <span className="muted">{totalSubmissions} submissions found</span>
          </div>
          <div className="header-controls-group">
            <input
              type="text"
              className="form-control search-input-responsive"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />

            <CustomSelect
              className="filter-select-responsive"
              value={filterState}
              placeholder="Select State…"
              options={stateOptions}
              onChange={e => {
                setFilterState(e.target.value);
                setFilterLga('');
                setFilterWard('');
                setCurrentPage(1);
              }}
            />

            <CustomSelect
              className="filter-select-responsive"
              value={filterLga}
              placeholder="Select LGA…"
              options={lgaOptions}
              onChange={e => {
                setFilterLga(e.target.value);
                setFilterWard('');
                setCurrentPage(1);
              }}
              disabled={!filterState}
            />

            <CustomSelect
              className="filter-select-responsive"
              value={filterWard}
              placeholder="Select Ward…"
              options={wardOptions}
              onChange={e => {
                setFilterWard(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!filterLga}
            />

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
        </div>

        <div className={`table-wrap table-wrap-min-height ${openRowExportId ? 'table-overflow-visible' : ''}`}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Booth Officer</th>
                <th>Booth Code &amp; Name</th>
                <th>Time Submitted</th>
                <th>Reports</th>
                <th>Media Attachments</th>
                <th>Moderator Count</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(PAGE_SIZE)].map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td><div className="skeleton-box" style={{ width: '60%', height: 16 }} /></td>
                    <td><div className="skeleton-box" style={{ width: '50%', height: 16 }} /></td>
                    <td><div className="skeleton-box" style={{ width: '40%', height: 16 }} /></td>
                    <td><div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} /></td>
                    <td><div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} /></td>
                    <td><div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: 6 }} /></td>
                  </tr>
                ))
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {filterWard 
                      ? (searchTerm ? 'No booths match the search in this ward.' : 'No booths found in this ward.')
                      : 'Please select a State, LGA, and Ward to view booth reports.'}
                  </td>
                </tr>
              ) : (
                pageSubmissions.map((sub) => (
                  <tr key={sub.booth_id || sub.id}>
                    <td><strong>{sub.operator_name || <span className="muted">Not assigned</span>}</strong></td>
                    <td>
                      <strong>{sub.unique_booth_code}</strong>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub.booth_name}</div>
                    </td>
                    <td>
                      {sub.created_at ? (
                        new Date(sub.created_at).toLocaleString()
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Awaiting App Sync</span>
                      )}
                    </td>
                    <td>
                      {sub.id && sub.created_at ? (
                        <button
                          type="button"
                          className="btn-icon"
                          style={actionIconStyle('primary')}
                          title="View Report"
                          aria-label="View Report"
                          onClick={() => setSelectedReport(sub)}
                        >
                          <IconFileText />
                        </button>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Awaiting App Sync</span>
                      )}
                    </td>
                    <td>
                      {sub.tally_sheet_url || sub.video_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {sub.tally_sheet_url && (
                            <button
                              type="button"
                              className="btn-icon"
                              style={actionIconStyle('primary')}
                              title="View Photo"
                              aria-label="View Photo"
                              onClick={() => setSelectedImage({
                                url: sub.tally_sheet_url,
                                booth: sub.unique_booth_code,
                                operator: sub.operator_name || 'Unassigned'
                              })}
                            >
                              <IconImage />
                            </button>
                          )}
                          {sub.video_url && (
                            <button
                              type="button"
                              className="btn-icon"
                              style={actionIconStyle('primary')}
                              title="View Video"
                              aria-label="View Video"
                              onClick={() => setSelectedVideo({
                                url: sub.video_url,
                                booth: sub.unique_booth_code,
                                operator: sub.operator_name || 'Unassigned'
                              })}
                            >
                              <IconVideo />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Awaiting App Sync</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions-group">
                        <button
                          type="button"
                          className="btn-row-action"
                          title="Edit / Verify Count"
                          aria-label="Edit / Verify Count"
                          onClick={() => openVerifyModal(sub)}
                        >
                          <EditIcon />
                        </button>
                        {sub.votes_breakdown?.some(v => v.moderator_vote_count !== null && v.moderator_vote_count !== undefined) && (
                          <>
                            <div className="row-export-container">
                              <button
                                type="button"
                                className="btn-row-action btn-row-export"
                                title="Export Audited Booth Report"
                                aria-label={`Export audit report for ${sub.unique_booth_code}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRowExportId(prev => (prev === (sub.booth_id || sub.id) ? null : (sub.booth_id || sub.id)));
                                }}
                              >
                                <DownloadIcon />
                              </button>
                              {openRowExportId === (sub.booth_id || sub.id) && (
                                <div className="row-export-menu" onClick={e => e.stopPropagation()}>
                                  <div className="export-dropdown-header">
                                    <span>Export Options</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="export-dropdown-item"
                                    onClick={() => {
                                      handleRowExport(sub, 'csv');
                                      setOpenRowExportId(null);
                                    }}
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
                                    onClick={() => {
                                      handleRowExport(sub, 'excel');
                                      setOpenRowExportId(null);
                                    }}
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
                            <span className="badge badge-soft-success">Verified</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
        <div className="modal-overlay" onClick={() => { setSelectedImage(null); setImageZoom(1); }}>
          <div 
            className="modal-box" 
            style={{ maxWidth: '800px', width: '92%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Tally Document — {selectedImage.booth}</h3>
                <span className="muted" style={{ fontSize: 12 }}>Operator: {selectedImage.operator}</span>
              </div>
              <button className="modal-close" onClick={() => { setSelectedImage(null); setImageZoom(1); }}>&times;</button>
            </div>

            {/* Dynamically toggle overflow based on zoom level */}
            <div 
              className="modal-body" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#0f172a',
                padding: 16,
                height: '65vh',
                overflow: imageZoom > 1 ? 'auto' : 'hidden' 
              }}
            >
              {selectedImage.url && 
               !selectedImage.url.includes('via.placeholder.com') && 
               selectedImage.url !== 'https://via.placeholder.com/600x800.png?text=No+Image' ? (
                isPdf(selectedImage.url) ? (
                  <iframe src={selectedImage.url} title="Tally Sheet PDF Preview" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 6, backgroundColor: '#ffffff' }} />
                ) : (
                  <img
                    src={selectedImage.url}
                    alt="Uploaded Tally Sheet"
                    style={{
                      maxWidth: imageZoom === 1 ? '100%' : 'none',
                      maxHeight: imageZoom === 1 ? '100%' : 'none',
                      height: imageZoom > 1 ? `${imageZoom * 100}%` : 'auto',
                      objectFit: 'contain',
                      borderRadius: 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      transition: 'height 0.15s ease-in-out'
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {selectedImage.url && 
                 !selectedImage.url.includes('via.placeholder.com') && (
                  <>
                    <button
                      type="button"
                      onClick={() => forceDownload(selectedImage.url, `TallySheet_${selectedImage.booth}`)}
                      className="btn btn-outline btn-sm"
                    >
                      Download File
                    </button>

                    {!isPdf(selectedImage.url) && (
                      <div className="zoom-controls">
                        <button type="button" className="btn-zoom" onClick={() => setImageZoom(p => Math.max(p - 0.5, 1))} title="Zoom Out">-</button>
                        <button type="button" className="btn-zoom" onClick={() => setImageZoom(p => Math.min(p + 0.5, 4))} title="Zoom In">+</button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSelectedImage(null); setImageZoom(1); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

{/* FEATURE: 3. IN-APP RECORDED VIDEO PREVIEW MODAL */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div 
            className="modal-box" 
            style={{ maxWidth: '800px', width: '92%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Tally Video — {selectedVideo.booth}</h3>
                <span className="muted" style={{ fontSize: 12 }}>Operator: {selectedVideo.operator}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedVideo(null)}>&times;</button>
            </div>

            <div className="modal-body media-preview-container">
              {selectedVideo.url ? (
                <video controls src={selectedVideo.url} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6 }} />
              ) : (
                <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No video uploaded</p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '10px 16px' }}>
              <div>
                {selectedVideo.url && (
                  <button
                    type="button"
                    onClick={() => forceDownload(selectedVideo.url, `TallyVideo_${selectedVideo.booth}.mp4`)}
                    className="btn btn-outline btn-sm"
                  >
                    Download Video
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedVideo(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE: Side-by-Side Verification Modal */}
      {verifyingReport && (
        <div className="modal-overlay" onClick={() => setVerifyingReport(null)}>
          <div 
            className="modal-box" 
            style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Verify Counts — {verifyingReport.unique_booth_code}</h3>
              <button className="modal-close" onClick={() => setVerifyingReport(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', gap: '20px', overflow: 'hidden', padding: 0 }}>
              
              {/* LEFT SIDE: Media Preview or Grey Placeholder UI */}
              <div style={{ 
                flex: 1, 
                backgroundColor: verifyingReport.tally_sheet_url ? '#0f172a' : '#f8f9fa', 
                borderRight: '1px solid #e2e5f1',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '24px',
                minHeight: '400px'
              }}>
                {verifyingReport.tally_sheet_url ? (
                  isPdf(verifyingReport.tally_sheet_url) ? (
                    <iframe src={verifyingReport.tally_sheet_url} title="Tally Sheet" style={{ width: '100%', height: '65vh', border: 'none' }} />
                  ) : (
                    <img src={verifyingReport.tally_sheet_url} alt="Tally Sheet" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                  )
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#e2e8f0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      color: '#94a3b8'
                    }}>
                      <IconImage width={28} height={28} />
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#334155' }}>
                      No media uploaded yet
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 260 }}>
                      Mobile app has not synced tally documents for this booth. You can still enter verified counts manually on the right.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Form Inputs */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', maxHeight: '65vh' }}>
                <form id="verify-form" onSubmit={handleVerifySubmit}>
                  <p className="muted" style={{ marginBottom: 20 }}>Manually verify and enter the final counts for each candidate below.</p>
                  
                  {verifyingReport.votes_breakdown.map((item) => (
                    <div className="form-group" key={item.candidate_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <strong>{item.candidate_name}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{item.party_name} ({item.party_code})</div>
                        {/* <div className="muted" style={{ fontSize: 11, color: 'var(--bs-primary)' }}>Operator input: {item.vote_count}</div> */}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="form-control"
                        style={{ width: '120px', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}
                        value={verifiedCounts[item.candidate_id] !== undefined ? verifiedCounts[item.candidate_id] : ''}
                        onChange={(e) => setVerifiedCounts(prev => ({
                          ...prev,
                          [item.candidate_id]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </form>
              </div>

            </div>
            
            <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVerifyingReport(null)}>Cancel</button>
              
              {/* Updated Button! */}
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={verifying}
                onClick={handleVerifySubmit}
              >
                {verifying ? 'Saving...' : 'Save Verified Counts'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}