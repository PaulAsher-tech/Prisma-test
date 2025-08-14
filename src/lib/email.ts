import nodemailer from 'nodemailer'

// Mock email transporter for development
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false,
  auth: {
    user: 'test',
    pass: 'test'
  }
})

// In production, you would use a real email service like SendGrid, Postmark, etc.
// Example with SendGrid:
// const transporter = nodemailer.createTransporter({
//   service: 'SendGrid',
//   auth: {
//     user: 'apikey',
//     pass: process.env.SENDGRID_API_KEY
//   }
// })

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    })

    console.log('Email sent successfully:', info.messageId)
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export function generateNewsletterEmail(postTitle: string, postContent: string, postUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${postTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>My Newsletter</h1>
          <p>New post published!</p>
        </div>
        <div class="content">
          <h2>${postTitle}</h2>
          <div>${postContent.substring(0, 300)}${postContent.length > 300 ? '...' : ''}</div>
          <a href="${postUrl}" class="button">Read Full Post</a>
        </div>
        <div class="footer">
          <p>You're receiving this because you subscribed to our newsletter.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Unsubscribe</a></p>
        </div>
      </body>
    </html>
  `
}