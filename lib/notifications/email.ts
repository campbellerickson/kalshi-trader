import sgMail from '@sendgrid/mail';
import { env } from '../../config/env';
import { DailyReportData, formatReportForEmail } from './report';

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!env.SENDGRID_API_KEY) {
    console.log('📧 Email not configured, would send:', subject);
    return;
  }

  try {
    await sgMail.send({
      to,
      from: env.SENDGRID_FROM_EMAIL || 'reports@polymarket-trader.com',
      subject,
      html
    });
    
    console.log(`✅ Email sent to ${to}`);
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

export async function sendDailyReportEmail(
  email: string,
  reportData: DailyReportData
): Promise<void> {
  const emoji = reportData.mtdPnL >= 0 ? '📈' : '📉';
  const subject = `${emoji} Daily Report: ${reportData.mtdPnL >= 0 ? '+' : ''}$${reportData.mtdPnL.toFixed(2)} MTD`;
  const html = formatReportForEmail(reportData);
  
  await sendEmail(email, subject, html);
}

