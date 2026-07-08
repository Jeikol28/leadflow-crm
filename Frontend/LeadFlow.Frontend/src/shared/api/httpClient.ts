import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '../types/auth.types'
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  saveAuthTokens,
} from '../utils/authStorage'

// Lee la URL de la API desde la configuración de entorno (.env.local).
const apiBaseUrl = import.meta.env.VITE_API_URL

if (!apiBaseUrl) {
  throw new Error(
    'Falta la variable de entorno VITE_API_URL. Defínela en tu archivo .env.local.',
  )
}

// Cliente HTTP centralizado para consumir la API de LeadFlow.
export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Cliente sin interceptores, usado solo para renovar la sesión y evitar recursión.
const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Agrega automaticamente el token JWT a cada solicitud protegida.
httpClient.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ───── Renovación automática de sesión ante respuestas 401 ─────

// Garantiza una sola renovación en paralelo: las demás solicitudes esperan a esa.
let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

function resolvePendingRequests(token: string | null) {
  pendingRequests.forEach((callback) => callback(token))
  pendingRequests = []
}

// Cierra la sesión de forma segura cuando ya no es posible renovarla.
function forceLogout() {
  clearAuthTokens()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    const status = error.response?.status
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/') ?? false

    // Solo renovamos ante 401, una única vez, y nunca en endpoints de autenticación.
    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()

    // Sin refresh token no hay forma de renovar: cerramos sesión.
    if (!refreshToken) {
      forceLogout()
      return Promise.reject(error)
    }

    // Si ya hay una renovación en curso, esperamos a que termine y reintentamos.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((newToken) => {
          if (!newToken) {
            reject(error)
            return
          }
          originalRequest._retry = true
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(httpClient(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await refreshClient.post<AuthResponse>('/auth/refresh-token', {
        refreshToken,
      })

      // El refresh token es rotativo: guardamos el token y el refresh NUEVOS.
      saveAuthTokens(data.token, data.refreshToken)
      resolvePendingRequests(data.token)

      originalRequest.headers.Authorization = `Bearer ${data.token}`
      return httpClient(originalRequest)
    } catch (refreshError) {
      resolvePendingRequests(null)
      forceLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)