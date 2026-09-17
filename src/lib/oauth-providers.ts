import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import type { NextAuthOptions } from 'next-auth'

// An incomplete optional provider must not be advertised by /api/auth/providers.
export function getOAuthProviders(env: Record<string, string | undefined> = process.env): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = []
  const googleId = env.GOOGLE_CLIENT_ID?.trim()
  const googleSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  if (googleId && googleSecret) {
    providers.push(GoogleProvider({ clientId: googleId, clientSecret: googleSecret }))
  }
  const azureId = env.AZURE_AD_CLIENT_ID?.trim()
  const azureSecret = env.AZURE_AD_CLIENT_SECRET?.trim()
  if (azureId && azureSecret) {
    providers.push(AzureADProvider({
      clientId: azureId,
      clientSecret: azureSecret,
      tenantId: env.AZURE_AD_TENANT_ID?.trim() || 'common',
    }))
  }
  return providers
}
