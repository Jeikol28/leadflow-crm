import { httpClient } from '../../shared/api/httpClient'

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export async function changePassword(input: ChangePasswordInput) {
  await httpClient.post('/auth/change-password', input)
}
