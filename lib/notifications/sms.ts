import { DailyReportData, formatReportForSMS } from './report';

export async function sendSMS(
  to: string,
  message: string
): Promise<void> {
  // SMS notifications removed - logging only
  console.log('📱 SMS (log only):', message);
  console.log(`   Would send to: ${to}`);
}

export async function sendDailyReportSMS(
  phoneNumber: string,
  reportData: DailyReportData
): Promise<void> {
  const message = formatReportForSMS(reportData);
  console.log('📱 Daily Report SMS (log only):');
  console.log(message);
  console.log(`   Would send to: ${phoneNumber}`);
}

