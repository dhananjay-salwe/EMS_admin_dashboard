import React, { useState } from 'react';
import { apiCall } from '../api/client';

const IconBolt = (props) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
  </svg>
);

export default function Login({ onLoginSuccess }) {
  // Empty default states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = await apiCall('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setSubmitting(false);

    if (data.success) {
      onLoginSuccess(data.admin);
    } else {
      alert(data.message || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-banner">
          <h2>Welcome back!</h2>
          <p>Sign in to EMS to continue</p>
        </div>
        <div className="auth-logo"><IconBolt /></div>

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}