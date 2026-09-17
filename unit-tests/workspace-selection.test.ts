import test from 'node:test'
import assert from 'node:assert/strict'
import { matchWorkspaceRecords } from '../src/lib/workspace-selection'
const customers = [{id:'c1',firstName:'Avery',lastName:'Morgan'}, {id:'c2',firstName:'Jordan',lastName:'Bennett'}]
const jobs = [{id:'j1',jobNumber:'JOB-1',title:'Faucet repair',customerId:'c1'}, {id:'j10',jobNumber:'JOB-10',title:'Faucet repair',customerId:'c2'}]
const empty = {jobId:'',customerId:''}
test('exact job references fill the linked customer without matching number prefixes', () => {
  assert.deepEqual(matchWorkspaceRecords('Summarize JOB-10.',jobs,customers,empty),{jobId:'j10',customerId:'c2'})
})
test('ambiguous titles and blank context leave record selections empty', () => {
  assert.deepEqual(matchWorkspaceRecords('Faucet repair',jobs,customers,empty),empty)
  assert.deepEqual(matchWorkspaceRecords('',jobs,customers,empty),empty)
  assert.deepEqual(matchWorkspaceRecords('JOB-1 and JOB-10',jobs,customers,empty),empty)
})
test('customer context disambiguates a title and manual selection is preserved', () => {
  assert.deepEqual(matchWorkspaceRecords('Faucet repair for Avery Morgan',jobs,customers,empty),{jobId:'j1',customerId:'c1'})
  assert.deepEqual(matchWorkspaceRecords('JOB-10',jobs,customers,{jobId:'j1',customerId:'c1'}),{jobId:'j1',customerId:'c1'})
})
