import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '../auth/authService'

// Devuelve el id del usuario autenticado (para asignarle tareas).
export function useCurrentUserId() {
  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 10 * 60_000,
  })

  return query.data?.userId ?? null
}