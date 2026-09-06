const PLACEHOLDER_PATTERN = /(fallback|change-in-production|your-secret|password123)/i

export function getAuthSigningSecret(env = process.env): string {
  const secret = env.NEXTAUTH_SECRET || ''
  if (secret.length < 32 || PLACEHOLDER_PATTERN.test(secret)) {
    throw new Error('NEXTAUTH_SECRET must be a non-placeholder value of at least 32 characters')
  }
  return secret
}

export function allowedTemplateHosts(env = process.env): string[] {
  return (env.TEMPLATE_ALLOWED_HOSTS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
}

export function validateRuntimeConfig(env = process.env): void {
  const failures: string[] = []
  try { getAuthSigningSecret(env) } catch (error) { failures.push((error as Error).message) }
  const origins = (env.CORS_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
  const templateHosts = allowedTemplateHosts(env)
  const deliveryHosts = (env.EMAIL_DELIVERY_ALLOWED_HOSTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
  if (!origins.length || origins.includes('*')) failures.push('CORS_ALLOWED_ORIGINS must list explicit origins')
  if (templateHosts.some(host => host.includes('://') || host === '*')) failures.push('TEMPLATE_ALLOWED_HOSTS must list authoritative source hostnames')
  if (!env.DATABASE_URL?.startsWith('postgresql://')) failures.push('DATABASE_URL must identify PostgreSQL')
  if(env.EMAIL_DELIVERY_URL||env.EMAIL_DELIVERY_TOKEN||deliveryHosts.length){
  if (!env.EMAIL_DELIVERY_URL?.startsWith('https://')) failures.push('EMAIL_DELIVERY_URL must use HTTPS')
  if (!deliveryHosts.length || deliveryHosts.some(host => host.includes('://') || host === '*')) failures.push('EMAIL_DELIVERY_ALLOWED_HOSTS must list provider hostnames')
  if (!env.EMAIL_DELIVERY_TOKEN || env.EMAIL_DELIVERY_TOKEN.length < 16) failures.push('EMAIL_DELIVERY_TOKEN is required')
  try {
    const deliveryHost = new URL(env.EMAIL_DELIVERY_URL || '').hostname.toLowerCase()
    if (deliveryHost && !deliveryHosts.includes(deliveryHost)) failures.push('EMAIL_DELIVERY_URL host must be allowlisted')
  } catch {
    // Invalid URLs are already rejected by the HTTPS requirement.
  }
  }
  if (env.NODE_ENV === 'production') {
    if (!env.NEXTAUTH_URL?.startsWith('https://')) failures.push('NEXTAUTH_URL must use HTTPS in production')
    if (origins.some(origin => !origin.startsWith('https://'))) failures.push('Production CORS origins must use HTTPS')
    if (/(?:password|localhost)/i.test(env.DATABASE_URL || '')) failures.push('Production DATABASE_URL must use an external service without placeholder credentials')
    if (templateHosts.some(host => /localhost/i.test(host)) || deliveryHosts.some(host => /localhost/i.test(host))) failures.push('Production provider hosts must be external')
  }
  if (failures.length) throw new Error(`Invalid runtime configuration: ${failures.join('; ')}`)
}
