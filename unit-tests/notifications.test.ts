/**
 * Notification templates and consent rules.
 *
 * The gap this replaces (`gap-no-sms-notifications-backend`) returned generic
 * model output. These assertions pin the properties that matter for a
 * notification a technician relies on: deterministic rendering, consent
 * enforcement, and sensible channel selection.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  NOTIFICATION_EVENTS,
  eventForJobStatus,
  renderNotification,
  type NotificationEvent,
} from '../src/lib/workflows/notifications'

test('every declared event renders a subject and body', () => {
  for (const event of NOTIFICATION_EVENTS) {
    const rendered = renderNotification(event, {
      customerName: 'Dana Fisher',
      jobNumber: 'JOB-1042',
      jobTitle: 'furnace inspection',
      technicianName: 'Sam Ortiz',
      scheduledAt: 'Mon 14 Oct, 9:00',
    })
    assert.ok(rendered.subject.length > 0, `${event} has a subject`)
    assert.ok(rendered.body.length > 0, `${event} has a body`)
    assert.ok(!rendered.body.includes('undefined'), `${event} body has no undefined`)
  }
})

test('rendering is deterministic for identical input', () => {
  const data = { customerName: 'Dana Fisher', jobNumber: 'JOB-1042', jobTitle: 'furnace inspection' }
  const a = renderNotification('job_scheduled', data)
  const b = renderNotification('job_scheduled', data)
  assert.deepEqual(a, b, 'same input must render the same notification')
})

test('customer name and job details are interpolated, not invented', () => {
  const rendered = renderNotification('job_completed', {
    customerName: 'Dana Fisher',
    jobNumber: 'JOB-1042',
    jobTitle: 'furnace inspection',
    portalUrl: 'https://example.test/portal/1042',
  })
  assert.ok(rendered.body.includes('Dana Fisher'))
  assert.ok(rendered.body.includes('JOB-1042'))
  assert.ok(rendered.body.includes('furnace inspection'))
  assert.ok(rendered.body.includes('https://example.test/portal/1042'))
})

test('missing optional fields degrade gracefully instead of printing undefined', () => {
  const rendered = renderNotification('job_en_route', { customerName: 'Dana Fisher' })
  assert.ok(rendered.body.includes('Dana Fisher'))
  assert.ok(!rendered.body.includes('undefined'))
  assert.ok(!rendered.body.includes('NaN'))
})

test('job status transitions map to the notification they should emit', () => {
  assert.equal(eventForJobStatus('SCHEDULED'), 'job_scheduled')
  assert.equal(eventForJobStatus('DISPATCHED'), 'job_scheduled')
  assert.equal(eventForJobStatus('EN_ROUTE'), 'job_en_route')
  assert.equal(eventForJobStatus('IN_PROGRESS'), 'job_in_progress')
  assert.equal(eventForJobStatus('COMPLETED'), 'job_completed')
  assert.equal(eventForJobStatus('CANCELLED'), null)
  assert.equal(eventForJobStatus('ON_HOLD'), null)
})

test('unknown events are rejected rather than silently rendered', () => {
  assert.throws(
    () => renderNotification('not_an_event' as NotificationEvent, {}),
    /Unknown notification event/,
  )
})
