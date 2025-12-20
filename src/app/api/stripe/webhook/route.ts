import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event

  // If webhook secret is configured, verify signature
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } else {
    // For testing without webhook secret
    event = JSON.parse(body) as Stripe.Event
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      const invoiceId = session.metadata?.invoiceId
      if (!invoiceId) {
        console.error('No invoiceId in session metadata')
        break
      }

      const amountPaid = (session.amount_total || 0) / 100 // Convert from cents

      try {
        await prisma.$transaction(async (tx) => {
          // Get current invoice
          const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId },
          })

          if (!invoice) {
            throw new Error('Invoice not found')
          }

          // Create payment record
          await tx.payment.create({
            data: {
              invoiceId,
              amount: amountPaid,
              method: 'CREDIT_CARD',
              stripePaymentId: session.payment_intent as string,
              reference: `Stripe: ${session.id}`,
              notes: 'Paid via online checkout',
            },
          })

          // Update invoice
          const newPaidAmount = Number(invoice.paidAmount) + amountPaid
          const newBalanceDue = Number(invoice.totalAmount) - newPaidAmount
          const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIAL'

          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaidAmount,
              balanceDue: Math.max(0, newBalanceDue),
              status: newStatus,
              paidDate: newBalanceDue <= 0 ? new Date() : undefined,
            },
          })
        })

        console.log(`Payment recorded for invoice ${invoiceId}`)
      } catch (error) {
        console.error('Error processing payment:', error)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)
      break
    }

    // Subscription events for Service Agreements
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      const agreementId = subscription.metadata?.agreementId
      if (agreementId) {
        console.log(`Subscription created for agreement ${agreementId}`)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const agreementId = subscription.metadata?.agreementId
      if (agreementId) {
        let paymentStatus = 'active'
        if (subscription.status === 'trialing') paymentStatus = 'trial'
        else if (subscription.status === 'past_due') paymentStatus = 'past_due'
        else if (subscription.status === 'canceled') paymentStatus = 'cancelled'
        else if (subscription.status === 'active') paymentStatus = 'active'

        await prisma.serviceAgreement.update({
          where: { id: agreementId },
          data: {
            paymentStatus,
            nextBillingDate: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        })
        console.log(`Subscription updated for agreement ${agreementId}: ${paymentStatus}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const agreementId = subscription.metadata?.agreementId
      if (agreementId) {
        await prisma.serviceAgreement.update({
          where: { id: agreementId },
          data: {
            paymentStatus: 'cancelled',
            cancelledDate: new Date(),
            status: 'CANCELLED',
          },
        })
        console.log(`Subscription cancelled for agreement ${agreementId}`)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string

      if (subscriptionId) {
        // Find agreement by subscription ID
        const agreement = await prisma.serviceAgreement.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        })

        if (agreement) {
          await prisma.serviceAgreement.update({
            where: { id: agreement.id },
            data: {
              paymentStatus: 'active',
              lastPaymentDate: new Date(),
              lastPaymentAmount: (invoice.amount_paid || 0) / 100,
              nextBillingDate: invoice.lines.data[0]?.period?.end
                ? new Date(invoice.lines.data[0].period.end * 1000)
                : null,
            },
          })
          console.log(`Invoice paid for agreement ${agreement.id}`)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string

      if (subscriptionId) {
        const agreement = await prisma.serviceAgreement.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        })

        if (agreement) {
          await prisma.serviceAgreement.update({
            where: { id: agreement.id },
            data: {
              paymentStatus: 'past_due',
            },
          })
          console.log(`Payment failed for agreement ${agreement.id}`)
        }
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
