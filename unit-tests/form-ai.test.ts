import test from 'node:test'
import assert from 'node:assert/strict'
import { getFormFields, selectedAIFields, pickFormValues, validateAIFields, unchangedPatch } from '../src/lib/form-ai'

test('only supported fields are sent; credentials and authority fields are excluded', () => {
  assert.deepEqual(pickFormValues('technicians', {firstName:'Erol', password:'secret', role:'ADMIN', companyId:'other', hourlyRate:'200'}), {firstName:'Erol'})
  assert.deepEqual(getFormFields('__proto__'), [])
  assert.deepEqual(getFormFields('operations:constructor'), [])
})
test('optional and individual actions include optional fields and limit their scope', () => {
  const fields = getFormFields('customers')
  assert.equal(selectedAIFields('customers','all').length, fields.length)
  assert.deepEqual(selectedAIFields('customers','optional'), fields.filter(f => f.optional))
  assert.deepEqual(selectedAIFields('customers','notes').map(f=>f.key), ['notes'])
  assert.ok(selectedAIFields('jobs','polish').every(f=>f.prose))
  assert.throws(()=>selectedAIFields('jobs','password'))
})
test('model must evaluate all requested fields; null leaves missing facts unchanged', () => {
  const fields = selectedAIFields('jobs','all')
  const response = Object.fromEntries(fields.map(f=>[f.key,null]))
  assert.deepEqual(validateAIFields({...response,title:'Repair leaking faucet'}, fields), {title:'Repair leaking faucet'})
  assert.throws(()=>validateAIFields({title:'Incomplete'},fields))
  assert.throws(()=>validateAIFields({...response,companyId:'other'},fields))
  assert.throws(()=>validateAIFields({...response,priority:'CRITICAL'},fields))
  assert.throws(()=>validateAIFields({...response,estimatedDuration:-1},fields))
  assert.throws(()=>validateAIFields({...response,timeWindowStart:'25:00'},fields))
  assert.throws(()=>validateAIFields({...response,scheduledStart:'tomorrow'},fields))
})
test('inventory counts cannot be silently truncated and prices cannot be negative', () => {
  assert.throws(()=>validateAIFields({quantity:'2.5'},selectedAIFields('parts','quantity')))
  assert.throws(()=>validateAIFields({price:'-10'},selectedAIFields('parts','price')))
  assert.deepEqual(validateAIFields({quantity:'2'},selectedAIFields('parts','quantity')),{quantity:'2'})
})
test('late responses and undo preserve concurrent user changes', () => {
  const original = {title:'Old',description:''}, ai = {title:'AI title',description:'AI description'}
  assert.deepEqual(unchangedPatch({...original,title:'User title'},original,ai), {description:'AI description'})
  assert.deepEqual(unchangedPatch({...ai,description:'User description'},ai,original), {title:'Old'})
})
