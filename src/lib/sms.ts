const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio credentials not configured')
    return { success: false, error: 'SMS service not configured. Please configure Twilio credentials.' }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formatPhoneForTwilio(to),
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    )

    // Check content type before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Twilio returned non-JSON response:', response.status, text.substring(0, 200))
      return {
        success: false,
        error: 'SMS service error. Please check Twilio credentials.',
      }
    }

    const data = await response.json()

    if (!response.ok) {
      console.error('Twilio API error:', data)
      return {
        success: false,
        error: data.message || data.error_message || 'Failed to send SMS',
      }
    }

    return {
      success: true,
      messageId: data.sid,
    }
  } catch (error) {
    console.error('SMS sending error:', error)
    return {
      success: false,
      error: 'Failed to send SMS. Please check Twilio configuration.',
    }
  }
}

function formatPhoneForTwilio(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Add US country code if not present
  if (digits.length === 10) {
    return `+1${digits}`
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  return `+${digits}`
}

// SMS Templates
export const smsTemplates = {
  appointmentReminder: (customerName: string, date: string, timeWindow: string) =>
    `Hi ${customerName}! This is a reminder of your upcoming service appointment on ${date} between ${timeWindow}. Reply CONFIRM to confirm or call us to reschedule.`,

  technicianEnRoute: (customerName: string, techName: string, eta: string) =>
    `Hi ${customerName}! ${techName} is on the way and will arrive in approximately ${eta}. Please ensure access to your property.`,

  appointmentConfirmation: (customerName: string, date: string, timeWindow: string) =>
    `Hi ${customerName}! Your service appointment is confirmed for ${date} between ${timeWindow}. We'll send a reminder before your appointment.`,

  jobComplete: (customerName: string) =>
    `Hi ${customerName}! Your service has been completed. Thank you for choosing us! Please let us know if you have any questions.`,

  invoiceSent: (customerName: string, amount: string) =>
    `Hi ${customerName}! Your invoice for ${amount} has been sent to your email. Thank you for your business!`,

  paymentReceived: (customerName: string, amount: string) =>
    `Hi ${customerName}! We've received your payment of ${amount}. Thank you!`,
}
