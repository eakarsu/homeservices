import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validFollowUpOrigin, canManageFollowUps, validateFollowUp, validateFollowUpDraft } from '../src/lib/follow-ups'
const task = { title: 'Review job', customerId: 'customer', dueAt: '2026-09-08T12:00:00Z', status: 'OPEN', checklist: [{ text: 'Confirm facts', done: false }] }
test('follow-up completion requires checked items and validated dates and fields', () => {
  assert.equal(validateFollowUp(task).status, 'OPEN')
  assert.throws(() => validateFollowUp({ ...task, status: 'COMPLETED' }), /Complete every/)
  assert.equal(validateFollowUp({ ...task, status: 'COMPLETED', checklist: [{ text: 'Confirm facts', done: true }] }).status, 'COMPLETED')
  assert.throws(() => validateFollowUp({ ...task, dueAt: 'bad' }), /Invalid due/)
  assert.throws(() => validateFollowUp({ ...task, title: 'x'.repeat(201) }), /too long/)
  assert.throws(() => validateFollowUp({ ...task, checklist: [{ text: 'Fact', done: 'true' }] }), /Invalid checklist/)
  assert.throws(() => validateFollowUp({ ...task, status: 'SENT' }), /Invalid status/)
})
test('AI drafts cannot mark work complete, inject extra fields, or return malformed content', () => {
  const result = validateFollowUpDraft({ title: 'Review', notes: 'Verify job', messageDraft: 'Hello', checklist: ['Verify findings'], status: 'COMPLETED', assigneeId: 'attacker' }, 'all')
  assert.deepEqual(result.checklist, [{ text: 'Verify findings', done: false }])
  assert.ok(!('status' in result)); assert.ok(!('assigneeId' in result))
  assert.throws(() => validateFollowUpDraft({ checklist: [{ text: 'Done', done: true }] }, 'checklist'))
  assert.throws(() => validateFollowUpDraft({ messageDraft: '' }, 'message'))
  assert.throws(() => validateFollowUpDraft({ checklist: [] }, 'checklist'))
  assert.deepEqual(validateFollowUpDraft({ messageDraft: 'Hello', title: 'Ignored' }, 'message'), { messageDraft: 'Hello' })
})
test('follow-up management is limited to office roles', () => {
  for (const role of ['ADMIN', 'MANAGER', 'DISPATCHER', 'OFFICE']) assert.ok(canManageFollowUps(role))
  for (const role of ['TECHNICIAN', 'CUSTOMER', '']) assert.equal(canManageFollowUps(role), false)
})

test('origin validation accepts development aliases but rejects foreign and production aliases', () => {
  const url = 'http://127.0.0.1:30871'
  assert.ok(validFollowUpOrigin('http://localhost:30871', url, true))
  assert.equal(validFollowUpOrigin('http://localhost:30871', url, false), false)
  assert.equal(validFollowUpOrigin('http://localhost:3000', url, true), false)
  assert.equal(validFollowUpOrigin('https://external.invalid', url, true), false)
  assert.ok(validFollowUpOrigin(url, url, false))
})
