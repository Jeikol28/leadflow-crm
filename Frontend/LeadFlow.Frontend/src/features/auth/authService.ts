import { httpClient } from '../../shared/api/httpClient'
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginRequest,
  RegisterCompanyResponse,
  RegisterRequest,
  VerifyEmailRequest,
} from '../../shared/types/auth.types'

export async function login(request: LoginRequest) {
  const response = await httpClient.post<AuthResponse>('/auth/login', request)
  return response.data
}

// Registra una empresa nueva junto con su usuario administrador.
// Ya no inicia sesión: la cuenta queda pendiente de verificar el correo.
export async function register(request: RegisterRequest) {
  const response = await httpClient.post<RegisterCompanyResponse>('/auth/register-company', request)
  return response.data
}

// Verifica el correo con el código de 6 dígitos enviado al registrarse.
export async function verifyEmail(input: VerifyEmailRequest) {
  await httpClient.post('/auth/verify-email', input)
}

// Solicita el reenvío de un nuevo código de verificación.
export async function resendVerification(email: string) {
  await httpClient.post('/auth/resend-verification', { email })
}

export async function getCurrentUser() {
  const response = await httpClient.get<CurrentUserResponse>('/current-user')
  return response.data
}

// Revoca el refresh token en el backend para cerrar la sesión de forma segura.
export async function logout(refreshToken: string) {
  await httpClient.post('/auth/logout', { refreshToken })
}

// Inicia la recuperación de contraseña. El backend responde neutral (no revela si el correo existe).
export async function forgotPassword(email: string) {
  await httpClient.post('/auth/forgot-password', { email })
}

// Restablece la contraseña usando el token recibido por correo.
export async function resetPassword(input: {
  token: string
  newPassword: string
  confirmNewPassword: string
}) {
  await httpClient.post('/auth/reset-password', input)
}