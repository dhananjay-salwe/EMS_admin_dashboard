// OLD CODE:
const API_BASE_URL = 'https://ems-backend-55q1.onrender.com/api';

// FIX: Point to local backend API server on port 5000 for testing
// const API_BASE_URL = 'http://localhost:5000/api';

export const apiCall = async (endpoint, options = {}) => {
  try {
    const isFormData = options.body instanceof FormData;

    // FormData needs the browser to set its own multipart boundary header —
    // sending a hardcoded 'application/json' here would break file uploads.
    const headers = isFormData
      ? { ...options.headers }
      : { 'Content-Type': 'application/json', ...options.headers };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network or Server Error' };
  }
};