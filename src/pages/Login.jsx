import React, { useState } from 'react';
import { apiCall } from '../api/client';
import logoIcon from '../assets/icon.png';
import { toast } from 'react-hot-toast'; 

const IconBolt = (props) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
  </svg>
);

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // 2. Add a new state to track the visual success delay
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = await apiCall('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setSubmitting(false);

    if (data.success) {
      // 3. Trigger the visual success state
      setLoginSuccess(true);
      
// 4. Fire the welcome toast notification
      toast.success(`Welcome back, ${data.admin?.email || 'Admin'}!`, {
        icon: '👋',
        style: {
          borderRadius: '8px',
          background: '#fff',
          color: '#333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' // Adds a nice soft shadow
        },
      });

      // 5. Pause for 800ms so the user can see the green success button
      setTimeout(() => {
        onLoginSuccess(data.admin);
      }, 800);
      
    } else {
      // Bonus: Replace the ugly browser alert with a clean error toast!
      toast.error(data.message || 'Invalid credentials');
    }
  };

  // Dynamic button styling for the success state
  const buttonStyle = loginSuccess 
    ? { backgroundColor: '#34c38f', borderColor: '#34c38f', color: '#fff' } 
    : {};

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-banner">
          <h2>Welcome back!</h2>
          <p>Sign in to EMS to continue</p>
        </div>
        <div className="auth-logo">
          <img 
            src={logoIcon} 
            alt="EMS Logo" 
            style={{ width: 50, height: 50, objectFit: 'contain' }} 
          />
        </div>

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loginSuccess} // Lock input during success delay
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
              disabled={loginSuccess} // Lock input during success delay
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={submitting || loginSuccess}
            style={buttonStyle}
          >
            {loginSuccess ? '✅ Login Successful!' : submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}