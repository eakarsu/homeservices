import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
  }[]
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('Email credentials not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const info = await transporter.sendMail({
      from: `"Home Services" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: 'Failed to send email',
    }
  }
}

// Email Templates
export const emailTemplates = {
  appointmentConfirmation: (data: {
    customerName: string
    date: string
    timeWindow: string
    address: string
    serviceType: string
  }) => ({
    subject: 'Appointment Confirmation - Home Services',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your service appointment has been confirmed. Here are the details:</p>
            <div class="details">
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time Window:</strong> ${data.timeWindow}</p>
              <p><strong>Service Address:</strong> ${data.address}</p>
              <p><strong>Service Type:</strong> ${data.serviceType}</p>
            </div>
            <p>Please ensure access to your property at the scheduled time. Our technician will contact you shortly before arriving.</p>
            <p>If you need to reschedule, please contact us at least 24 hours before your appointment.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing Home Services!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  invoiceSent: (data: {
    customerName: string
    invoiceNumber: string
    amount: string
    dueDate: string
    items: { description: string; amount: string }[]
  }) => ({
    subject: `Invoice ${data.invoiceNumber} - Home Services`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .invoice-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; color: #f97316; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${data.invoiceNumber}</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Please find your invoice details below:</p>
            <div class="invoice-details">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.amount}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td class="total">Total</td>
                    <td class="total">${data.amount}</td>
                  </tr>
                </tfoot>
              </table>
              <p style="margin-top: 15px;"><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            <p>Please make payment by the due date. You can pay online or contact us for other payment options.</p>
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  estimateSent: (data: {
    customerName: string
    estimateNumber: string
    validUntil: string
    options: { name: string; total: string }[]
  }) => ({
    subject: `Estimate ${data.estimateNumber} - Home Services`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .options { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .option { padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 10px 0; }
          .option h3 { margin: 0 0 10px 0; color: #f97316; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Estimate</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Thank you for considering Home Services. Here are your estimate options:</p>
            <div class="options">
              ${data.options.map(opt => `
                <div class="option">
                  <h3>${opt.name}</h3>
                  <p><strong>Total:</strong> ${opt.total}</p>
                </div>
              `).join('')}
            </div>
            <p><strong>Valid Until:</strong> ${data.validUntil}</p>
            <p>Please contact us to discuss these options or to schedule your service.</p>
          </div>
          <div class="footer">
            <p>We look forward to serving you!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
}
