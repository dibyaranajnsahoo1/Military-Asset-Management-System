// api.js
// Utility for making API requests to the backend with token-based authentication

const API_BASE = process.env.REACT_APP_API_URL || 'https://military-asset-management-system-5ylk.onrender.com/api';
console.log("API_BASE =", API_BASE);

// Storage keys
const TOKEN_KEY = 'auth_token';

// Get stored token
const getToken = () => sessionStorage.getItem(TOKEN_KEY);

// Set token
const setToken = (token) => {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

// Clear token
const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add Authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && window.location.pathname !== '/login') {
      // Clear token and notify about session expiration
      clearToken();
      window.dispatchEvent(new Event('auth_expired'));
    }
    if (data.errors && Array.isArray(data.errors)) {
      throw new Error(data.errors.map(e => e.msg).join(', '));
    }
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await request('/auth/login', { method: 'POST', body: { email, password } });
    // Store token from login response
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },
  logout: async () => {
    const res = await request('/auth/logout', { method: 'POST' });
    clearToken();
    return res;
  },
  getMe: () => request('/auth/me'),

  // Dashboard
  getDashboardMetrics: (qs = '') => request(`/dashboard/metrics${qs}`),
  getDashboardChart: (qs = '') => request(`/dashboard/chart${qs}`),

  // Bases
  getBases: () => request('/bases'),

  // Assets
  getAssets: () => request('/assets'),

  // Purchases
  getPurchases: () => request('/purchases'),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: data }),

  // Transfers
  getTransfers: () => request('/transfers'),
  createTransfer: (data) => request('/transfers', { method: 'POST', body: data }),

  // Assignments
  getAssignments: () => request('/assignments'),
  createAssignment: (data) => request('/assignments', { method: 'POST', body: data }),

  // Expenditures
  getExpenditures: () => request('/expenditures'),
  createExpenditure: (data) => request('/expenditures', { method: 'POST', body: data }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};
// ok