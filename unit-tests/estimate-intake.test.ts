import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedIntakeSuggestions } from '../src/lib/estimate-intake';

test('AI intake accepts only existing pricebook IDs and exact job evidence references', () => {
  const prices = [{ id: 'pb-1', code: 'HVAC-1', name: 'Diagnostic', description: null, unitPrice: 120, updatedAt: '2026-01-01T00:00:00Z' }];
  const sources = [{ id: 'job-notes', label: 'Saved job notes', kind: 'TEXT' as const }];
  const suggestions = verifiedIntakeSuggestions({ suggestions: [
    { pricebookItemId: 'pb-1', quantity: 1, rationale: 'Check the unit', evidenceIds: ['job-notes'] },
    { pricebookItemId: 'pb-1', quantity: 2, rationale: 'Duplicate', evidenceIds: ['job-notes'] },
    { pricebookItemId: 'pb-2', quantity: 1, rationale: 'Invented', evidenceIds: ['job-notes'] },
    { pricebookItemId: 'pb-1', quantity: 1, rationale: 'Unsupported', evidenceIds: ['invented'] },
  ] }, prices, sources);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].unitPrice, 120);
  assert.deepEqual(suggestions[0].evidenceIds, ['job-notes']);
});
