import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Use Firebase token for authentication
    const firebaseToken = localStorage.getItem('firebaseToken')
    console.log('📤 API Request:', config.url, '- Token present:', !!firebaseToken)
    if (firebaseToken) {
      config.headers.Authorization = `Bearer ${firebaseToken}`
    } else {
      console.warn('⚠️ No Firebase token found in localStorage!')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.config.url, '- Status:', response.status)
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error'
    console.error('❌ API Error:', error.config?.url, '- Status:', error.response?.status, '- Message:', message)
    
    if (error.response?.status === 401) {
      console.warn('🔐 Authentication failed - clearing tokens and redirecting to home')
      localStorage.removeItem('token')
      localStorage.removeItem('firebaseToken')
      localStorage.removeItem('quizify_token')
      localStorage.removeItem('quizify_currentUser')
      window.location.href = '/'
    }
    
    console.error('API Error Details:', message)
    return Promise.reject({ message, error })
  }
)

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// Quiz APIs
export const quizAPI = {
  generateAI: (data) => api.post('/quiz/generate-ai', data),
  create: (data) => api.post('/quiz/create', data),
  getQuiz: (quizId) => api.get(`/quiz/${quizId}`),
  list: () => api.get('/quiz/list'),
  getUserQuizzes: () => api.get('/quiz/user/quizzes'),
  update: (quizId, data) => api.put(`/quiz/${quizId}`, data),
  delete: (quizId) => api.delete(`/quiz/${quizId}`),
  joinQuiz: (quizId, data) => api.post(`/quiz/${quizId}/join`, data),
  getQuizWithParticipants: (quizId) => api.get(`/quiz/${quizId}/admin`),
  startQuiz: (quizId) => api.post(`/quiz/${quizId}/start`),
  endQuiz: (quizId) => api.post(`/quiz/${quizId}/end`),
  getByShareCode: (shareCode) => api.get(`/quiz/share/${shareCode}`),
}

// Results APIs
export const resultsAPI = {
  submitQuizResult: (quizId, answers, score) => api.post('/results/submit', { quizId, answers, score }),
  getQuizResults: (quizId) => api.get(`/results/quiz/${quizId}`),
  getLeaderboard: (quizId) => api.get(`/results/leaderboard/${quizId}`),
}

export default api
