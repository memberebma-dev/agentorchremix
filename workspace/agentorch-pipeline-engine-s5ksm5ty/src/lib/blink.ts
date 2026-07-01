import { createClient } from '@blinkdotnew/sdk'

function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  return match ? match[1] : 'demo-project'
}

export const blink = createClient({
  projectId: getProjectId(),
  auth: { mode: 'managed' },
})
