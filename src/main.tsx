import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { BlinkProvider, BlinkAuthProvider } from '@blinkdotnew/react'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  if (match) return match[1]
  return 'agentorch-pipeline-engine-s5ksm5ty'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlinkProvider
      projectId={getProjectId()}
      publishableKey={import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_7ClC0bGDrNQU__01R5zI6XD0wQ6ACKti'}
    >
      <BlinkAuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-right" theme="dark" />
          <App />
        </QueryClientProvider>
      </BlinkAuthProvider>
    </BlinkProvider>
  </React.StrictMode>,
)
