import axios from 'axios'

const baseURL = import.meta.env.VITE_CORTISENSE_API_URL || 'http://127.0.0.1:3000/api/v1'

const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

const publicHttp = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cortisense_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldSkipRedirect = Boolean(error.config?.skipAuthRedirect)
    const isUnauthorized = error.response?.status === 401
    const isAlreadyOnPublicInvitation = window.location.pathname === '/accept-invitation'

    if (isUnauthorized && !shouldSkipRedirect && !isAlreadyOnPublicInvitation) {
      sessionStorage.removeItem('cortisense_token')
      sessionStorage.removeItem('cortisense_user')

      window.location.href = '/sign-in'
    }

    return Promise.reject(error)
  }
)

export { http, publicHttp }