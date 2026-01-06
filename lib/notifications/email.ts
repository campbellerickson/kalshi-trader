import { DailyReportData, formatReportForEmail } from './report';

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  // Email notifications removed - logging only
  console.log('📧 Email (log only):', subject);
  console.log(`   Would send to: ${to}`);
  // Log a truncated version of the HTML
  const textPreview = html.replace(/<[^>]*>/g, '').substring(0, 200);
  console.log(`   Preview: ${textPreview}...`);
}

export async function sendDailyReportEmail(
  email: string,
  reportData: DailyReportData
): Promise<void> {
  const emoji = reportData.mtdPnL >= 0 ? '📈' : '📉';
  const subject = `${emoji} Daily Report: ${reportData.mtdPnL >= 0 ? '+' : ''}$${reportData.mtdPnL.toFixed(2)} MTD`;
  const html = formatReportForEmail(reportData);
  
  console.log('📧 Daily Report Email (log only):');
  console.log(`   Subject: ${subject}`);
  console.log(`   Would send to: ${email}`);
  // Log key metrics
  console.log(`   MTD P&L: $${reportData.mtdPnL.toFixed(2)}`);
  console.log(`   YTD P&L: $${reportData.ytdPnL.toFixed(2)}`);
  console.log(`   Total Liquidity: $${reportData.totalLiquidity.toFixed(2)}`);
}

