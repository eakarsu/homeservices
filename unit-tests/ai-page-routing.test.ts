import test from 'node:test'
import assert from 'node:assert/strict'
import {NextRequest} from 'next/server'
import {middleware} from '../src/middleware'
import {aiWorkflowPages} from '../src/lib/ai-page-fields'
test('repaired AI pages are reachable while old AI endpoints remain disabled',()=>{
  for(const mode of [...aiWorkflowPages,'quote-generator']) {
    const response=middleware(new NextRequest(`http://localhost:30871/dashboard/ai/${mode}`))
    assert.equal(response.status,200,mode)
    assert.equal(response.headers.get('x-middleware-next'),'1',mode)
  }
  for(const path of ['/api/ai/diagnostics','/api/ai/optimize-dispatch','/dashboard/ai/unknown'])assert.equal(middleware(new NextRequest('http://localhost:30871'+path)).status,404,path)
})
