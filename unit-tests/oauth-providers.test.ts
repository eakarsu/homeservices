import test from 'node:test'
import assert from 'node:assert/strict'
import { getOAuthProviders } from '../src/lib/oauth-providers'

test('missing, blank and partial credentials never register an OAuth provider', () => {
  for (const prefix of ['GOOGLE', 'AZURE_AD']) {
    for (const [id, secret] of [[undefined, undefined], ['', 'secret'], ['client', ''], ['  ', 'secret'], ['client', ' \n ']]) {
      assert.deepEqual(getOAuthProviders({ [`${prefix}_CLIENT_ID`]: id, [`${prefix}_CLIENT_SECRET`]: secret }), [])
    }
  }
})

test('complete providers are registered independently and preserve configuration', () => {
  const google = { GOOGLE_CLIENT_ID: ' google-client ', GOOGLE_CLIENT_SECRET: ' google-secret ' }
  assert.deepEqual(getOAuthProviders(google).map(p => p.id), ['google'])
  const providers = getOAuthProviders({ ...google, AZURE_AD_CLIENT_ID: 'azure-client', AZURE_AD_CLIENT_SECRET: 'azure-secret', AZURE_AD_TENANT_ID: 'tenant' })
  assert.deepEqual(providers.map(p => p.id), ['google', 'azure-ad'])
  assert.equal((providers[0].options as { clientId: string }).clientId, 'google-client')
  assert.equal((providers[1].options as { tenantId: string }).tenantId, 'tenant')
  assert.deepEqual(getOAuthProviders({ AZURE_AD_CLIENT_ID: 'id', AZURE_AD_CLIENT_SECRET: 'secret' }).map(p => p.id), ['azure-ad'])
})
