import test from 'node:test'
import assert from 'node:assert/strict'
import {validateQuoteDraft} from '../src/lib/operations-governance'
const options=['good','better','best'].map(tier=>({tier,laborCost:19.99,partsCost:0,totalCost:19.99}))
test('valid cents and tiered quotes pass',()=>assert.deepEqual(validateQuoteDraft({options},19.99),[]))
test('missing amounts, repeated tiers, zero baselines and malformed options fail',()=>{for(const rows of [[null,null,null],options.map(x=>({...x,laborCost:null})),options.map(x=>({...x,tier:'good'})),options.map(x=>({...x,totalCost:19.999}))])assert.ok(validateQuoteDraft({options:rows},19.99).length);assert.ok(validateQuoteDraft({options},0).length);assert.ok(validateQuoteDraft({options},NaN).length)})

import {parseQuoteDraft} from '../src/lib/quote-draft'
const providerQuote={jobDescription:'Service draft',notes:[],options:['Good','BETTER',' best '].map(tier=>({tier,name:'Service',description:'Review scope',laborCost:'19.99',partsCost:0,totalCost:'19.99',warranty:'Not specified',estimatedDuration:'Confirm',features:['Inspection']}))}
test('provider tier casing and numeric strings render without a false 422',()=>{
  const parsed=parseQuoteDraft(providerQuote)
  assert.ok(parsed)
  assert.deepEqual(parsed.options.map(o=>o.tier),['good','better','best'])
  assert.equal(parsed.options[0].totalCost,19.99)
  assert.deepEqual(validateQuoteDraft(parsed,19.99),[])
})
test('normalization still rejects duplicate tiers, invented totals and malformed rendering fields',()=>{
  assert.ok(validateQuoteDraft(parseQuoteDraft({...providerQuote,options:providerQuote.options.map(o=>({...o,tier:'Good'}))}),19.99).length)
  assert.ok(validateQuoteDraft(parseQuoteDraft({...providerQuote,options:providerQuote.options.map(o=>({...o,totalCost:1000}))}),19.99).length)
  assert.equal(parseQuoteDraft({...providerQuote,options:providerQuote.options.map(o=>({...o,features:{unexpected:true}}))}),null)
  assert.equal(parseQuoteDraft({...providerQuote,notes:null}),null)
})
