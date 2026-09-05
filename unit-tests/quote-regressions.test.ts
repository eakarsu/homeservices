import test from 'node:test'
import assert from 'node:assert/strict'
import {validateQuoteDraft} from '../src/lib/operations-governance'
const options=['good','better','best'].map(tier=>({tier,laborCost:19.99,partsCost:0,totalCost:19.99}))
test('valid cents and tiered quotes pass',()=>assert.deepEqual(validateQuoteDraft({options},19.99),[]))
test('missing amounts, repeated tiers, zero baselines and malformed options fail',()=>{for(const rows of [[null,null,null],options.map(x=>({...x,laborCost:null})),options.map(x=>({...x,tier:'good'})),options.map(x=>({...x,totalCost:19.999}))])assert.ok(validateQuoteDraft({options:rows},19.99).length);assert.ok(validateQuoteDraft({options},0).length);assert.ok(validateQuoteDraft({options},NaN).length)})
