import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

export default api;
