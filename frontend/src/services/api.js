import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

// ── Circles ────────────────────────────────────────────────────────────────
export const circlesAPI = {
  list: () => api.get('/api/circles'),
  create: (data) => api.post('/api/circles', data),
  getById: (id) => api.get(`/api/circles/${id}`),
  addMember: (id, data) => api.post(`/api/circles/${id}/members`, data),
  listMembers: (id) => api.get(`/api/circles/${id}/members`),
  leave: (id) => api.delete(`/api/circles/${id}/members/me`),
};

// ── Expenses ───────────────────────────────────────────────────────────────
export const expensesAPI = {
  list: (circleId) => api.get(`/api/circles/${circleId}/expenses`),
  create: (circleId, data) => api.post(`/api/circles/${circleId}/expenses`, data),
  getById: (circleId, expenseId) => api.get(`/api/circles/${circleId}/expenses/${expenseId}`),
};

// ── Balances & Settlements ─────────────────────────────────────────────────
export const balancesAPI = {
  getBalances: (circleId) => api.get(`/api/circles/${circleId}/balances`),
  optimize: (circleId) => api.get(`/api/circles/${circleId}/settlements/optimize`),
  pay: (settlementId) => api.post(`/api/settlements/${settlementId}/pay`),
};

// ── Chores ─────────────────────────────────────────────────────────────────
export const choresAPI = {
  list: (circleId) => api.get(`/api/circles/${circleId}/chores`),
  create: (circleId, data) => api.post(`/api/circles/${circleId}/chores`, data),
  listAssignments: (circleId) => api.get(`/api/circles/${circleId}/chores/assignments`),
  assign: (circleId, choreId, data) => api.post(`/api/circles/${circleId}/chores/${choreId}/assign`, data),
  complete: (assignmentId) => api.post(`/api/chores/assignments/${assignmentId}/complete`),
  analytics: (circleId) => api.get(`/api/circles/${circleId}/chore-analytics`),
};

// ── Fairness ───────────────────────────────────────────────────────────────
export const fairnessAPI = {
  calculate: (circleId) => api.post(`/api/circles/${circleId}/fairness/calculate`),
  leaderboard: (circleId) => api.get(`/api/circles/${circleId}/fairness`),
};

// ── AI Insights ────────────────────────────────────────────────────────────
export const insightsAPI = {
  get: (circleId, refresh = false) =>
    api.get(`/api/circles/${circleId}/insights`, { params: refresh ? { refresh: true } : {} }),
  getConflicts: (circleId) => api.get(`/api/circles/${circleId}/conflicts`),
};

// ── OCR ────────────────────────────────────────────────────────────────────
export const ocrAPI = {
  scanReceipt: (formData) =>
    api.post('/api/ocr/receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Voice ──────────────────────────────────────────────────────────────────
export const voiceAPI = {
  logExpense: (transcript) => api.post('/api/voice/expense', { transcript }),
};
