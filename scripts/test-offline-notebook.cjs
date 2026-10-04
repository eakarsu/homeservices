const http = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')

async function main() {
  const field = path.join(__dirname, '..', 'public', 'field')
  const server = http.createServer(async (request, response) => {
    const files = {
      '/field/offline.html': ['offline.html', 'text/html'],
      '/field/offline.js': ['offline.js', 'text/javascript'],
      '/field/sw.js': ['sw.js', 'text/javascript'],
    }
    const target = files[request.url]
    if (!target) { response.writeHead(404); response.end(); return }
    response.writeHead(200, { 'Content-Type': target[1], 'Cache-Control': 'no-store' })
    response.end(await fs.readFile(path.join(field, target[0])))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ serviceWorkers: 'allow' })
  const page = await context.newPage()
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    await page.goto(`${base}/field/offline.html`)
    await page.evaluate(async () => {
      localStorage.setItem('homeservices-field-owner', 'company-a:tech-a')
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('homeservices-field-v1', 1)
        request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' })
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite')
        tx.objectStore('drafts').put({
          id: 'company-a:tech-a:job-a', ownerId: 'tech-a', companyId: 'company-a', technicianId: 'technician-a',
          jobId: 'job-a', title: 'Fixture job', createdAt: new Date().toISOString(), requestKey: 'stable-key-1234', state: 'pending',
          essentials: { jobNumber: 'JOB-1', title: 'Fixture job', tradeType: 'HVAC', status: 'SCHEDULED', scheduledStart: '2026-10-08T17:00:00Z', address: '1 Test Lane', scope: 'Inspect equipment' },
          payload: { ownerId: 'tech-a', companyId: 'company-a', technicianId: 'technician-a', updatedAt: '2026-10-01T00:00:00.000Z', workPerformed: 'Queued field note', items: [{ id: 'scope', label: 'Inspect equipment', checked: true, notes: 'Observed' }], checklistVersion: 1, photos: [], photoConsent: false, reviewed: false },
        })
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
      db.close()
      const registration = await navigator.serviceWorker.register('/field/sw.js', { scope: '/field/' })
      await new Promise((resolve, reject) => {
        if (registration.active?.state === 'activated') return resolve()
        const worker = registration.installing || registration.waiting
        if (!worker) return reject(Error('Service worker not installing'))
        worker.addEventListener('statechange', () => { if (worker.state === 'activated') resolve() })
      })
    })
    await context.setOffline(true)
    await page.reload()
    await page.getByText('JOB-1 · Fixture job').waitFor()
    assert.match(await page.locator('#summary').textContent(), /1 pending/)
    assert.match(await page.locator('article').textContent(), /1 Test Lane/)
    await context.setOffline(false)

    const requests = []
    await page.route('**/api/auth/session', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'tech-a', companyId: 'company-a', role: 'TECHNICIAN' } }) }))
    await page.route('**/api/jobs/job-a/offline-sync', route => {
      requests.push({ key: route.request().headers()['idempotency-key'], body: route.request().postDataJSON() })
      if (requests.length === 1) return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'Response uncertain' }) })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ synced: true }) })
    })
    await page.getByRole('button', { name: 'Review complete — sync draft' }).click()
    await page.getByText('Sync result unknown — retry this exact request').waitFor()
    await page.getByRole('button', { name: 'Retry exact sync request' }).click()
    await page.getByText('No local drafts for this account').waitFor()
    assert.equal(requests.length, 2)
    assert.equal(requests[0].key, requests[1].key)
    assert.deepEqual(requests[0].body, requests[1].body)

    await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('homeservices-field-v1', 1)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite')
        tx.objectStore('drafts').put({
          id: 'company-a:tech-a:job-b', ownerId: 'tech-a', companyId: 'company-a', technicianId: 'technician-a',
          jobId: 'job-b', title: 'Changed job', createdAt: new Date().toISOString(), requestKey: 'conflict-key-1234', state: 'pending',
          essentials: { jobNumber: 'JOB-2', title: 'Changed job', tradeType: 'HVAC', status: 'SCHEDULED', scheduledStart: null, address: '2 Test Lane', scope: 'Inspect second unit' },
          payload: { ownerId: 'tech-a', companyId: 'company-a', technicianId: 'technician-a', updatedAt: '2026-10-01T00:00:00.000Z', workPerformed: 'Queued second note', items: [{ id: 'scope', label: 'Inspect equipment', checked: true, notes: 'Observed' }], checklistVersion: 1, photos: [], photoConsent: false, reviewed: false },
        })
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    })
    await page.reload()
    const conflicts = []
    await page.route('**/api/jobs/job-b/offline-sync', route => {
      conflicts.push({ key: route.request().headers()['idempotency-key'], body: route.request().postDataJSON() })
      if (conflicts.length === 1) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'The job changed while offline' }) })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ synced: true }) })
    })
    await page.route('**/api/jobs/job-b', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'job-b', status: 'SCHEDULED', updatedAt: '2026-10-03T00:00:00.000Z', workPerformed: 'Current server note' }) }))
    await page.route('**/api/jobs/job-b/execution', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ checklist: { version: 2, items: [{ id: 'scope', label: 'Inspect equipment', checked: false, notes: 'Server observation' }] } }) }))
    await page.getByRole('button', { name: 'Review complete — sync draft' }).click()
    await page.getByText('Conflict — compare this draft with the current job').waitFor()
    await page.getByRole('button', { name: 'Compare with current job' }).click()
    await page.getByText(/Server work notes: Current server note/).waitFor()
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'I compared both records — use current version' }).click()
    await page.getByText('Pending on this device — not sent').waitFor()
    await page.getByRole('button', { name: 'Review complete — sync draft' }).click()
    await page.getByText('No local drafts for this account').waitFor()
    assert.equal(conflicts.length, 2)
    assert.notEqual(conflicts[0].key, conflicts[1].key)
    assert.equal(conflicts[1].body.updatedAt, '2026-10-03T00:00:00.000Z')
  } finally {
    await context.close()
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
  process.stdout.write('Offline shell, exact retry, conflict comparison and rebase passed.\n')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
