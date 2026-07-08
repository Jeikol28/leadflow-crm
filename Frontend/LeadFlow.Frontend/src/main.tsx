import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './shared/api/queryClient'
import { ToastProvider } from './shared/toast/ToastProvider'
import { ConfirmProvider } from './shared/confirm/ConfirmProvider'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { AuthProvider } from './app/providers/AuthProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
