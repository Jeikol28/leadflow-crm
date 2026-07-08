import { httpClient } from '../../shared/api/httpClient'
import type { OnboardingStatus } from './onboarding.types'

// Obtiene el checklist de activación inicial de la empresa.
export async function getOnboardingStatus() {
  const response = await httpClient.get<OnboardingStatus>('/onboarding/status')
  return response.data
}
