export type IntakeSource = { id: string; label: string; kind: 'TEXT' | 'PHOTO'; photoId?: string };
export type IntakePrice = { id: string; code: string; name: string; description: string | null; unitPrice: number; updatedAt: string };
export type IntakeSuggestion = IntakePrice & { quantity: number; rationale: string; evidenceIds: string[] };

/** Reject model output that cannot be traced to current company prices and job evidence. */
export function verifiedIntakeSuggestions(raw: unknown, prices: IntakePrice[], sources: IntakeSource[]): IntakeSuggestion[] {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { suggestions?: unknown }).suggestions)) return [];
  const priceById = new Map(prices.map((price) => [price.id, price]));
  const sourceIds = new Set(sources.map((source) => source.id));
  const seen = new Set<string>();
  const result: IntakeSuggestion[] = [];
  for (const item of (raw as { suggestions: unknown[] }).suggestions.slice(0, 20)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const price = typeof row.pricebookItemId === 'string' ? priceById.get(row.pricebookItemId) : undefined;
    if (!price || seen.has(price.id) || !Number.isInteger(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 20 ||
      typeof row.rationale !== 'string' || !row.rationale.trim() || !Array.isArray(row.evidenceIds) ||
      !row.evidenceIds.length || row.evidenceIds.some((id) => typeof id !== 'string' || !sourceIds.has(id))) continue;
    seen.add(price.id);
    result.push({ ...price, quantity: Number(row.quantity), rationale: row.rationale.trim().slice(0, 1000), evidenceIds: [...new Set(row.evidenceIds as string[])] });
  }
  return result;
}
