import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// Create a setup intent for saving a card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerId } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = customer.stripeCustomerId

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customerName = customer.companyName ||
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
        'Customer'

      const stripeCustomer = await getStripe().customers.create({
        email: customer.email || undefined,
        name: customerName,
        phone: customer.phone || undefined,
        metadata: {
          customerId: customer.id,
          customerNumber: customer.customerNumber,
        },
      })

      stripeCustomerId = stripeCustomer.id

      // Save Stripe customer ID
      await prisma.customer.update({
        where: { id: customerId },
        data: { stripeCustomerId },
      })
    }

    // Create setup intent
    const setupIntent = await getStripe().setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        customerId: customer.id,
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      stripeCustomerId,
    })
  } catch (error) {
    console.error('Setup intent error:', error)
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 })
  }
}
