import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' })

api.interceptors.request.use(c => {
  const t = localStorage.getItem('token')
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  return Promise.reject(e)
})

export const register = d => api.post('/auth/register', d)
export const login = d => api.post('/auth/login', new URLSearchParams({ username: d.email, password: d.password }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
export const getMe = () => api.get('/auth/me')
export const updateMe = d => api.put('/auth/me', d)

export const getServices = p => api.get('/services', { params: p })
export const getService = id => api.get(`/services/${id}`)
export const createService = d => api.post('/services', d)
export const updateService = (id, d) => api.put(`/services/${id}`, d)
export const deleteService = id => api.delete(`/services/${id}`)
export const getUserServices = id => api.get(`/users/${id}/services`)
export const getUser = id => api.get(`/users/${id}`)

export const addReview = d => api.post('/reviews', d)

export const getConversations = () => api.get('/messages/conversations')
export const getMessages = id => api.get(`/messages/${id}`)
export const sendMessage = d => api.post('/messages', d)

export const toggleFavorite = id => api.post(`/favorites/${id}`)
export const getMyFavorites = () => api.get('/favorites/my')

export const getDashboardStats = () => api.get('/dashboard/stats')

export default api
