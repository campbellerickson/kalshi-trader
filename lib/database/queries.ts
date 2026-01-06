import { supabase } from './client';
import { Contract, Trade, Position, DailyReportData } from '../../types';

export async function getOpenTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      contract:contracts(*)
    `)
    .eq('status', 'open')
    .order('executed_at', { ascending: false });
  
  if (error) throw error;
  return data as Trade[];
}

export async function getRecentTrades(limit: number = 50): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      contract:contracts(*)
    `)
    .order('executed_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as Trade[];
}

export async function getTradesToday(): Promise<Trade[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      contract:contracts(*)
    `)
    .gte('executed_at', today.toISOString())
    .order('executed_at', { ascending: false });
  
  if (error) throw error;
  return data as Trade[];
}

export async function getTradesInRange(start: Date, end: Date): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      contract:contracts(*)
    `)
    .gte('executed_at', start.toISOString())
    .lte('executed_at', end.toISOString())
    .order('executed_at', { ascending: false });
  
  if (error) throw error;
  return data as Trade[];
}

export async function getTrade(id: string): Promise<Trade | null> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      contract:contracts(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Trade | null;
}

export async function logTrade(trade: {
  contract_id: string;
  entry_odds: number;
  position_size: number;
  side: 'YES' | 'NO';
  contracts_purchased: number;
  ai_confidence: number;
  ai_reasoning: string;
}): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .insert({
      ...trade,
      status: 'open',
      executed_at: new Date().toISOString(),
    })
    .select(`
      *,
      contract:contracts(*)
    `)
    .single();
  
  if (error) throw error;
  return data as Trade;
}

export async function updateTrade(
  id: string,
  updates: Partial<Trade>
): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      contract:contracts(*)
    `)
    .single();
  
  if (error) throw error;
  return data as Trade;
}

export async function getOpenPositions(): Promise<Position[]> {
  const trades = await getOpenTrades();
  // This would need market data to calculate current odds
  // For now, return basic structure
  return trades.map(trade => ({
    trade,
    current_odds: trade.entry_odds, // Placeholder
    unrealized_pnl: 0,
    unrealized_pnl_pct: 0,
  }));
}

export async function getCurrentBankroll(): Promise<number> {
  const { data } = await supabase
    .from('performance_metrics')
    .select('bankroll')
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  return data?.bankroll || Number(process.env.INITIAL_BANKROLL) || 1000;
}

export async function getInitialBankroll(): Promise<number> {
  return Number(process.env.INITIAL_BANKROLL) || 1000;
}

export async function getBankrollAt(date: Date): Promise<number> {
  const { data } = await supabase
    .from('performance_metrics')
    .select('bankroll')
    .lte('date', date.toISOString())
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  return data?.bankroll || Number(process.env.INITIAL_BANKROLL) || 1000;
}

export async function getCashBalance(): Promise<number> {
  const bankroll = await getCurrentBankroll();
  const openPositions = await getOpenPositions();
  const invested = openPositions.reduce((sum, p) => sum + p.trade.position_size, 0);
  return bankroll - invested;
}

export async function getNotificationPreferences() {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', 'default')
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || { enabled: false };
}

export async function getRecentStopLosses(hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('stop_loss_events')
    .select(`
      *,
      trade:trades(
        *,
        contract:contracts(*)
      )
    `)
    .gte('executed_at', since.toISOString())
    .order('executed_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getRecentLosses(limit: number = 10) {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      contract:contracts(*)
    `)
    .eq('status', 'lost')
    .order('executed_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as Trade[];
}

