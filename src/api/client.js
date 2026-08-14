// const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = 'https://ems-backend-t6u3.onrender.com/api';

export const apiCall = async (endpoint, options = {}) => {
  try {
    const headers = { ...options.headers };
    
    // Automatically manage Content-Type based on the payload type
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    } else {
      // Browser must automatically set Content-Type with boundary for FormData
      delete headers['Content-Type'];
    }

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