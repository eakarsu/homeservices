import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchCollection } from '../src/lib/fetchCollection'

test('collection reader unwraps all pages and preserves search filters', async () => {
  const calls: string[] = []
  const fetcher = (async (path: string | URL | Request) => {
    calls.push(String(path))
    const page = Number(new URL(String(path), 'https://test.invalid').searchParams.get('page'))
    return Response.json({ data: [{ id: page }], pagination: { page, hasNext: page < 3 } })
  }) as typeof fetch
  assert.deepEqual(await fetchCollection('/api/parts?search=air&category=HVAC', fetcher), [{ id: 1 }, { id: 2 }, { id: 3 }])
  assert.equal(calls.length, 3)
  assert.ok(calls.every(path => path.includes('search=air') && path.includes('category=HVAC')))
})

test('collection reader supports legacy arrays and rejects failures instead of returning empty data', async () => {
  assert.deepEqual(await fetchCollection('/api/items', (async () => Response.json([{ id: 'one' }])) as typeof fetch), [{ id: 'one' }])
  await assert.rejects(fetchCollection('/api/items', (async () => Response.json({ error: 'Unauthorized' }, { status: 401 })) as typeof fetch), /401/)
  await assert.rejects(fetchCollection('/api/items', (async () => Response.json({ unexpected: true })) as typeof fetch), /invalid list/)
  await assert.rejects(fetchCollection('/api/items', (async () => Response.json({ data: [], pagination: { page: 1, hasNext: true } })) as typeof fetch), /inconsistent pagination/)
})
