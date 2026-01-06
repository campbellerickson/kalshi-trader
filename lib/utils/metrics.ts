import { Trade } from '../../types';

export function calculateWinRate(trades: Trade[]): number {
  const resolved = trades.filter(t => t.status !== 'open');
  if (resolved.length === 0) return 0;
  const wins = resolved.filter(t => t.status === 'won').length;
  return wins / resolved.length;
}

export function calculateTotalPnL(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
}

export function calculateSharpeRatio(trades: Trade[]): number {
  const resolved = trades.filter(t => t.status !== 'open' && t.pnl !== undefined);
  if (resolved.length < 2) return 0;
  
  const returns = resolved.map(t => (t.pnl || 0) / (t.position_size || 1));
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Annualized Sharpe (assuming daily returns)
  return (avgReturn / stdDev) * Math.sqrt(252);
}

export async function updatePerformanceMetrics(): Promise<void> {
  // This would calculate and store daily performance metrics
  // Implementation depends on your specific needs
}

