import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import AIDraftMarkdown from '../src/components/AIDraftMarkdown'
import AIDraftReport from '../src/components/AIDraftReport'

test('draft Markdown renders headings, lists, tables and preserves field line breaks', () => {
  const html=renderToStaticMarkup(React.createElement(AIDraftMarkdown,{text:'# Visit summary\n\n**Customer:** Sample\n**Status:** Pending\n\n- Inspect filter\n- Confirm access\n\n| Item | Status |\n| --- | --- |\n| Filter | Pending |'}))
  assert.match(html,/<h3[^>]*>Visit summary<\/h3>/)
  assert.match(html,/<strong[^>]*>Customer:<\/strong>/)
  assert.match(html,/whitespace-pre-line/)
  assert.match(html,/<ul[^>]*>/)
  assert.match(html,/<table[^>]*>/)
  assert.match(html,/<td[^>]*>Pending<\/td>/)
})

test('AI Markdown cannot render executable HTML, unsafe links or remote images', () => {
  const html=renderToStaticMarkup(React.createElement(AIDraftMarkdown,{text:'<script>alert(1)</script>\n\n[Unsafe](javascript:alert%281%29)\n\n![tracking](https://example.com/pixel.png)\n\n[Reference](https://example.com/reference)'}))
  assert.doesNotMatch(html,/<script|javascript:|<img|pixel\.png/)
  assert.match(html,/href="https:\/\/example.com\/reference"/)
  assert.match(html,/rel="noopener noreferrer"/)
})

const draft={id:'example',success:true,expectedHash:'verified',output:{summary:'Overview text',draft:'Original draft',recommendations:[{text:'Confirm access',sourceIds:['internal-source-id']}],uncertainties:['Arrival time']},input:{evidence:[{id:'internal-source-id',label:'Service visit',type:'job',facts:{serviceType:'Maintenance'}}]}}
const props={draft,title:'Job summary',review:'Edited draft',busy:false,onReviewChange:()=>{},onRecordReview:()=>{},onClose:()=>{}}
test('report previews current edits with readable source labels and review sections', () => {
  const html=renderToStaticMarkup(React.createElement(AIDraftReport,props))
  for(const content of ['Job summary','Edited draft','Recommended next steps','Details to confirm','Service visit','Record review']) assert.ok(html.includes(content))
  assert.doesNotMatch(html,/internal-source-id|Original draft|disabled=""/)
})

test('reviewed reports show recorded text and cannot be reviewed again', () => {
  const html=renderToStaticMarkup(React.createElement(AIDraftReport,{...props,draft:{...draft,reviewedAt:'2026-09-17T12:00:00Z',reviewedText:'Approved wording'}}))
  assert.match(html,/Approved wording/)
  assert.match(html,/Review recorded/)
  assert.doesNotMatch(html,/Edit draft|Record review|Edited draft/)
})

test('older saved customer sources display a name instead of an internal identifier', () => {
  const html=renderToStaticMarkup(React.createElement(AIDraftReport,{...props,draft:{...draft,input:{evidence:[{id:'internal-source-id',label:'internal-source-id',type:'customer',facts:{firstName:'Sample',lastName:'Customer'}}]}}}))
  assert.match(html,/Sample Customer/)
  assert.doesNotMatch(html,/internal-source-id/)
})

test('empty edits stay empty and review requires text plus a verified record', () => {
  const empty=renderToStaticMarkup(React.createElement(AIDraftReport,{...props,review:''}))
  assert.doesNotMatch(empty,/Original draft/)
  assert.match(empty,/disabled=""/)
  const unverified=renderToStaticMarkup(React.createElement(AIDraftReport,{...props,draft:{...draft,expectedHash:undefined}}))
  assert.match(unverified,/disabled=""/)
})
