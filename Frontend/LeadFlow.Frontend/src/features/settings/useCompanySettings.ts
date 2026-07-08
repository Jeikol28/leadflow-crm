import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCompanySettings, updateCompanySettings } from './settingsService'

export function useCompanySettings() {
  const query = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
    staleTime: 5 * 60_000,
  })
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar la configuración.' : null,
  }
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
  })
}
