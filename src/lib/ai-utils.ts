/**
 * Shared AI utilities for the home services platform.
 *
 * - Standard model: anthropic/claude-3-5-sonnet-20241022
 * - aiRateLimiter: 20/hr per user
 * - parseAIJson: 3-strategy parser
 * - logAIResult: persists every AI call to AIResult JSONB log
 */
import { prisma } from './prisma'

export const AI_MODEL =
  process.env.AI_MODEL ||
  process.env.OPENROUTER_MODEL ||
  'anthropic/claude-3-5-sonnet-20241022'

const _store = new Map<string, { count: number; resetAt: number }>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    _store.forEach((v, k) => {
      if (v.resetAt < now) _store.delete(k)
    })
  }, 5 * 60 * 1000)
}

export function aiRateLimiter(userId: string): {
  allowed: boolean
  remaining: number
  resetIn: number
} {
  const max = 20
  const window = 60 * 60 * 1000
  const now = Date.now()
  const key = `ai:${userId}`
  const e = _store.get(key)
  if (!e || e.resetAt < now) {
    _store.set(key, { count: 1, resetAt: now + window })
    return { allowed: true, remaining: max - 1, resetIn: window }
  }
  e.count++
  if (e.count > max) {
    return { allowed: false, remaining: 0, resetIn: e.resetAt - now }
  }
  return { allowed: true, remaining: max - e.count, resetIn: e.resetAt - now }
}

/**
 * 3-strategy parser:
 *   1. JSON.parse(raw)
 *   2. Extract from ```json ... ``` block
 *   3. First {...} or [...] block via regex
 */
export function parseAIJson<T = unknown>(text: string): T | null {
  if (!text || typeof text !== 'string') return null
  try {
    return JSON.parse(text) as T
  } catch {
    /* continue */
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1]) as T
    } catch {
      /* continue */
    }
  }
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) {
    try {
      return JSON.parse(obj[0]) as T
    } catch {
      /* continue */
    }
  }
  const arr = text.match(/\[[\s\S]*\]/)
  if (arr) {
    try {
      return JSON.parse(arr[0]) as T
    } catch {
      /* continue */
    }
  }
  return null
}

export async function logAIResult(params: {
  feature: string
  userId?: string | null
  companyId?: string | null
  jobId?: string | null
  customerId?: string | null
  input: unknown
  output: unknown
  model?: string
  durationMs?: number
  success?: boolean
  errorMessage?: string | null
}): Promise<void> {
  try {
    const anyPrisma = prisma as unknown as { aIResult?: { create: (args: unknown) => Promise<unknown> } }
    if (!anyPrisma.aIResult) return
    await anyPrisma.aIResult.create({
      data: {
        feature: params.feature,
        userId: params.userId ?? null,
        companyId: params.companyId ?? null,
        jobId: params.jobId ?? null,
        customerId: params.customerId ?? null,
        input: params.input as never,
        output: params.output as never,
        model: params.model || AI_MODEL,
        durationMs: params.durationMs ?? null,
        success: params.success ?? true,
        errorMessage: params.errorMessage ?? null,
      },
    })
  } catch (err) {
    console.error('logAIResult failed:', err)
  }
}
