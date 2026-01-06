import { getRecentTrades, getRecentLosses } from '../database/queries';
import { Trade } from '../../types';

export async function buildHistoricalContext(): Promise<string> {
  const recentTrades = await getRecentTrades(50);
  const resolvedTrades = recentTrades.filter(t => t.status !== 'open');
  
  if (resolvedTrades.length === 0) {
    return 'No historical trades yet. This is a fresh start.';
  }

  const winRate = calculateWinRate(resolvedTrades);
  const avgROI = calculateAvgROI(resolvedTrades);
  const totalPnL = calculateTotalPnL(resolvedTrades);
  
  const winningPatterns = analyzeWinningTrades(resolvedTrades);
  const losingPatterns = analyzeLosingTrades(resolvedTrades);
  const recentLosses = await getRecentLosses(5);

  return `
HISTORICAL PERFORMANCE (Last 50 trades):
- Win Rate: ${(winRate * 100).toFixed(1)}%
- Average ROI: ${(avgROI * 100).toFixed(2)}%
- Total P&L: $${totalPnL.toFixed(2)}

WINNING PATTERNS:
${winningPatterns.map(p => `- ${p.pattern}: ${(p.winRate * 100).toFixed(1)}% win rate`).join('\n')}

LOSING PATTERNS (AVOID):
${losingPatterns.map(p => `- ${p.pattern}: Lost $${Math.abs(p.totalLoss).toFixed(2)}`).join('\n')}

RECENT MISTAKES:
${recentLosses.map(t => 
  `- ${t.contract.question.substring(0, 60)}: ${t.ai_reasoning.substring(0, 100)} → LOST`
).join('\n')}
  `.trim();
}

function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter(t => t.status === 'won').length;
  return wins / trades.length;
}

function calculateAvgROI(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const totalROI = trades.reduce((sum, t) => {
    if (t.pnl && t.position_size) {
      return sum + (t.pnl / t.position_size);
    }
    return sum;
  }, 0);
  return totalROI / trades.length;
}

function calculateTotalPnL(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
}

function analyzeWinningTrades(trades: Trade[]): Array<{ pattern: string; winRate: number }> {
  const winning = trades.filter(t => t.status === 'won');
  
  // Analyze by confidence level
  const highConf = winning.filter(t => t.ai_confidence >= 0.85);
  const medConf = winning.filter(t => t.ai_confidence >= 0.70 && t.ai_confidence < 0.85);
  
  return [
    { pattern: 'High confidence trades (≥85%)', winRate: highConf.length / Math.max(1, trades.filter(t => t.ai_confidence >= 0.85).length) },
    { pattern: 'Medium confidence trades (70-85%)', winRate: medConf.length / Math.max(1, trades.filter(t => t.ai_confidence >= 0.70 && t.ai_confidence < 0.85).length) },
  ];
}

function analyzeLosingTrades(trades: Trade[]): Array<{ pattern: string; totalLoss: number }> {
  const losing = trades.filter(t => t.status === 'lost');
  
  return [
    { pattern: 'All losing trades', totalLoss: losing.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) },
  ];
}

