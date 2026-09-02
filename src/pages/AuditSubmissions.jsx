import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'react-hot-toast';

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

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { value: 'asc', label: 'A–Z' },
  { value: 'desc', label: 'Z–A' },
];

export default function BoothReport() {
  const [submissions, setSubmissions] = useState([]);
  // FIX: Added server pagination states and locations state
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [locations, setLocations] = useState([]);

  const [selectedReport, setSelectedReport] = useState(null);

  // FEATURE: State tracking for selected video modals
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [imageZoom, setImageZoom] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');

  const [verifyingReport, setVerifyingReport] = useState(null);
  const [verifiedCounts, setVerifiedCounts] = useState({});
  const [verifying, setVerifying] = useState(false);


  const openVerifyModal = (report) => {
    const initialCounts = {};
    report.votes_breakdown.forEach(item => {
      // Default to the moderator count if it exists, otherwise fall back to the operator's count
      initialCounts[item.candidate_id] = item.moderator_vote_count !== null ? item.moderator_vote_count : item.vote_count;
    });
    setVerifiedCounts(initialCounts);
    setVerifyingReport(report);
  };

const handleVerifySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault(); // Safely handle event
    setVerifying(true);
    
    const payload = Object.keys(verifiedCounts).map(candidate_id => ({
      candidate_id: parseInt(candidate_id, 10),
      count: parseInt(verifiedCounts[candidate_id], 10) || 0
    }));

    try {
      const res = await apiCall(`/audit/verify/${verifyingReport.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ verified_votes: payload }) 
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

  // FIX: Server-side pagination fetch and location loaders
  const fetchSubmissions = async (page = 1) => {
    try {
      const query = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        state: filterState,
        lga: filterLga,
        ward: filterWard,
        search: searchTerm,
        sort: sortDir
      }).toString();

      const data = await apiCall(`/audit/submissions?${query}`);
      if (data.success) {
        setSubmissions(data.submissions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.totalRecords || 0);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await apiCall('/locations/all');
      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchSubmissions(currentPage);
  }, [currentPage, searchTerm, sortDir, filterState, filterLga, filterWard]);

  // FIX: Cascade location options derived from complete location hierarchy
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

  // FIX: Shifted filtering, sorting and pagination to server-side
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
                <th>Media Attachments</th>
                <th>Moderator Count</th>
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
                      className="btn-icon"
                      style={actionIconStyle('primary')}
                      title="View Report"
                      aria-label="View Report"
                      onClick={() => setSelectedReport(sub)}
                    >
                      <IconFileText />
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={actionIconStyle('primary')}
                        title="View Photo"
                        aria-label="View Photo"
                        onClick={() => setSelectedImage({
                          url: sub.tally_sheet_url,
                          booth: sub.unique_booth_code,
                          operator: sub.operator_name
                        })}
                      >
                        <IconImage />
                      </button>
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
                            operator: sub.operator_name
                          })}
                        >
                          <IconVideo />
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={actionIconStyle('primary')}
                        title="Edit / Verify Count"
                        aria-label="Edit / Verify Count"
                        onClick={() => openVerifyModal(sub)}
                      >
                        <EditIcon />
                      </button>
                      {sub.votes_breakdown?.some(v => v.moderator_vote_count !== null) && (
                        <span className="badge badge-soft-success">Verified</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pageSubmissions.length === 0 && submissions.length > 0 && (
                <tr><td colSpan={6} className="empty-state">No submissions match the selected filters.</td></tr>
              )}
              {submissions.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No submissions yet.</td></tr>
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
              
              {/* LEFT SIDE: Image Preview */}
              <div style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                {verifyingReport.tally_sheet_url ? (
                  isPdf(verifyingReport.tally_sheet_url) ? (
                    <iframe src={verifyingReport.tally_sheet_url} style={{ width: '100%', height: '65vh', border: 'none' }} />
                  ) : (
                    <img src={verifyingReport.tally_sheet_url} alt="Tally Sheet" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                  )
                ) : (
                  <span style={{ color: '#94a3b8' }}>No image attached</span>
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
                        <div className="muted" style={{ fontSize: 11, color: 'var(--bs-primary)' }}>Operator input: {item.vote_count}</div>
                      </div>
                      <input
                        type="number"
                        required
                        min="0"
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