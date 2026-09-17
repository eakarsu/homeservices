import test from 'node:test'
import assert from 'node:assert/strict'
import { formAIActions, getFormFields, selectedAIFields, pickFormValues, validateAIFields, unchangedPatch, completeDraftFields, missingFormFields, combineDraftInstructions } from '../src/lib/form-ai'
import { recordModules } from '../src/lib/workflows/definitions'

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
  assert.deepEqual(validateAIFields({...response,title:'',description:'  '},fields),{})
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


test('all five drafting actions cover required and optional fields', () => {
  assert.equal(formAIActions.length, 5)
  for (const form of ['customers', 'jobs', 'estimates', 'workspace']) {
    for (const action of formAIActions) {
      const fields = selectedAIFields(form, action.key)
      assert.deepEqual(fields, getFormFields(form))
      assert.ok(fields.some(f => f.optional))
    }
  }
})

test('other forms expose record selectors, optional instructions and validated dates/trades', () => {
  for (const [form, keys] of Object.entries({jobs:['customerId','propertyId','serviceTypeId'],estimates:['customerId','jobId','title'],agreements:['customerId','planId','startDate','billingFrequency'],technicians:['truckId','tradeTypes'],customers:['preferredContact'],parts:['category']})) {
    for (const key of [...keys,'extraInstructions']) assert.ok(getFormFields(form).some(f=>f.key===key),`${form}: ${key}`)
  }
  assert.deepEqual(validateAIFields({tradeTypes:'HVAC, PLUMBING'},selectedAIFields('technicians','tradeTypes')),{tradeTypes:'HVAC,PLUMBING'})
  assert.throws(()=>validateAIFields({tradeTypes:'ADMIN'},selectedAIFields('technicians','tradeTypes')))
  assert.throws(()=>validateAIFields({startDate:'2026-02-30'},selectedAIFields('agreements','startDate')))
  assert.deepEqual(validateAIFields({startDate:'2026-09-21'},selectedAIFields('agreements','startDate')),{startDate:'2026-09-21'})
})

test('every AI button supplies editable text when the model returns null across supported pages', () => {
  const forms = ['workspace','jobs','customers','parts','technicians','agreements','estimates','invoices','operations:bookings','operations:communications',...Object.keys(recordModules).map(key => `operations:${key}`)]
  for (const form of forms) for (const action of formAIActions) {
    const fields = selectedAIFields(form,action.key)
    const nulls = Object.fromEntries(fields.map(f => [f.key,null]))
    const result = completeDraftFields(form,fields,{},validateAIFields(nulls,fields))
    for (const f of fields.filter(f => f.prose)) assert.ok(String(result[f.key]).trim(),`${form}/${action.key}/${f.key}`)
    assert.deepEqual(validateAIFields({...nulls,...result},fields),result)
    for (const key of ['customerId','jobId','email','phone','cost','price','startDate','equipmentId','vendorId']) {
      assert.equal(result[key],undefined,`${form}/${action.key} must not invent ${key}`)
    }
  }
})

test('fallback keeps existing text and valid workflow, and accepts real generated improvements', () => {
  const fields = getFormFields('workspace')
  const original = {mode:'job-summary',extraInstructions:'Use metric units',notes:'Customer asks for a morning visit'}
  assert.deepEqual(completeDraftFields('workspace',fields,original,{}),{mode:'job-summary'})
  const proposed = {notes:'Customer requests a morning appointment.'}
  assert.deepEqual(completeDraftFields('workspace',fields,original,proposed),{...proposed,mode:'job-summary'})
  const restricted = fields.map(f=>f.key==='mode'?{...f,options:['intake']}:f)
  assert.equal(completeDraftFields('workspace',restricted,original,{}).mode,'intake')
})

test('missing fields are explicit and additional instructions are included without truncation', () => {
  assert.deepEqual(missingFormFields(getFormFields('workspace'),{mode:'intake',notes:'Draft',extraInstructions:'Review'}),['Authorized job','Customer'])
  assert.equal(combineDraftInstructions('Summarize the job','Use bullet points'),'Summarize the job\n\nExtra instructions:\nUse bullet points')
  assert.equal(combineDraftInstructions('Same','Same'),'Same')
  assert.ok(combineDraftInstructions('a'.repeat(12000),'b'.repeat(12000)).endsWith('b'.repeat(12000)))
})

test('operations AI buttons include the property, equipment, vendor and service dropdowns', () => {
  for (const [module,definition] of Object.entries(recordModules)) {
    for (const f of definition.fields.filter(f=>['properties','equipment','serviceTypes','vendors'].includes(f.type))) {
      assert.ok(getFormFields(`operations:${module}`).some(field=>field.key===f.key),`${module}/${f.key}`)
    }
  }
})


test('quote service IDs normalize whitespace so every selected service contributes to pricing', () => {
  const fields = getFormFields('ai:quote-generator').map(field => field.key === 'pricebookItemIds' ? {...field, options:['service1','service2']} : field)
  const response = Object.fromEntries(fields.map(field => [field.key, null]))
  const applied = validateAIFields({...response, pricebookItemIds:' service1, service2 '}, fields)
  assert.equal(applied.pricebookItemIds, 'service1,service2')
  const selected = String(applied.pricebookItemIds).split(',')
  const prices = [{id:'service1', price:125}, {id:'service2', price:75}]
  assert.equal(prices.filter(item => selected.includes(item.id)).reduce((sum,item) => sum + item.price, 0), 200)
  assert.throws(() => validateAIFields({...response, pricebookItemIds:'service1, service1'}, fields))
  assert.throws(() => validateAIFields({...response, pricebookItemIds:'service1, unknown'}, fields))
})

test('every quote drafting action evaluates all editable AI-supported quote fields', () => {
  const expected = ['jobId','customerId','pricebookItemIds','additionalNotes','extraInstructions']
  for (const action of formAIActions) {
    assert.deepEqual(selectedAIFields('ai:quote-generator', action.key).map(field => field.key), expected)
  }
})
