import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { emailConfiguration, verifyEmailConnection } from '@/lib/email'
import type { AuthContext } from '@/lib/operations-governance'
import { configuredProvider } from './providers'
import { manager, text, txFor, audit, json, fail } from './core'

export async function integrationReadiness(user: AuthContext) {
  manager(user)
  const connections = await prisma.integrationConnection.findMany({ where: { companyId: user.companyId }, select: { provider: true, enabled: true } })
  const checks = await prisma.integrationRun.findMany({ where: { companyId: user.companyId, action: 'CONNECTION_CHECK' }, orderBy: { createdAt: 'desc' }, take: 30 })
  const origin = process.env.NEXTAUTH_URL || ''
  return {
    connections, checks: checks.map(c => ({ provider: c.provider, status: c.status, output: c.output, createdAt: c.createdAt })),
    email: { configured: emailConfiguration().configured, transport: emailConfiguration().transport },
    encryptionReady: /^[a-f\d]{64}$/i.test(process.env.INTEGRATION_ENCRYPTION_KEY || ''),
    softwareBilling: { key: !!process.env.SOFTWARE_STRIPE_SECRET_KEY, webhook: !!process.env.SOFTWARE_STRIPE_WEBHOOK_SECRET, plans: !!process.env.SOFTWARE_BILLING_PLANS },
    callbacks: {
      stripe: `${origin}/api/integrations/stripe/${user.companyId}`,
      twilioSms: `${origin}/api/integrations/intake/${user.companyId}/sms`,
      twilioVoice: `${origin}/api/integrations/intake/${user.companyId}/voice`,
      twilioStatus: `${origin}/api/integrations/messages/${user.companyId}/twilio`,
    },
  }
}
export async function checkIntegration(user: AuthContext, body: Record<string, unknown>, fetcher: typeof fetch = fetch) {
  manager(user)
  const provider = text(body.provider, 'provider', 30)
  if (!['stripe', 'twilio', 'smtp'].includes(provider)) fail('Choose Stripe, Twilio or SMTP')
  await txFor(user, async () => {})
  let output: Record<string, unknown>, success = false
  try {
    if (provider === 'smtp') {
      output = await verifyEmailConnection(); success = output.success === true
    } else {
      const c = await configuredProvider(user.companyId, provider)
      if (provider === 'stripe') {
        const stripe = new Stripe(String(c.credentials.token), { apiVersion: '2025-02-24.acacia', timeout: 10000, maxNetworkRetries: 0 })
        const account = await stripe.accounts.retrieve()
        output = { authenticated: true, accountId: account.id, chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled, live: String(c.credentials.token).startsWith('sk_live_'), webhookConfigured: !!c.credentials.webhookSecret }
        success = account.charges_enabled && !!c.credentials.webhookSecret
      } else {
        const sid = String(c.config.accountSid), headers = { Authorization: 'Basic ' + Buffer.from(sid + ':' + c.credentials.token).toString('base64') }
        const response = await fetcher(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(String(c.config.from))}`, { headers, redirect: 'error', signal: AbortSignal.timeout(10000) })
        if (!response.ok) throw Error('Authentication failed')
        const value = await response.json(), number = value.incoming_phone_numbers?.find((n: {phone_number: string}) => n.phone_number === c.config.from)
        output = { authenticated: true, senderOwned: !!number, sms: !!number?.capabilities?.sms, voice: !!number?.capabilities?.voice, smsUrl: number?.sms_url || '', voiceUrl: number?.voice_url || '' }
        success = !!number?.capabilities?.sms
      }
    }
  } catch { output = { error: 'Connection check failed. Check credentials, enabled status, and provider account permissions.' } }
  return txFor(user, async tx => {
    const result = await tx.integrationRun.create({ data: { companyId: user.companyId, provider, action: 'CONNECTION_CHECK', status: success ? 'VERIFIED' : 'NEEDS_ATTENTION', requestKey: crypto.randomUUID(), input: {}, output: json(output), createdById: user.id, attempts: 1 } })
    await audit(tx, user, 'PROVIDER_CONNECTION_CHECKED', 'IntegrationRun', result.id, { provider, status: result.status })
    return { provider, status: result.status, ...output }
  })
}
