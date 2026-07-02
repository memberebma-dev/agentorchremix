export const BACKEND_URL = 'https://dimg0s7y.backend.blink.new'
export const ORCHESTRATOR_URL = `${BACKEND_URL}/orchestrator`

/**
 * The live preview URL for a generated asset, computed from the CURRENT backend
 * origin — never trust asset.hostedUrl from the DB. It's a plain string written
 * once at generation time, so any asset created while BACKEND_URL pointed at an
 * old/wrong project domain (this app has had that happen more than once) has a
 * permanently dead URL baked in that no backend fix can ever correct. Deriving
 * it fresh from leadId + type on every render fixes every asset retroactively,
 * old and new, with no DB migration.
 */
export function getAssetPreviewUrl(asset: { leadId: string; type: 'audit_report' | 'custom_website' }): string {
  const path = asset.type === 'audit_report' ? 'audit' : 'site'
  return `${BACKEND_URL}/preview/${path}/${asset.leadId}`
}
