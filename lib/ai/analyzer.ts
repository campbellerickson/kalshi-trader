import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { AnalysisRequest, AnalysisResponse, Contract } from '../../types';
import { TRADING_SYSTEM_PROMPT } from './prompts';
import { buildHistoricalContext } from './learning';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function analyzeContracts(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  console.log(`🤖 Analyzing ${request.contracts.length} contracts with AI...`);

  // Build historical context
  const historicalContext = await buildHistoricalContext();

  // Build prompt
  const prompt = buildAnalysisPrompt(request, historicalContext);

  // Call Anthropic API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: TRADING_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  // Parse response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const parsed = parseAIResponse(content.text, request.contracts);
  
  console.log(`   ✅ AI selected ${parsed.selectedContracts.length} contracts`);
  console.log(`   💰 Total allocation: $${parsed.totalAllocated.toFixed(2)}`);

  return parsed;
}

function buildAnalysisPrompt(request: AnalysisRequest, historicalContext: string): string {
  const contractsList = request.contracts.map((c, i) => `
${i + 1}. Market ID: ${c.market_id}
   Question: ${c.question}
   Current Odds: ${(c.current_odds * 100).toFixed(2)}%
   Days to Resolution: ${Math.ceil((c.end_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
   Liquidity: $${c.liquidity.toFixed(2)}
   Volume (24h): $${(c.volume_24h || 0).toFixed(2)}
`).join('\n');

  return `
${historicalContext}

CURRENT SITUATION:
- Bankroll: $${request.currentBankroll.toFixed(2)}
- Daily Budget: $${request.dailyBudget}
- Contracts Available: ${request.contracts.length}

AVAILABLE CONTRACTS:
${contractsList}

Analyze these contracts and select the best 3 (or fewer if not confident) to allocate $${request.dailyBudget} across.

Remember:
- Be selective. Quality over quantity.
- Consider historical patterns from above.
- Diversify across uncorrelated events.
- Minimum $20 per contract, maximum $50.
- If uncertain, allocate less than the full budget.
`.trim();
}

function parseAIResponse(text: string, contracts: Contract[]): AnalysisResponse {
  // Try to extract JSON from the response
  let jsonText = text;
  
  // Look for JSON block
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[1] || jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);
    
    // Map market_ids to contracts
    const selectedContracts = parsed.selected_contracts.map((sc: any) => {
      const contract = contracts.find(c => c.market_id === sc.market_id);
      if (!contract) {
        throw new Error(`Contract not found: ${sc.market_id}`);
      }
      
      return {
        contract,
        allocation: Math.min(Math.max(sc.allocation, 20), 50), // Clamp between 20-50
        confidence: Math.min(Math.max(sc.confidence, 0), 1), // Clamp between 0-1
        reasoning: sc.reasoning || 'No reasoning provided',
        riskFactors: sc.risk_factors || [],
      };
    });

    return {
      selectedContracts,
      totalAllocated: parsed.total_allocated || selectedContracts.reduce((sum: number, sc: any) => sum + sc.allocation, 0),
      strategyNotes: parsed.strategy_notes || 'No strategy notes',
    };
  } catch (error: any) {
    console.error('Failed to parse AI response:', error);
    console.error('Response text:', text);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

