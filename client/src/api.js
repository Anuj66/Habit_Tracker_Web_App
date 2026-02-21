import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const getHabits = () => api.get('/habits');
export const createHabit = (habit) => api.post('/habits', habit);
export const deleteHabit = (id) => api.delete(`/habits/${id}`);
export const getTracking = (habitId) => api.get(`/tracking/${habitId}`);
export const updateTracking = (habitId, date, completed) =>
  api.post('/tracking', { habitId, date, completed });
export const getSuggestions = (habitId) => api.get(`/suggestions/${habitId}`);
export const addSuggestion = (habitId, suggestion) =>
  api.post('/suggestions', { habitId, suggestion });

export const getCsrfToken = () => api.get('/auth/csrf');
export const register = (data, csrfToken) =>
  api.post('/auth/register', data, { headers: { 'x-csrf-token': csrfToken } });
export const login = (data, csrfToken) =>
  api.post('/auth/login', data, { headers: { 'x-csrf-token': csrfToken } });
export const logout = (csrfToken) =>
  api.post('/auth/logout', {}, { headers: { 'x-csrf-token': csrfToken } });
export const verifyEmail = (token, csrfToken) =>
  api.post(
    '/auth/verify-email',
    { token },
    {
      headers: { 'x-csrf-token': csrfToken },
    },
  );
export const requestPasswordReset = (email, csrfToken) =>
  api.post(
    '/auth/password-reset/request',
    { email },
    {
      headers: { 'x-csrf-token': csrfToken },
    },
  );
export const confirmPasswordReset = (token, newPassword, csrfToken) =>
  api.post(
    '/auth/password-reset/confirm',
    { token, newPassword },
    {
      headers: { 'x-csrf-token': csrfToken },
    },
  );
export const getCurrentUser = () => api.get('/auth/me');

export default api;
