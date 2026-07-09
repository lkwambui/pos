import nodemailer from 'nodemailer';
import { config } from '../config/app';
import { logger } from '../utils/logger';

const createTransport = () => {
  if (!config.smtp.host) {
    logger.warn('SMTP not configured, email sending disabled');
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

const transport = createTransport();

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!transport) {
    logger.info({ to, subject }, 'Email skipped (no SMTP config)');
    return;
  }

  try {
    await transport.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
    logger.info({ to, subject }, 'Email sent');
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
  }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string, appUrl: string) => {
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  await sendEmail(to, 'Password Reset Request', html);
};

export const sendSaleReceipt = async (to: string, saleData: Record<string, unknown>) => {
  const html = `
    <h1>Sale Receipt</h1>
    <p>Sale #${saleData.saleNumber || 'N/A'}</p>
    <p>Total: ${saleData.total || 'N/A'}</p>
    <p>Thank you for your purchase!</p>
  `;

  await sendEmail(to, `Receipt - Sale #${saleData.saleNumber || 'N/A'}`, html);
};
