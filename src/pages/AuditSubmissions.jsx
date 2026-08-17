import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

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

export default function BoothReport() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  const fetchSubmissions = async (page = 1) => {
    const data = await apiCall(`/audit/submissions?page=${page}&limit=10`);
    if (data.success) {
      setSubmissions(data.submissions || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setCurrentPage(data.pagination.currentPage || 1);
        setTotalSubmissions(data.pagination.totalRecords || 0);
      } else {
        setTotalSubmissions((data.submissions || []).length);
      }
    }
  };

  useEffect(() => {
    fetchSubmissions(currentPage);
  }, [currentPage]);

  const isPdf = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
  };

  return (
    <div>
      <div className="page-title-box">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Booth Report</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Vote Submissions &amp; Tally Sheet Audit</h2>
          <span className="muted">{totalSubmissions} submissions</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booth Officer</th>
                <th>Booth Code &amp; Name</th>
                <th>Time Submitted</th>
                <th>Vote Report</th>
                <th>Tally Sheet / Document</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
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
                      <IconImage style={{ marginRight: 5 }} /> View sheet
                    </button>
                  </td>
                </tr>
              ))}
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
                minHeight: '320px',
                maxHeight: '68vh',
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