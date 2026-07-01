import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'agentorch-pipeline-engine-dimg0s7y',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_is3Sy1vW0h-YmPhDwbG0N3x3LvqKdeVc',
  authRequired: false,
  auth: { mode: 'managed' },
})
