import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Projects
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`)
};

// Translations
export const translationAPI = {
  getByProject: (projectId, params) => api.get(`/translations/project/${projectId}`, { params }),
  getById: (id) => api.get(`/translations/${id}`),
  create: (data) => api.post('/translations', data),
  update: (id, data) => api.put(`/translations/${id}`, data),
  delete: (id) => api.delete(`/translations/${id}`),
  translate: (id, data) => api.post(`/translations/${id}/translate`, data),
  batchTranslate: (projectId, data) => api.post(`/translations/project/${projectId}/batch-translate`, data),
  approve: (id, reviewer) => api.post(`/translations/${id}/approve`, { reviewer }),
  reject: (id, notes) => api.post(`/translations/${id}/reject`, { notes }),
  bulkApprove: (translationIds, reviewer) => api.post('/translations/bulk/approve', { translationIds, reviewer }),
  bulkReject: (translationIds, notes) => api.post('/translations/bulk/reject', { translationIds, notes })
};

// Upload
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadImages: (formData) => api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadBase64: (data) => api.post('/upload/base64', data)
};

// Glossary
export const glossaryAPI = {
  getAll: (params) => api.get('/glossary', { params }),
  getById: (id) => api.get(`/glossary/${id}`),
  create: (data) => api.post('/glossary', data),
  update: (id, data) => api.put(`/glossary/${id}`, data),
  delete: (id) => api.delete(`/glossary/${id}`),
  bulkImport: (data) => api.post('/glossary/bulk-import', data),
  getVersions: () => api.get('/glossary/versions'),
  getCategories: () => api.get('/glossary/categories')
};

// Export
export const exportAPI = {
  exportExcel: (projectId) => api.post(`/export/project/${projectId}/excel`),
  exportJSON: (projectId) => api.post(`/export/project/${projectId}/json`),
  exportPackage: (projectId, options) => api.post(`/export/project/${projectId}/package`, options),
  getDownloadUrl: (filename) => `${API_URL}/export/download/${filename}`
};

export default api;
