import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

const TRIAL_DAYS = 14

// Create subscription for a service agreement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agreementId, paymentMethodId } = body

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID required' }, { status: 400 })
    }

    // Get agreement with customer and plan
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: agreementId },
      include: {
        customer: true,
        plan: true,
      },
    })

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    if (!agreement.customer.stripeCustomerId) {
      return NextResponse.json({ error: 'Customer has no payment method' }, { status: 400 })
    }

    // Set default payment method if provided
    if (paymentMethodId) {
      await getStripe().customers.update(agreement.customer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // Get or create Stripe price
    let priceId = agreement.stripePriceId

    if (!priceId) {
      // Create product for the plan
      const product = await getStripe().products.create({
        name: `${agreement.plan.name} - Service Agreement`,
        description: agreement.plan.description || undefined,
        metadata: {
          planId: agreement.plan.id,
          agreementId: agreement.id,
        },
      })

      // Determine price based on billing frequency
      const amount = agreement.billingFrequency === 'annual'
        ? Number(agreement.plan.annualPrice)
        : Number(agreement.plan.monthlyPrice)

      const interval = agreement.billingFrequency === 'annual' ? 'year' : 'month'

      // Create price
      const price = await getStripe().prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval,
        },
        metadata: {
          agreementId: agreement.id,
        },
      })

      priceId = price.id

      // Save price ID to agreement
      await prisma.serviceAgreement.update({
        where: { id: agreementId },
        data: { stripePriceId: priceId },
      })
    }

    // Calculate trial end date
    const trialEnd = Math.floor(Date.now() / 1000) + (TRIAL_DAYS * 24 * 60 * 60)

    // Create subscription
    const subscription = await getStripe().subscriptions.create({
      customer: agreement.customer.stripeCustomerId,
      items: [{ price: priceId }],
      trial_end: trialEnd,
      metadata: {
        agreementId: agreement.id,
        customerId: agreement.customerId,
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    // Calculate next billing date
    const trialEndsAt = new Date(trialEnd * 1000)
    const nextBillingDate = trialEndsAt

    // Update agreement
    await prisma.serviceAgreement.update({
      where: { id: agreementId },
      data: {
        stripeSubscriptionId: subscription.id,
        paymentStatus: 'trial',
        trialEndsAt,
        nextBillingDate,
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEndsAt: trialEndsAt.toISOString(),
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agreementId = searchParams.get('agreementId')

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID required' }, { status: 400 })
    }

    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: agreementId },
    })

    if (!agreement || !agreement.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Cancel at period end (don't cancel immediately)
    await getStripe().subscriptions.update(agreement.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    // Update agreement
    await prisma.serviceAgreement.update({
      where: { id: agreementId },
      data: {
        paymentStatus: 'cancelled',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
