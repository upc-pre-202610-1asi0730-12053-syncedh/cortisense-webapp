import axios from 'axios'

const normalizeBaseUrl = value =>
  String(value || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '')

const baseURL = normalizeBaseUrl(
  import.meta.env.VITE_CORTISENSE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://api.cortisense.space/api/v1'
)
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