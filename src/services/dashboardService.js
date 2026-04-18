// services/dashboardService.js
import api from './api';

export const dashboardService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getAcademicActivity: () => api.get('/academic/activity'),
  getObjectives: () => api.get('/academic/objectives'),
  updateObjective: (id, progress) => api.put(`/academic/objectives/${id}`, { progress }),
  getPopularTags: () => api.get('/tags/popular'),
  getUserInterests: () => api.get('/tags/interests'),
  addInterest: (tag) => api.post('/tags/interests', { tag }),
  removeInterest: (tag) => api.delete(`/tags/interests/${encodeURIComponent(tag)}`),
};

export default dashboardService;