// const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = 'https://ems-backend-t6u3.onrender.com/api';

export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network or Server Error' };
  }
};