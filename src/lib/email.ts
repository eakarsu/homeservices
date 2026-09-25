import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export function emailConfiguration(env = process.env) {
  const from = env.EMAIL_FROM || env.SMTP_FROM || env.SMTP_USER || ''
  const http = !!(env.EMAIL_DELIVERY_URL && env.EMAIL_DELIVERY_TOKEN && env.EMAIL_DELIVERY_ALLOWED_HOSTS && from)
  const smtp = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && from && !/your[-_ ]|example\.|placeholder/i.test(env.SMTP_USER + env.SMTP_PASSWORD))
  return { configured: http || smtp, transport: http ? 'HTTPS' : smtp ? 'SMTP' : 'NONE', from }
}
export function smtpTransport(env = process.env) {
  const port = Number(env.SMTP_PORT || 587)
  if (![465, 587, 2525].includes(port)) throw Error('Use SMTP port 465, 587 or 2525')
  return nodemailer.createTransport({
    host: env.SMTP_HOST, port, secure: port === 465, requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  })
}
export async function verifyEmailConnection() {
  const configuration = emailConfiguration()
  if (!configuration.configured) return { success: false, error: 'Account email delivery is not configured' }
  if (configuration.transport === 'HTTPS') return { success: false, error: 'HTTPS email settings present; delivery requires a separate acceptance check' }
  try { await smtpTransport().verify(); return { success: true, transport: 'SMTP' } }
  catch { return { success: false, error: 'SMTP connection or authentication failed' } }
}
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(options.to)) return { success: false, error: 'A valid recipient is required' }
  const configuration = emailConfiguration()
  if (!configuration.configured) return { success: false, error: 'Email service not configured' }
  try {
    if (configuration.transport === 'SMTP') {
      const result = await smtpTransport().sendMail({ ...options, from: configuration.from })
      return result.accepted.length ? { success: true, messageId: result.messageId } : { success: false, error: 'Email provider rejected delivery' }
    }
    const url = new URL(process.env.EMAIL_DELIVERY_URL!)
    const hosts = (process.env.EMAIL_DELIVERY_ALLOWED_HOSTS || '').split(',').map(v => v.trim().toLowerCase())
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname.toLowerCase())) return { success: false, error: 'Email delivery endpoint is not approved' }
    const response = await fetch(url, {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${process.env.EMAIL_DELIVERY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: configuration.from, ...options }), signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return { success: false, error: 'Email provider rejected delivery' }
    const result = await response.json().catch(() => ({})) as { id?: string; messageId?: string }
    return { success: true, messageId: result.id || result.messageId }
  } catch { return { success: false, error: 'Failed to send email' } }
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

  passwordReset: (data: {
    name: string
    resetUrl: string
  }) => ({
    subject: 'Reset Your Password - ServiceCrew',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="btn">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>ServiceCrew - Home Services Management</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  emailVerification: (data: {
    name: string
    verifyUrl: string
  }) => ({
    subject: 'Verify Your Email - ServiceCrew',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>Welcome to ServiceCrew! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.verifyUrl}" class="btn">Verify Email</a>
            </p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>ServiceCrew - Home Services Management</p>
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
