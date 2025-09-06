// src/services/api.js
import axios from 'axios';

// Configure the base URL for your backend API
// IMPORTANT: This should be your backend server URL, e.g., 'http://localhost:5000'
// We've added a fallback to `http://localhost:5000` to help with debugging
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get token from local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle token expiration/invalidity
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 (Unauthorized) and not a login/refresh request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      // You might implement token refresh logic here if you have refresh tokens
      // For now, let's simply clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Clear user info too
      // You might want to dispatch a logout action if using a global state management like Redux
      window.location.href = '/login'; // Redirect to login page
      return Promise.reject(error); // Reject the promise to stop further processing
    }
    // For 403 (Forbidden) errors, it means the user is authenticated but doesn't have permission
    if (error.response.status === 403) {
      // You might show a specific "Access Denied" message or redirect to an unauthorized page
      console.error('Access Denied: You do not have permission to perform this action.');
      // Optionally redirect
      // window.location.href = '/unauthorized';
    }
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION API CALLS ---
export const login = async (credentials) => {
  // Use the full path, including /api, to match the backend router configuration
  const response = await api.post(`/auth/login`, credentials);
  const { token, user } = response.data;
  localStorage.setItem('token', token); // Store JWT token
  localStorage.setItem('user', JSON.stringify(user)); // Store user info
  return { user, token };
};


export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// New function to send OTP for registration
export const sendRegistrationOtp = async ({ email }) => {
  try {
    const response = await api.post('/auth/send-registration-otp', { email });
    return response.data; // Backend should confirm OTP sent
  } catch (error) {
    console.error('API Error sending OTP:', error);
    throw error; // Re-throw to be caught by AuthContext
  }
};

// New function to verify OTP and complete registration
export const verifyRegistrationOtp = async ({ username, email, password, otp }) => {
  try {
    const response = await api.post('/auth/verify-registration-otp', { username, email, password, otp });
    return response.data; // Backend should return user and token on success
  } catch (error) {
    console.error('API Error verifying OTP and registering:', error);
    throw error; // Re-throw to be caught by AuthContext
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout'); // Invalidate token on server side
  } catch (error) {
    console.error('Error during server-side logout:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
   
  }
};

// --- USER-RELATED API CALLS (Example) ---
export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

// --- ADMIN API CALLS ---

// Dashboard
export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard'); // Backend route for admin dashboard stats
  return response.data;
};

// User Management
export const getUsers = async (searchQuery = '', statusFilter = 'all', page = 1, limit = 20) => {
  const response = await api.get(`/admin/users?search=${searchQuery}&status=${statusFilter}&page=${page}&limit=${limit}`);
  return response.data;
};

export const toggleUserStatus = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/toggle-status`); // Patch for partial update
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const promoteUserToAdmin = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/promote-admin`); // Promote to admin role
  return response.data;
};


// Resource Management
export const getResources = async (searchQuery = '', subjectFilter = 'all', statusFilter = 'all', page = 1, limit = 20) => {
  const response = await api.get(`/admin/resources?search=${searchQuery}&subject=${subjectFilter}&status=${statusFilter}&page=${page}&limit=${limit}`);
  return response.data;
};

export const toggleResourceVisibility = async (resourceId) => {
  const response = await api.put(`/admin/resources/${resourceId}/toggle-visibility`); // Changed from patch to put
  return response.data;
};


export const deleteResource = async (resourceId) => {
  const response = await api.delete(`/admin/resources/${resourceId}`);
  return response.data;
};

export const resolveFlags = async (resourceId, actionType) => { // actionType can be 'approve' or 'remove'
  const response = await api.put(`/admin/resources/${resourceId}/resolve-flags`, { action: actionType }); // Changed from patch to put
  return response.data;
};
export default api;
