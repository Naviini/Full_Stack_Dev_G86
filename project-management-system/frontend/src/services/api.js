import axios from 'axios';

// Use backend on port 5001 (updated from 5000)
const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  getMe: () => api.get('/auth/me'),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const tasksAPI = {
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  addSubtask: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
  updateSubtask: (taskId, subtaskId, data) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  logTime: (taskId, data) => api.post(`/tasks/${taskId}/time-logs`, data),
  // Admin only routes
  adminUpdate: (id, data) => api.put(`/tasks/admin/${id}`, data),
  adminDelete: (id) => api.delete(`/tasks/admin/${id}`),
  adminGetAll: () => api.get('/tasks/admin/list/all'),
  adminBulkUpdate: (data) => api.put('/tasks/admin/bulk/update', data),
  adminGetStats: () => api.get('/tasks/admin/stats/overview'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
};

export const analyticsAPI = {
  getProjectAnalytics: (projectId) => api.get(`/analytics/project/${projectId}`),
  getDashboardOverview: () => api.get('/analytics/dashboard/overview'),
};

export const milestonesAPI = {
  addMilestone: (projectId, data) => api.post(`/milestones/${projectId}/milestones`, data),
  updateMilestone: (projectId, milestoneId, data) => api.put(`/milestones/${projectId}/milestones/${milestoneId}`, data),
  addRisk: (projectId, data) => api.post(`/milestones/${projectId}/risks`, data),
  updateRisk: (projectId, riskId, data) => api.put(`/milestones/${projectId}/risks/${riskId}`, data),
};

export const invitationsAPI = {
  inviteMember: (projectId, data) => api.post(`/invitations/project/${projectId}/invite`, data),
  getProjectInvitations: (projectId) => api.get(`/invitations/project/${projectId}/invitations`),
  getMyInvitations: () => api.get('/invitations/my-invitations'),
  acceptInvitation: (invitationId) => api.post(`/invitations/invitations/${invitationId}/accept`),
  rejectInvitation: (invitationId) => api.post(`/invitations/invitations/${invitationId}/reject`),
  resendInvitation: (invitationId) => api.post(`/invitations/invitations/${invitationId}/resend`),
  cancelInvitation: (invitationId) => api.post(`/invitations/invitations/${invitationId}/cancel`),
  removeMember: (projectId, userId) => api.post(`/invitations/project/${projectId}/members/${userId}/remove`),
  updateMemberRole: (projectId, userId, data) => api.put(`/invitations/project/${projectId}/members/${userId}/role`, data),
};

export const collaborationAPI = {
  getItems: (projectId, type = null) => {
    const url = type 
      ? `/collaboration/project/${projectId}?type=${type}`
      : `/collaboration/project/${projectId}`;
    return api.get(url);
  },
  createItem: (data) => api.post('/collaboration', data),
  updateItem: (id, data) => api.put(`/collaboration/${id}`, data),
  deleteItem: (id) => api.delete(`/collaboration/${id}`),
  addReply: (itemId, data) => api.post(`/collaboration/${itemId}/replies`, data),
  likeItem: (itemId) => api.post(`/collaboration/${itemId}/like`),
  pinItem: (itemId) => api.patch(`/collaboration/${itemId}/pin`),
};

export default api;
