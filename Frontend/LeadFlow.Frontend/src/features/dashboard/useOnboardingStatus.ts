import { useQuery } from '@tanstack/react-query'
import { getOnboardingStatus } from './onboardingService'

// Estado del onboarding. Si falla, simplemente no mostramos la tarjeta (no es crítico).
export function useOnboardingStatus() {
  const query = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: getOnboardingStatus,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
  }
}
