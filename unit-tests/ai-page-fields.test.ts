import test from 'node:test'
import assert from 'node:assert/strict'
import {aiPageFields,workflowDetailsText} from '../src/lib/ai-page-fields'
import {getFormFields,selectedAIFields,formAIActions,validateAIFields,completeDraftFields} from '../src/lib/form-ai'

test('all AI page fields participate in every action and retain their workflow',()=>{
  for(const [mode,details] of Object.entries(aiPageFields))for(const action of formAIActions){
    const form=`workspace:${mode}`,fields=selectedAIFields(form,action.key)
    for(const detail of details)assert.ok(fields.some(f=>f.key===detail.key))
    assert.equal(new Set(fields.map(f=>f.key)).size,fields.length)
    const completed=completeDraftFields(form,fields,{mode},validateAIFields(Object.fromEntries(fields.map(f=>[f.key,null])),fields))
    assert.equal(completed.mode,mode)
    for(const field of fields.filter(f=>f.prose))assert.ok(completed[field.key])
  }
})
test('final drafts include page-specific details and exclude unrelated inputs',()=>{
  const text=workflowDetailsText('diagnostics',{symptoms:'Weak airflow',equipmentAge:'12',additionalInfo:'Filter replaced',password:'secret'})
  assert.match(text,/Symptoms: Weak airflow/);assert.match(text,/Equipment age \(years\): 12/);assert.doesNotMatch(text,/secret|password/)
  assert.deepEqual(getFormFields('workspace:unknown'),[])
})
