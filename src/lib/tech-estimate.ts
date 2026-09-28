export interface TechEstimateLineItemInput {
  pricebookItemId: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  tier: 'GOOD' | 'BETTER' | 'BEST'
}

export interface TechEstimateOptionPayload {
  name: string
  isRecommended: boolean
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    pricebookItemId: string
  }>
}

const TIER_LABELS = { GOOD: 'Good', BETTER: 'Better', BEST: 'Best' } as const
const TIER_ORDER = ['GOOD', 'BETTER', 'BEST'] as const

/**
 * Converts the technician tier builder's line items into the option payload the
 * estimates API accepts (`options[].lineItems`). Empty tiers are omitted and every
 * line keeps its pricebook source so the review workflow can validate the prices.
 */
export function buildTechEstimateOptions(items: TechEstimateLineItemInput[]): TechEstimateOptionPayload[] {
  const groups = TIER_ORDER
    .map(tier => ({ tier, items: items.filter(item => item.tier === tier) }))
    .filter(group => group.items.length > 0)
  const recommendedTier = groups.some(group => group.tier === 'BETTER') ? 'BETTER' : groups[0]?.tier
  return groups.map(group => ({
    name: TIER_LABELS[group.tier],
    isRecommended: group.tier === recommendedTier,
    lineItems: group.items.map(item => ({
      description: item.description?.trim() || item.name.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      pricebookItemId: item.pricebookItemId,
    })),
  }))
}
