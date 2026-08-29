/**
 * api.js — Centralized API service layer for RailBlock frontend.
 *
 * All requests go to /api/v1 (proxied by Vite → http://localhost:8000).
 * Import individual service objects to call the backend from any component.
 */

import axios from 'axios';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('railblock_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler — logs 401s (token expired) clearly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('railblock_token');
      console.warn('[RailBlock API] Session expired — token cleared.');
    }
    return Promise.reject(error);
  }
);

// ── Health ────────────────────────────────────────────────────────────────────
export const healthAPI = {
  /** GET /health — backend + DB connectivity check */
  check: () => api.get('/health', { baseURL: '' }),  // root-level endpoint
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ── Sections ──────────────────────────────────────────────────────────────────
export const sectionsAPI = {
  list: (page = 1, pageSize = 50) =>
    api.get('/sections', { params: { page, page_size: pageSize } }),
  get: (id) => api.get(`/sections/${id}`),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
  delete: (id) => api.delete(`/sections/${id}`),
};

// ── Maintenance Requests ──────────────────────────────────────────────────────
export const maintenanceAPI = {
  list: (params = {}) =>
    api.get('/maintenance', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        section_id: params.sectionId,
        department: params.department,
        status: params.status,
        priority: params.priority,
      },
    }),
  get: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

// ── Blocks ────────────────────────────────────────────────────────────────────
export const blocksAPI = {
  list: (params = {}) =>
    api.get('/blocks', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        section_id: params.sectionId,
        status: params.status,
      },
    }),
  get: (id) => api.get(`/blocks/${id}`),
  transition: (id, payload) => api.post(`/blocks/${id}/transition`, payload),
  exportBDMS: (id) => api.get(`/blocks/${id}/export-bdms`),
  exportT351: (id) => api.get(`/blocks/${id}/t351-notice`),
};

// ── Trains ────────────────────────────────────────────────────────────────────
export const trainsAPI = {
  list: (page = 1, pageSize = 50) =>
    api.get('/trains', { params: { page, page_size: pageSize } }),
  get: (id) => api.get(`/trains/${id}`),
  create: (data) => api.post('/trains', data),
  update: (id, data) => api.put(`/trains/${id}`, data),
  delete: (id) => api.delete(`/trains/${id}`),
};

// ── Train Movements ───────────────────────────────────────────────────────────
export const trainMovementsAPI = {
  list: (params = {}) =>
    api.get('/train-movements', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 50,
        section_id: params.sectionId,
        train_id: params.trainId,
      },
    }),
};

// ── Resources ─────────────────────────────────────────────────────────────────
export const resourcesAPI = {
  list: (page = 1, pageSize = 50) =>
    api.get('/resources', { params: { page, page_size: pageSize } }),
  get: (id) => api.get(`/resources/${id}`),
};

// ── Optimizer ─────────────────────────────────────────────────────────────────
export const optimizerAPI = {
  /** POST /optimizer/run — Run the block optimizer */
  run: (payload) => api.post('/optimizer/run', payload),
};

// ── Risk Scoring ──────────────────────────────────────────────────────────────
export const riskAPI = {
  score: (payload) => api.post('/risk-scoring/score', payload),
  batchScore: (payload) => api.post('/risk-scoring/batch-score', payload),
};

// ── Events (SSE) ──────────────────────────────────────────────────────────────
/**
 * Subscribe to real-time backend events via Server-Sent Events.
 * @param {(event: MessageEvent) => void} onMessage
 * @returns {EventSource} — call .close() to unsubscribe
 */
export function subscribeToEvents(onMessage) {
  const token = localStorage.getItem('railblock_token');
  const url = token
    ? `/api/v1/events?token=${encodeURIComponent(token)}`
    : '/api/v1/events';
  const es = new EventSource(url);
  es.onmessage = onMessage;
  es.onerror = (e) => console.error('[RailBlock SSE] connection error', e);
  return es;
}

export default api;
