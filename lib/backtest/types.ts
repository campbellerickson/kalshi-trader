export interface HistoricalMarket {
  market_id: string;
  question: string;
  end_date: Date;
  historical_odds: Array<{
    timestamp: Date;
    yes_odds: number;
    no_odds: number;
    liquidity: number;
    volume_24h: number;
  }>;
  resolved: boolean;
  outcome?: 'YES' | 'NO';
  resolved_at?: Date;
}

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialBankroll: number;
  dailyBudget: number;
  minOdds: number;
  maxOdds: number;
  maxDaysToResolution: number;
  minLiquidity: number;
  stopLossThreshold: number;
  useAI: boolean; // If false, uses simple strategy
}

export interface BacktestTrade {
  market_id: string;
  question: string;
  entryDate: Date;
  entryOdds: number;
  positionSize: number;
  contractsPurchased: number;
  side: 'YES' | 'NO';
  exitDate?: Date;
  exitOdds?: number;
  status: 'open' | 'won' | 'lost' | 'stopped';
  pnl?: number;
  aiConfidence?: number;
  aiReasoning?: string;
}

export interface BacktestResult {
  config: BacktestConfig;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  stoppedTrades: number;
  winRate: number;
  totalPnL: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  finalBankroll: number;
  dailyReturns: Array<{ date: Date; pnl: number; bankroll: number }>;
  trades: BacktestTrade[];
}

