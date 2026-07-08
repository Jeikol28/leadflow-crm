const TOKEN_KEY = 'leadflow_token'
const REFRESH_TOKEN_KEY = 'leadflow_refresh_token'
const USER_PROFILE_KEY = 'leadflow_user'

// Perfil mínimo que guardamos localmente para no perder datos como el nombre al recargar.
export type StoredUserProfile = {
  fullName?: string
  email?: string
  role?: string
  companyId?: number
}

// Guarda los tokens de sesion en el navegador.
export function saveAuthTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

// Obtiene el token JWT guardado.
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

// Obtiene el refresh token guardado.
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// Guarda el perfil del usuario (nombre, correo, rol) para restaurarlo al recargar.
export function saveUserProfile(profile: StoredUserProfile) {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
}

// Lee el perfil guardado; devuelve null si no existe o está corrupto.
export function getUserProfile(): StoredUserProfile | null {
  const raw = localStorage.getItem(USER_PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUserProfile
  } catch {
    return null
  }
}

// Elimina tokens y perfil cuando el usuario cierra sesion o esta expira.
export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
}
