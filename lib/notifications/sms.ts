import twilio from 'twilio';
import { env } from '../../config/env';
import { DailyReportData, formatReportForSMS } from './report';

const client = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
  ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  : null;

export async function sendSMS(
  to: string,
  message: string
): Promise<void> {
  if (!client || !env.TWILIO_PHONE_NUMBER) {
    console.log('📱 SMS not configured, would send:', message);
    return;
  }

  try {
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: to
    });
    
    console.log(`✅ SMS sent to ${to}`);
  } catch (error: any) {
    console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    throw error;
  }
}

export async function sendDailyReportSMS(
  phoneNumber: string,
  reportData: DailyReportData
): Promise<void> {
  const message = formatReportForSMS(reportData);
  
  // SMS has 1600 char limit, split if needed
  if (message.length > 1600) {
    const part1 = message.substring(0, 1550) + '...\n(continued)';
    const part2 = '(continued)\n' + message.substring(1550);
    
    await sendSMS(phoneNumber, part1);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    await sendSMS(phoneNumber, part2);
  } else {
    await sendSMS(phoneNumber, message);
  }
}

