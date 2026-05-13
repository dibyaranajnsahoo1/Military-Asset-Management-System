// api.js
// Utility for making API requests to the backend with cookies included.

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const request = async (endpoint, options = {}) => {
  const config = {
    ...options,
    // ensure cookies are sent with requests
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && window.location.pathname !== '/login') {
      // Handle unauthorized (session expired)
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
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
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
