// Subscribers and affiliates represent AgentOrch's OWN paying customers and
// referral partners — platform business data, not any one tenant's pipeline.
// There's no real admin-role system yet, so ownership is gated by email as a
// placeholder until one exists. Replace this with a real role check (Blink's
// BlinkUser.role / appRole claim) once other tenants are onboarded.
const OWNER_EMAIL = 'memberebma@gmail.com'

export function isPlatformOwner(email?: string | null): boolean {
  return (email || '').toLowerCase() === OWNER_EMAIL
}
