import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// Get saved payment methods for a customer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer || !customer.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // Get payment methods from Stripe
    const paymentMethods = await getStripe().paymentMethods.list({
      customer: customer.stripeCustomerId,
      type: 'card',
    })

    // Format response
    const cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false, // Could check against default payment method
    }))

    return NextResponse.json({ paymentMethods: cards })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json({ error: 'Failed to get payment methods' }, { status: 500 })
  }
}

// Delete a payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('paymentMethodId')

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
    }

    // Detach payment method from customer
    await getStripe().paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete payment method error:', error)
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 })
  }
}
