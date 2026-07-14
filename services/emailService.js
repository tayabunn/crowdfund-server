const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP credentials or falls back to an Ethereal test account in development.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Subject of the email
 * @param {string} options.text - Plain text version
 * @param {string} options.html - HTML version
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    let transporter;

    // Check if configuration exists in env
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Ethereal test account fallback in development
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'melba2@ethereal.email',
          pass: 'yB82qQ6v37s9276q9U',
        },
      });
    }

    const from = process.env.EMAIL_FROM || '"CrowdFund" <noreply@crowdfund.com>';
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    
    // Ethereal preview link
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service] Preview message at: ${previewUrl}`);
    }

    return info;
  } catch (error) {
    console.error('[Email Service Error] Failed to send email:', error.message);
  }
}

module.exports = { sendEmail };
