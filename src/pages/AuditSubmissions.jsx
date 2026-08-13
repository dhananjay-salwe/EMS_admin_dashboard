import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';

const IconSearch = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function AuditSubmissions() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const data = await apiCall('/audit/submissions');
      if (data.success) setSubmissions(data.submissions);
    };
    fetchSubmissions();
  }, []);

  return (
    <div>
      <div className="page-title-box">
        <div>
          <h1>Audit Images</h1>
          <div className="breadcrumb">
            <span>Dashboard</span> / <span className="current">Audit Images</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Vote Submissions &amp; Tally Sheet Audit</h2>
          <span className="muted">{submissions.length} submissions</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time Submitted</th>
                <th>Booth Code &amp; Name</th>
                <th>Submitted By</th>
                <th>Tally Sheet Photo</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td>{new Date(sub.created_at).toLocaleString()}</td>
                  <td>
                    <strong>{sub.unique_booth_code}</strong>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub.booth_name}</div>
                  </td>
                  <td>{sub.operator_name}</td>
                  <td>
                    <a
                      href={sub.tally_sheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <IconSearch /> View image
                    </a>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan={4} className="empty-state">No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}