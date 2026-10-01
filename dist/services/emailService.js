"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Sends an email using SMTP credentials or falls back to an Ethereal test account in development.
 */
async function sendEmail({ to, subject, text, html }) {
    try {
        let transporter;
        // Check if configuration exists in env
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587') || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        else {
            // Ethereal test account fallback in development
            transporter = nodemailer_1.default.createTransport({
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
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[Email Service] Preview message at: ${previewUrl}`);
        }
        return info;
    }
    catch (error) {
        console.error('[Email Service Error] Failed to send email:', error.message);
    }
}
