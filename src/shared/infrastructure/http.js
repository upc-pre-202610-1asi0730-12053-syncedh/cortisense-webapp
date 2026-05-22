/**
 * @file http.js
 * @description Instancia de Axios configurada para la API de CortiSense.
 * Agrega el token Bearer automáticamente en cada request.
 */

import axios from 'axios'

/**
 * Instancia principal de HTTP para CortiSense.
 * baseURL apunta a VITE_CORTISENSE_API_URL del .env.development.
 * @type {import('axios').AxiosInstance}
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_CORTISENSE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Interceptor de request: adjunta el token JWT si existe en localStorage.
 */
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cortisense_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Interceptor de response: manejo centralizado de errores HTTP.
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('cortisense_token')
      sessionStorage.removeItem('cortisense_user')
      localStorage.removeItem('cortisense_token')
      localStorage.removeItem('cortisense_user')
      window.location.href = '/auth/sign-in'
    }
    return Promise.reject(error)
  }
)

export { http }
