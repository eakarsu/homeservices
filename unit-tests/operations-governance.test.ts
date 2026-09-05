import test from 'node:test'
import assert from 'node:assert/strict'
import {
  approvalTokenHash, calculateAuditHash, canDeleteJob, canReadJob, isValidJobTransition,
  retentionDate, validateAuditChain, validateEstimateReview, validateQuoteDraft,
} from '../src/lib/operations-governance'

test('job access is company scoped and technicians require an assignment', () => {
  const job = { companyId: 'company-a', assignments: [{ technicianId: 'tech-a' }] }
  assert.equal(canReadJob({ id: 'u1', role: 'MANAGER', companyId: 'company-a' }, job), true)
  assert.equal(canReadJob({ id: 'u2', role: 'MANAGER', companyId: 'company-b' }, job), false)
  assert.equal(canReadJob({ id: 'u3', role: 'TECHNICIAN', companyId: 'company-a', technicianId: 'tech-a' }, job), true)
  assert.equal(canReadJob({ id: 'u4', role: 'TECHNICIAN', companyId: 'company-a', technicianId: 'tech-b' }, job), false)
  assert.equal(canDeleteJob({ id: 'u5', role: 'DISPATCHER', companyId: 'company-a' }, job), false)
})

test('job state machine rejects unsafe skips and terminal-state edits', () => {
  assert.equal(isValidJobTransition('PENDING', 'SCHEDULED'), true)
  assert.equal(isValidJobTransition('PENDING', 'COMPLETED'), false)
  assert.equal(isValidJobTransition('COMPLETED', 'INVOICED'), true)
  assert.equal(isValidJobTransition('INVOICED', 'IN_PROGRESS'), false)
})

test('estimate review enforces property jurisdiction and authoritative template source', () => {
  const valid = validateEstimateReview({
    jurisdiction: 'NY', propertyState: 'NY', templateSource: 'https://templates.example.test/estimate-v2',
    templateEffectiveDate: '2026-01-01', hasUnlinkedPrices: false,
    allowedTemplateHosts: ['templates.example.test'], now: new Date('2026-07-20T00:00:00Z'),
  })
  assert.deepEqual(valid, [])
  const blocked = validateEstimateReview({
    jurisdiction: 'NJ', propertyState: 'NY', templateSource: 'http://attacker.test/form',
    templateEffectiveDate: '2027-01-01', hasUnlinkedPrices: true, manualPriceReason: 'short',
    allowedTemplateHosts: ['templates.example.test'], now: new Date('2026-07-20T00:00:00Z'),
  })
  assert.ok(blocked.length >= 4)
})

test('AI quote validation blocks arithmetic errors and pricebook outliers', () => {
  const option = { laborCost: 40, partsCost: 60, totalCost: 100 }
  assert.deepEqual(validateQuoteDraft({ options: ['good','better','best'].map(tier => ({...option,tier})) }, 100), [])
  const blockers = validateQuoteDraft({ options: [option, option, { laborCost: 1, partsCost: 1, totalCost: 500 }] }, 100)
  assert.ok(blockers.some(value => value.includes('does not equal')))
  assert.ok(blockers.some(value => value.includes('variance')))
})

test('tamper-evident audit chain detects payload and linkage changes', () => {
  const firstBase = { companyId: 'c1', actorId: 'u1', action: 'CREATED', entityType: 'Estimate', entityId: 'e1', payload: { version: 1 }, previousHash: null, createdAt: new Date('2026-07-20T01:00:00Z') }
  const first = { ...firstBase, eventHash: calculateAuditHash(firstBase) }
  const secondBase = { ...firstBase, action: 'REVIEWED', payload: { version: 2 }, previousHash: first.eventHash, createdAt: new Date('2026-07-20T02:00:00Z') }
  const second = { ...secondBase, eventHash: calculateAuditHash(secondBase) }
  assert.equal(validateAuditChain([first, second]), true)
  assert.equal(validateAuditChain([first, { ...second, payload: { version: 3 } }]), false)
})

test('approval tokens are hashed and retention is deterministic', () => {
  assert.notEqual(approvalTokenHash('token-a'), 'token-a')
  assert.notEqual(approvalTokenHash('token-a'), approvalTokenHash('token-b'))
  assert.equal(retentionDate(new Date('2026-07-20T00:00:00Z')).toISOString(), '2033-07-20T00:00:00.000Z')
})
