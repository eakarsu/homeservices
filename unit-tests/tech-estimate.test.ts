import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTechEstimateOptions } from '../src/lib/tech-estimate'

test('technician tier items become the option and line-item payload the estimates API accepts', () => {
  const options = buildTechEstimateOptions([
    { pricebookItemId: 'pb-good', name: 'Diagnostic visit', description: '', quantity: 1, unitPrice: 99, tier: 'GOOD' },
    { pricebookItemId: 'pb-better', name: 'Tune-up', description: 'Full seasonal tune-up', quantity: 2, unitPrice: 150, tier: 'BETTER' },
    { pricebookItemId: 'pb-best', name: 'System overhaul', description: 'System overhaul', quantity: 1, unitPrice: 450, tier: 'BEST' },
  ])

  assert.deepEqual(options.map(option => option.name), ['Good', 'Better', 'Best'])
  assert.deepEqual(options.map(option => option.isRecommended), [false, true, false])
  for (const option of options) {
    assert.ok(option.lineItems.length > 0)
    for (const line of option.lineItems) {
      assert.ok(line.description.trim().length > 0)
      assert.ok(line.pricebookItemId.length > 0)
      assert.ok(line.quantity > 0)
      assert.ok(Number.isFinite(line.unitPrice))
    }
  }
  assert.equal(options[1].lineItems[0].quantity, 2)
  assert.equal(options[0].lineItems[0].description, 'Diagnostic visit')
})

test('technician estimate payload omits empty tiers and recommends the only populated tier', () => {
  const options = buildTechEstimateOptions([
    { pricebookItemId: 'pb-capacitor', name: 'Dual-run capacitor', quantity: 1, unitPrice: 25, tier: 'BEST' },
  ])
  assert.equal(options.length, 1)
  assert.equal(options[0].name, 'Best')
  assert.equal(options[0].isRecommended, true)
  assert.deepEqual(options[0].lineItems, [
    { description: 'Dual-run capacitor', quantity: 1, unitPrice: 25, pricebookItemId: 'pb-capacitor' },
  ])
})
