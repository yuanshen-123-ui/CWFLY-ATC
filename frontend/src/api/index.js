import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('atc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r.data,
  e => { throw e.response?.data || { message: e.message } }
)

export default api

export function authApi() {
  return {
    login: (data) => api.post('/auth/login', data),
    profile: () => api.get('/auth/profile')
  }
}

export function questionApi() {
  return {
    list: (params) => api.get('/questions', { params }),
    create: (data) => api.post('/questions', data),
    update: (id, data) => api.put(`/questions/${id}`, data),
    remove: (id) => api.delete(`/questions/${id}`)
  }
}

export function examApi() {
  return {
    list: () => api.get('/exams'),
    get: (id) => api.get(`/exams/${id}`),
    create: (data) => api.post('/exams', data),
    update: (id, data) => api.put(`/exams/${id}`, data),
    remove: (id) => api.delete(`/exams/${id}`),
    submit: (id, data) => api.post(`/exams/${id}/submit`, data),
    attempts: () => api.get('/exam-attempts')
  }
}

export function simApi() {
  return {
    list: (params) => api.get('/sim-sessions', { params }),
    create: (data) => api.post('/sim-sessions', data),
    updateStatus: (id, data) => api.put(`/sim-sessions/${id}/status`, data)
  }
}

export function articleApi() {
  return {
    list: (params) => api.get('/articles', { params }),
    create: (data) => api.post('/articles', data),
    update: (id, data) => api.put(`/articles/${id}`, data),
    remove: (id) => api.delete(`/articles/${id}`),
    upload: (formData) => api.post('/articles/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  }
}

export function videoApi() {
  return {
    list: (params) => api.get('/videos', { params }),
    create: (data) => api.post('/videos', data),
    update: (id, data) => api.put(`/videos/${id}`, data),
    remove: (id) => api.delete(`/videos/${id}`)
  }
}

export function scheduleApi() {
  return {
    list: (params) => api.get('/schedules', { params }),
    create: (data) => api.post('/schedules', data),
    update: (id, data) => api.put(`/schedules/${id}`, data),
    remove: (id) => api.delete(`/schedules/${id}`)
  }
}

export function reportApi() {
  return {
    stats: () => api.get('/reports/stats'),
    list: () => api.get('/reports'),
    create: (data) => api.post('/reports', data)
  }
}

export function instructorApi() {
  return {
    list: () => api.get('/instructors'),
    apply: (data) => api.post('/instructor-applications', data),
    myApplications: () => api.get('/instructor-applications')
  }
}

export function adminApi() {
  return {
    atcUsers: () => api.get('/admin/atc-users'),
    updateAtcUser: (cid, data) => api.put(`/admin/atc-users/${cid}`, data),
    allSimSessions: () => api.get('/admin/sim-sessions'),
    syncAtcUsers: () => api.post('/admin/atc-users/sync')
  }
}
