export function calculateContractAmount(
  allocation: number,
  odds: number
): number {
  // If odds are 0.95, $100 allocation buys 100 contracts (each worth $1 if it wins)
  // But we need to account for the price per contract
  // At 95% odds, each contract costs ~$0.95
  // So $100 buys ~105 contracts
  
  if (odds <= 0 || odds >= 1) {
    throw new Error(`Invalid odds: ${odds}`);
  }
  
  // Price per contract = odds
  const pricePerContract = odds;
  const contracts = allocation / pricePerContract;
  
  return Math.floor(contracts * 10000) / 10000; // Round to 4 decimals
}

export function kellyCriterion(
  winProbability: number,
  winOdds: number,
  lossOdds: number = 1
): number {
  // Kelly % = (p * b - q) / b
  // where p = win probability, q = loss probability, b = odds ratio
  const q = 1 - winProbability;
  const b = winOdds / lossOdds;
  
  const kelly = (winProbability * b - q) / b;
  
  // Cap at 25% of bankroll for safety
  return Math.max(0, Math.min(kelly, 0.25));
}

