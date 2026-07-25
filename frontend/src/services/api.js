import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

export const circlesAPI = {
  list: () => api.get('/api/circles'),
  create: (data) => api.post('/api/circles', data),
  getById: (id) => api.get(`/api/circles/${id}`),
  addMember: (id, data) => api.post(`/api/circles/${id}/members`, data),
  listMembers: (id) => api.get(`/api/circles/${id}/members`),
  leave: (id) => api.delete(`/api/circles/${id}/members/me`),
};

export const expensesAPI = {
  list: (circleId) => api.get(`/api/circles/${circleId}/expenses`),
  create: (circleId, data) => api.post(`/api/circles/${circleId}/expenses`, data),
  getById: (circleId, expenseId) => api.get(`/api/circles/${circleId}/expenses/${expenseId}`),
  update: (circleId, expenseId, data) => api.patch(`/api/circles/${circleId}/expenses/${expenseId}`, data),
  remove: (circleId, expenseId) => api.delete(`/api/circles/${circleId}/expenses/${expenseId}`),
};

export const balancesAPI = {
  getBalances: (circleId) => api.get(`/api/circles/${circleId}/balances`),
  optimize: (circleId) => api.get(`/api/circles/${circleId}/settlements/optimize`),
  pay: (settlementId) => api.post(`/api/settlements/${settlementId}/pay`),
};

export const choresAPI = {
  list: (circleId) => api.get(`/api/circles/${circleId}/chores`),
  create: (circleId, data) => api.post(`/api/circles/${circleId}/chores`, data),
  listAssignments: (circleId) => api.get(`/api/circles/${circleId}/chores/assignments`),
  assign: (circleId, choreId, data) => api.post(`/api/circles/${circleId}/chores/${choreId}/assign`, data),
  complete: (assignmentId) => api.post(`/api/chores/assignments/${assignmentId}/complete`),
  analytics: (circleId) => api.get(`/api/circles/${circleId}/chore-analytics`),
};

export const fairnessAPI = {
  calculate: (circleId) => api.post(`/api/circles/${circleId}/fairness/calculate`),
  leaderboard: (circleId) => api.get(`/api/circles/${circleId}/fairness`),
};

export const insightsAPI = {
  get: (circleId, refresh = false) =>
    api.get(`/api/circles/${circleId}/insights`, { params: refresh ? { refresh: true } : {} }),
  getConflicts: (circleId) => api.get(`/api/circles/${circleId}/conflicts`),
};

export const ocrAPI = {
  scanReceipt: (formData) =>
    api.post('/api/ocr/receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createExpense: (payload) => api.post('/api/ocr/create-expense', payload),
};

export const voiceAPI = {
  logExpense: (transcript) => api.post('/api/voice/expense', { transcript }),
};
