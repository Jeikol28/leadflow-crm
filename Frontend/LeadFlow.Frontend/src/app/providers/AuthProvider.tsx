import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AuthenticatedUser,
  AuthResponse,
  LoginRequest,
  RegisterCompanyResponse,
  RegisterRequest,
} from '../../shared/types/auth.types'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../../features/auth/authService'
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  getUserProfile,
  saveAuthTokens,
  saveUserProfile,
} from '../../shared/utils/authStorage'

// Este archivo maneja la sesion global del usuario: login, logout y restauracion de sesion.
type AuthContextValue = {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isLoadingSession: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<RegisterCompanyResponse>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthResponseToUser(response: AuthResponse): AuthenticatedUser {
  return {
    companyId: response.companyId,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
    isAuthenticated: true,
  }
}

// Persiste el perfil tras login/registro para restaurarlo al recargar.
function persistProfile(response: AuthResponse) {
  saveAuthTokens(response.token, response.refreshToken)
  saveUserProfile({
    fullName: response.fullName,
    email: response.email,
    role: response.role,
    companyId: response.companyId,
  })
}

// Proveedor global para manejar la sesion del usuario autenticado.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = getAuthToken()

      if (!token) {
        setIsLoadingSession(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        // /current-user no devuelve el nombre, así que lo tomamos del perfil guardado.
        const storedProfile = getUserProfile()

        setUser({
          userId: currentUser.userId,
          companyId: currentUser.companyId,
          email: currentUser.email,
          fullName: storedProfile?.fullName,
          role: currentUser.role,
          isAuthenticated: currentUser.isAuthenticated,
        })
      } catch {
        clearAuthTokens()
        setUser(null)
      } finally {
        setIsLoadingSession(false)
      }
    }

    void restoreSession()
  }, [])

  async function login(request: LoginRequest) {
    const response = await loginRequest(request)
    persistProfile(response)
    setUser(mapAuthResponseToUser(response))
  }

  // El registro ya no inicia sesión: devuelve la info para ir a verificar el correo.
  async function register(request: RegisterRequest) {
    return await registerRequest(request)
  }

  async function logout() {
    const refreshToken = getRefreshToken()

    // Intenta revocar el refresh token en el backend; si falla, igual cerramos local.
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken)
      } catch {
        // Silencioso: la sesión local se cierra de todas formas.
      }
    }

    clearAuthTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user?.isAuthenticated),
        isLoadingSession,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook para consumir la sesion desde cualquier componente.
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
