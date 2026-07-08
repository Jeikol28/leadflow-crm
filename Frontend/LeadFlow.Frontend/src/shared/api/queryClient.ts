import { QueryClient } from '@tanstack/react-query'

// Cliente global de TanStack Query: caché, reintentos y refresco al volver a la pestaña.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos se consideran frescos 30s; después se revalidan en segundo plano.
      staleTime: 30_000,
      // Un reintento ante fallos de red transitorios.
      retry: 1,
      // Refresca automáticamente cuando el usuario vuelve a la ventana.
      refetchOnWindowFocus: true,
    },
  },
})
