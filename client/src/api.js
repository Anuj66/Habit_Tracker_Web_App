import axios from 'axios'
import { notifyError } from './errorNotifications'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      if (error.response) {
        const statusCode = error.response.status
        const data = error.response.data || {}

        if (error.config && error.config.url && error.config.url.endsWith('/auth/me') && statusCode === 401) {
          return Promise.reject(error)
        }

        const category =
          data.category ||
          (statusCode >= 500
            ? 'server_error'
            : statusCode >= 400
            ? 'client_error'
            : 'unknown_error')

        const message =
          data.message ||
          data.error ||
          (category === 'client_error'
            ? 'There was a problem with your request.'
            : category === 'server_error'
            ? 'The server encountered an error. Please try again later.'
            : 'Something went wrong. Please try again.')

        notifyError({
          statusCode,
          errorCode: data.errorCode || null,
          category,
          message,
        })
      } else {
        const isTimeout =
          error.code === 'ECONNABORTED' || (typeof error.message === 'string' && error.message.includes('timeout'))

        notifyError({
          statusCode: null,
          errorCode: isTimeout ? 'NETWORK_TIMEOUT' : 'NETWORK_SERVER_UNAVAILABLE',
          category: 'network_error',
          message: isTimeout
            ? 'The request timed out. Please check your connection and try again.'
            : 'Unable to reach the server. Please check your connection and try again.',
        })
      }
    } catch (_) {}

    return Promise.reject(error)
  },
)

export const getHabits = () => api.get('/habits')
export const createHabit = (habit) => api.post('/habits', habit)
export const updateHabit = (id, habit) => api.put(`/habits/${id}`, habit)
export const deleteHabit = (id) => api.delete(`/habits/${id}`)
export const getTracking = (habitId) => api.get(`/tracking/${habitId}`)
export const updateTracking = (habitId, date, completed) =>
  api.post('/tracking', { habitId, date, completed })
export const getSuggestions = (habitId) => api.get(`/suggestions/${habitId}`)
export const addSuggestion = (habitId, suggestion) =>
  api.post('/suggestions', { habitId, suggestion })

export const getCsrfToken = () => api.get('/auth/csrf')
export const register = (data, csrfToken) =>
  api.post('/auth/register', data, { headers: { 'x-csrf-token': csrfToken } })
export const login = (data, csrfToken) =>
  api.post('/auth/login', data, { headers: { 'x-csrf-token': csrfToken } })
export const logout = (csrfToken) =>
  api.post('/auth/logout', {}, { headers: { 'x-csrf-token': csrfToken } })
export const verifyEmail = (token, csrfToken) =>
  api.post(
    '/auth/verify-email',
    { token },
    {
      headers: { 'x-csrf-token': csrfToken },
    },
  )
export const requestPasswordReset = (email, csrfToken) =>
  api.post(
    '/auth/password-reset/request',
    { email },
    {
      headers: { 'x-csrf-token': csrfToken },
    },
  )
export const confirmPasswordReset = (token, newPassword, csrfToken) =>
  api.post(
    '/auth/password-reset/confirm',
    { token, newPassword },
    {
      headers: { 'x-csrf-token': csrfToken },
    },
  )
export const getCurrentUser = () => api.get('/auth/me')

export default api
