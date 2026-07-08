// Este archivo define los tipos de datos que usa el frontend para autenticacion y sesion.

// Datos que enviamos al endpoint de login.
export type LoginRequest = {
  email: string
  password: string
}

// Datos que enviamos al endpoint de registro de empresa.
export type RegisterRequest = {
  companyName: string
  adminFullName: string
  adminEmail: string
  password: string
}

// Respuesta del registro: la cuenta queda creada pero requiere verificar el correo.
export type RegisterCompanyResponse = {
  message: string
  email: string
  requiresEmailVerification: boolean
}

// Datos para confirmar el correo con el código de 6 dígitos.
export type VerifyEmailRequest = {
  email: string
  code: string
}

// Respuesta que devuelve la API cuando el usuario inicia sesion o crea una cuenta.
export type AuthResponse = {
  token: string
  refreshToken: string
  email: string
  fullName: string
  role: string
  companyId: number
}

// Datos basicos del usuario actual obtenidos desde el token guardado.
export type CurrentUserResponse = {
  userId: number
  companyId: number
  email: string
  role: string
  isAuthenticated: boolean
}

// Usuario que el frontend guarda en memoria para saber quien esta usando la app.
export type AuthenticatedUser = {
  userId?: number
  companyId: number
  email: string
  fullName?: string
  role: string
  isAuthenticated: boolean
}