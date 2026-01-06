import { sendSMS } from '../notifications/sms';
import { sendEmail } from '../notifications/email';

export async function sendErrorAlert(error: Error): Promise<void> {
  const message = `🚨 POLYMARKET TRADER ERROR

${error.message}

Stack:
${error.stack?.substring(0, 500)}

Time: ${new Date().toISOString()}`;

  if (process.env.ADMIN_PHONE_NUMBER) {
    await sendSMS(process.env.ADMIN_PHONE_NUMBER, message);
  }
  
  if (process.env.ADMIN_EMAIL) {
    await sendEmail(
      process.env.ADMIN_EMAIL,
      '🚨 Polymarket Trader Error',
      `<pre>${message}</pre>`
    );
  }
}

export async function sendDailySummary(summary: {
  contracts_analyzed: number;
  trades_executed: number;
  total_allocated: number;
  current_bankroll: number;
}): Promise<void> {
  const message = `📊 Daily Trading Summary

Contracts Analyzed: ${summary.contracts_analyzed}
Trades Executed: ${summary.trades_executed}
Total Allocated: $${summary.total_allocated.toFixed(2)}
Current Bankroll: $${summary.current_bankroll.toFixed(2)}`;

  if (process.env.ADMIN_PHONE_NUMBER) {
    await sendSMS(process.env.ADMIN_PHONE_NUMBER, message);
  }
}

