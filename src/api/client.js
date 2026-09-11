import { isTokenValid } from '../utils/authUtils';

// OLD CODE:
const API_BASE_URL = 'https://ems-backend-55q1.onrender.com/api';

// FIX: Point to local backend API server on port 5000 for testing
// const API_BASE_URL = 'http://localhost:5000/api';

const triggerSessionExpired = (message = 'Your session has expired. Please log in again.') => {
  localStorage.removeItem('token');
  localStorage.removeItem('ems_admin_user');
  window.dispatchEvent(new CustomEvent('ems:session-expired', {
    detail: { message }
  }));
};

export const apiCall = async (endpoint, options = {}) => {
  try {
    const isAuthEndpoint = endpoint.includes('/auth/admin/login') || endpoint.includes('/auth/login');
    const token = localStorage.getItem('token');

    // 1. Proactive pre-check: If token is stored but already expired, immediately logout
    if (token && !isAuthEndpoint && !isTokenValid(token)) {
      triggerSessionExpired('Your session has expired. Please log in again.');
      return { success: false, message: 'Session expired' };
    }

    const isFormData = options.body instanceof FormData;

    // FormData needs the browser to set its own multipart boundary header —
    // sending a hardcoded 'application/json' here would break file uploads.
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 2. Reactive check: Intercept 401 Unauthorized or 403 Forbidden with expired/invalid token
    if (!isAuthEndpoint && (response.status === 401 || response.status === 403)) {
      const errorData = await response.clone().json().catch(() => null);
      if (
        response.status === 401 ||
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.code === 'TOKEN_INVALID' ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('token')
      ) {
        const msg = errorData?.message || 'Your session has expired. Please log in again.';
        triggerSessionExpired(msg);
        return errorData || { success: false, message: msg };
      }
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network or Server Error' };
  }
};