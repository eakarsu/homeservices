import test from 'node:test'
import assert from 'node:assert/strict'
import { localAuthRedirect } from '../src/lib/local-auth-origin'

test('local alias switches to the registered OAuth hostname and preserves path/query', () => {
  assert.equal(localAuthRedirect('http://127.0.0.1:30871/login?next=%2Fdashboard', 'http://localhost:30871', 'development'), 'http://localhost:30871/login?next=%2Fdashboard')
  assert.equal(localAuthRedirect('http://localhost:30871/login', 'http://localhost:30871', 'development'), null)
})
test('local canonical redirect never redirects production, remote hosts or unrelated ports', () => {
  for (const [url, canonical, mode] of [
    ['http://127.0.0.1:30871/login', 'http://localhost:30871', 'production'],
    ['https://servicecrewai.com/login', 'http://localhost:30871', 'development'],
    ['http://127.0.0.1:30871/login', 'https://example.com', 'development'],
    ['http://127.0.0.1:3000/login', 'http://localhost:30871', 'development'],
    ['invalid', 'http://localhost:30871', 'development'],
  ]) assert.equal(localAuthRedirect(url, canonical, mode), null)
  assert.equal(localAuthRedirect('http://127.0.0.1:30871//example.com/path', 'http://localhost:30871', 'development'), 'http://localhost:30871//example.com/path')
})
