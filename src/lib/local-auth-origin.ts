// Keep browser cookies and OAuth callbacks on one hostname during local development.
export function localAuthRedirect(requestUrl: string, canonicalUrl: string | undefined, mode: string | undefined): string | null {
  if (mode !== 'development' || !canonicalUrl) return null
  try {
    const current = new URL(requestUrl), canonical = new URL(canonicalUrl)
    const loopback = (host: string) => ['localhost', '127.0.0.1', '[::1]'].includes(host)
    if (!loopback(current.hostname) || !loopback(canonical.hostname)
      || current.protocol !== 'http:' || canonical.protocol !== 'http:'
      || current.port !== canonical.port || current.origin === canonical.origin) return null
    // Assign components rather than resolving a path which could start with //.
    current.hostname = canonical.hostname
    return current.toString()
  } catch { return null }
}
