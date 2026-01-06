"use strict";exports.id=118,exports.ids=[118],exports.modules={3365:(e,t,a)=>{a.d(t,{U:()=>n});let n={DAILY_BUDGET:Number(process.env.DAILY_BUDGET)||100,MIN_ODDS:Number(process.env.MIN_ODDS)||.85,MAX_ODDS:Number(process.env.MAX_ODDS)||.98,MAX_DAYS_TO_RESOLUTION:Number(process.env.MAX_DAYS_TO_RESOLUTION)||2,MIN_LIQUIDITY:Number(process.env.MIN_LIQUIDITY)||2e3,INITIAL_BANKROLL:Number(process.env.INITIAL_BANKROLL)||100,DRY_RUN:"true"===process.env.DRY_RUN,MIN_POSITION_SIZE:20,MAX_POSITION_SIZE:50,STOP_LOSS_THRESHOLD:.8,MIN_HOLD_TIME_HOURS:1,MAX_SLIPPAGE_PCT:.05,MAX_LOSSES_IN_STREAK:5,MAX_STOP_LOSSES_24H:3,BANKROLL_DROP_THRESHOLD:.7,EXCLUDE_CATEGORIES:["Crypto","Sports","Entertainment"],EXCLUDE_KEYWORDS:["game","match","team","player","points","score","yards","rebounds","assists","goals","touchdown","win","loss","nfl","nba","mlb","nhl","soccer","football","basketball","baseball","hockey","tennis","golf","olympics","championship","tournament","playoff","season","celebrity","viral","trend","social media","follower","views","likes","surprise","unexpected","shock","crash","collapse","disaster"]}},1836:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{X:()=>l});var o=a(8159),s=a(1674),r=a(4777),i=e([o,r]);async function l(e){if(console.log(`🤖 Analyzing ${e.contracts.length} contracts with AI (via Vercel AI Gateway)...`),0===e.contracts.length)return{selectedContracts:[],totalAllocated:0,strategyNotes:"No qualifying contracts found today."};let t=await (0,r.T)(),a=function(e,t){let a=e.contracts.map((e,t)=>`
${t+1}. Market ID: ${e.market_id}
   Question: ${e.question}
   Current Odds: ${(100*e.current_odds).toFixed(2)}%
   Days to Resolution: ${Math.ceil((e.end_date.getTime()-Date.now())/864e5)}
   Liquidity: $${e.liquidity.toFixed(2)}
   Volume (24h): $${(e.volume_24h||0).toFixed(2)}
`).join("\n");return`
${t}

CURRENT SITUATION:
- Bankroll: $${e.currentBankroll.toFixed(2)}
- Daily Budget: $${e.dailyBudget}
- Contracts Available: ${e.contracts.length}

AVAILABLE CONTRACTS:
${a}

Analyze these contracts and select exactly 3 contracts to allocate exactly $${e.dailyBudget} across.

Remember:
- Select up to 3 contracts (1-3).
- Total allocation must be <= $${e.dailyBudget}.
- Minimum $20 per contract, maximum $50 per contract.
- Diversify across uncorrelated events.
- Consider historical patterns from above.
- Higher conviction contracts get larger allocations.
`.trim()}(e,t),n=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${o.O.VERCEL_AI_GATEWAY_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"anthropic/claude-sonnet-4",max_tokens:4e3,messages:[{role:"system",content:s.a},{role:"user",content:a}]})});if(!n.ok){let e=await n.text();throw Error(`Vercel AI Gateway error: ${n.status} ${n.statusText} - ${e}`)}let i=await n.json(),l=i?.choices?.[0]?.message?.content??i?.choices?.[0]?.text??("string"==typeof i?i:"");if(!l||0===l.trim().length)throw Error(`Unexpected response format from Vercel AI Gateway: ${JSON.stringify(i).substring(0,500)}`);let c=function(e,t,a){let n=e,o=e.match(/```json\s*([\s\S]*?)\s*```/)||e.match(/\{[\s\S]*\}/);o&&(n=o[1]||o[0]);try{let e=JSON.parse(n),o=(Array.isArray(e.selected_contracts)?e.selected_contracts:[]).map(e=>{let a=t.find(t=>t.market_id===e.market_id);if(!a)throw Error(`Contract not found: ${e.market_id}`);return{contract:a,allocation:Math.min(Math.max(e.allocation,20),50),confidence:Math.min(Math.max(e.confidence,0),1),reasoning:e.reasoning||"No reasoning provided",riskFactors:e.risk_factors||[]}});o.length>3&&(o=o.slice(0,3));let s=o.reduce((e,t)=>e+t.allocation,0);if(s>a&&s>0){let e=a/s,t=(o=o.map(t=>({...t,allocation:Math.round(t.allocation*e*100)/100}))).reduce((e,t)=>e+t.allocation,0);t>a&&o.length>0&&(o[o.length-1].allocation-=t-a,o[o.length-1].allocation=Math.max(0,Math.round(100*o[o.length-1].allocation)/100))}return{selectedContracts:o,totalAllocated:o.reduce((e,t)=>e+t.allocation,0),strategyNotes:e.strategy_notes||"No strategy notes"}}catch(t){throw console.error("Failed to parse AI response:",t),console.error("Response text:",e),Error(`Failed to parse AI response: ${t.message}`)}}(l,e.contracts,e.dailyBudget);return console.log(`   ✅ AI selected ${c.selectedContracts.length} contracts`),console.log(`   💰 Total allocation: $${c.totalAllocated.toFixed(2)}`),c}[o,r]=i.then?(await i)():i,n()}catch(e){n(e)}})},4777:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{T:()=>r});var o=a(3435),s=e([o]);async function r(){let e=(await (0,o.lv)(100)).filter(e=>"open"!==e.status);if(0===e.length)return"No historical trades yet. This is a fresh start.";let t=0===e.length?0:e.filter(e=>"won"===e.status).length/e.length,a=i(e),n=e.reduce((e,t)=>e+(t.pnl||0),0),s=e.filter(e=>"won"===e.status),r=e.filter(e=>"lost"===e.status||"stopped"===e.status),c=function(e,t){let a=[],n=t.filter(e=>e.ai_confidence>=.9),o=n.filter(e=>"won"===e.status);n.length>0&&a.push({pattern:"Very High Confidence (≥90%)",winRate:o.length/n.length,avgROI:i(o),example:o[0]?.ai_reasoning?.substring(0,80)});let s=t.filter(e=>e.ai_confidence>=.85&&e.ai_confidence<.9),r=s.filter(e=>"won"===e.status);s.length>0&&a.push({pattern:"High Confidence (85-90%)",winRate:r.length/s.length,avgROI:i(r),example:r[0]?.ai_reasoning?.substring(0,80)});let l=t.filter(e=>{let t=e.contract?.end_date?new Date(e.contract.end_date):null;return!!t&&(t.getTime()-new Date(e.executed_at).getTime())/864e5<=1}),c=l.filter(e=>"won"===e.status);l.length>0&&a.push({pattern:"Short-term Contracts (≤1 day to resolution)",winRate:c.length/l.length,avgROI:i(c),example:c[0]?.contract?.question?.substring(0,80)});let d=t.filter(e=>e.entry_odds>=.92),u=d.filter(e=>"won"===e.status);return d.length>0&&a.push({pattern:"Very High Entry Odds (≥92%)",winRate:u.length/d.length,avgROI:i(u),example:u[0]?.ai_reasoning?.substring(0,80)}),a.sort((e,t)=>t.winRate-e.winRate)}(0,e),d=function(e){let t=[];if(0===e.length)return t;let a=e.filter(e=>e.ai_confidence>=.9);a.length>0&&t.push({pattern:"Overconfident Trades (≥90% confidence that lost)",count:a.length,totalLoss:a.reduce((e,t)=>e+Math.abs(t.pnl||0),0),avgLoss:a.reduce((e,t)=>e+Math.abs(t.pnl||0),0)/a.length,example:a[0]?.ai_reasoning?.substring(0,80)});let n=e.filter(e=>{let t=e.contract?.end_date?new Date(e.contract.end_date):null;return!!t&&(t.getTime()-new Date(e.executed_at).getTime())/864e5>1.5});n.length>0&&t.push({pattern:"Longer-term Contracts (>1.5 days) that Lost",count:n.length,totalLoss:n.reduce((e,t)=>e+Math.abs(t.pnl||0),0),avgLoss:n.reduce((e,t)=>e+Math.abs(t.pnl||0),0)/n.length,example:n[0]?.ai_reasoning?.substring(0,80)});let o=e.filter(e=>"stopped"===e.status);o.length>0&&t.push({pattern:"Stop Loss Triggered",count:o.length,totalLoss:o.reduce((e,t)=>e+Math.abs(t.pnl||0),0),avgLoss:o.reduce((e,t)=>e+Math.abs(t.pnl||0),0)/o.length,example:o[0]?.ai_reasoning?.substring(0,80)});let s=e.filter(e=>e.entry_odds>=.85&&e.entry_odds<.92);return s.length>0&&t.push({pattern:"Mid-range Odds (85-92%) that Lost",count:s.length,totalLoss:s.reduce((e,t)=>e+Math.abs(t.pnl||0),0),avgLoss:s.reduce((e,t)=>e+Math.abs(t.pnl||0),0)/s.length,example:s[0]?.ai_reasoning?.substring(0,80)}),t.sort((e,t)=>t.totalLoss-e.totalLoss)}(r),u=function(e){let t=new Map;return e.forEach(e=>{let a=e.contract?.question||"Unknown",n="Other";a.toLowerCase().includes("election")||a.toLowerCase().includes("vote")?n="Elections/Politics":a.toLowerCase().includes("earnings")||a.toLowerCase().includes("stock")?n="Earnings/Stocks":a.toLowerCase().includes("data")||a.toLowerCase().includes("release")?n="Data Releases":a.toLowerCase().includes("deadline")||a.toLowerCase().includes("date")?n="Time-based":(a.toLowerCase().includes("approval")||a.toLowerCase().includes("approve"))&&(n="Approval/Regulatory"),t.has(n)||t.set(n,{wins:0,losses:0});let o=t.get(n);"won"===e.status?o.wins++:("lost"===e.status||"stopped"===e.status)&&o.losses++}),Array.from(t.entries()).map(([e,t])=>({type:e,wins:t.wins,losses:t.losses,winRate:t.wins+t.losses>0?t.wins/(t.wins+t.losses):0})).sort((e,t)=>t.wins+t.losses-(e.wins+e.losses))}(e),h=[{min:.9,max:1,label:"90-100%"},{min:.85,max:.9,label:"85-90%"},{min:.8,max:.85,label:"80-85%"},{min:.7,max:.8,label:"70-80%"}].map(t=>{let a=e.filter(e=>e.ai_confidence>=t.min&&e.ai_confidence<t.max),n=a.filter(e=>"won"===e.status),o=a.filter(e=>"lost"===e.status||"stopped"===e.status);return{range:t.label,wins:n.length,losses:o.length,winRate:a.length>0?n.length/a.length:0,avgROI:i(a)}}),g=function(e){if(0===e.length)return"";let t=e.map(e=>{let t="won"===e.status?"✅ WIN":"lost"===e.status?"❌ LOSS":"⚠️ STOPPED",a=e.pnl?e.pnl>=0?`+$${e.pnl.toFixed(2)}`:`-$${Math.abs(e.pnl).toFixed(2)}`:"N/A",n=e.pnl&&e.position_size?`${(e.pnl/e.position_size*100).toFixed(1)}%`:"N/A",o=`${(100*e.ai_confidence).toFixed(0)}%`,s=new Date(e.executed_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}),r=e.contract?.question||"N/A",i=e.ai_reasoning||"No reasoning recorded";return`
${t} | ${s} | Confidence: ${o} | P&L: ${a} (${n})
Contract: ${r.substring(0,80)}${r.length>80?"...":""}
Your Reasoning: ${i.substring(0,150)}${i.length>150?"...":""}
Entry Odds: ${(100*e.entry_odds).toFixed(1)}% | Size: $${e.position_size.toFixed(2)}
---`}).join("\n");return`
RECENT TRADE HISTORY (Last ${e.length} trades - learn from these):
${t}

`}(e.slice(0,30));return`
HISTORICAL PERFORMANCE SUMMARY (Last ${e.length} resolved trades):
- Win Rate: ${(100*t).toFixed(1)}% (${s.length} wins, ${r.length} losses)
- Average ROI: ${(100*a).toFixed(2)}%
- Total P&L: $${n.toFixed(2)}
- Average Win: $${s.length>0?(s.reduce((e,t)=>e+(t.pnl||0),0)/s.length).toFixed(2):"0.00"}
- Average Loss: $${r.length>0?(r.reduce((e,t)=>e+Math.abs(t.pnl||0),0)/r.length).toFixed(2):"0.00"}

${g}

WINNING PATTERNS (REPEAT THESE):
${c.map(e=>`- ${e.pattern}: ${(100*e.winRate).toFixed(1)}% win rate, avg ROI ${(100*e.avgROI).toFixed(1)}%`).join("\n")}
${c.length>0?"\nKey Success Factors:\n"+c.slice(0,3).map(e=>`  • ${e.example||e.pattern}`).join("\n"):""}

LOSING PATTERNS (AVOID THESE):
${d.map(e=>`- ${e.pattern}: ${e.count} losses, total loss $${Math.abs(e.totalLoss).toFixed(2)}, avg loss $${Math.abs(e.avgLoss).toFixed(2)}`).join("\n")}
${d.length>0?"\nCommon Mistakes:\n"+d.slice(0,3).map(e=>`  • ${e.example||e.pattern}`).join("\n"):""}

CONTRACT TYPE PERFORMANCE:
${u.map(e=>`- ${e.type}: ${e.wins}W/${e.losses}L (${(100*e.winRate).toFixed(1)}% win rate)`).join("\n")}

CONFIDENCE LEVEL ANALYSIS:
${h.map(e=>`- ${e.range}: ${e.wins}W/${e.losses}L (${(100*e.winRate).toFixed(1)}% win rate, ${e.wins>0||e.losses>0?`avg ROI ${(100*e.avgROI).toFixed(1)}%`:"N/A"})`).join("\n")}

LESSONS LEARNED:
${(function(e,t){let a=[];if(e.length>0&&t.length>0){let n=e.reduce((e,t)=>e+t.ai_confidence,0)/e.length,o=t.reduce((e,t)=>e+t.ai_confidence,0)/t.length;n<o&&a.push('Lower confidence trades actually performed better - be more cautious with "sure things"');let s=e.map(e=>{let t=e.contract?.end_date?new Date(e.contract.end_date):null;return t?(t.getTime()-new Date(e.executed_at).getTime())/864e5:null}).filter(e=>null!==e),r=t.map(e=>{let t=e.contract?.end_date?new Date(e.contract.end_date):null;return t?(t.getTime()-new Date(e.executed_at).getTime())/864e5:null}).filter(e=>null!==e);if(s.length>0&&r.length>0){let e=s.reduce((e,t)=>e+t,0)/s.length,t=r.reduce((e,t)=>e+t,0)/r.length;e<t&&a.push(`Shorter-term contracts (avg ${e.toFixed(1)} days) performed better than longer-term (avg ${t.toFixed(1)} days)`)}}let n=l(e.map(e=>e.ai_reasoning||"").join(" ")),o=l(t.map(e=>e.ai_reasoning||"").join(" ")),s=n.filter(e=>!o.includes(e));return s.length>0&&a.push(`Winning trades often mentioned: ${s.slice(0,3).join(", ")}`),0===a.length&&a.push("Continue to be conservative and focus on high-probability, low-variance contracts"),a.map((e,t)=>`${t+1}. ${e}`).join("\n")})(s,r)}
  `.trim()}function i(e){if(0===e.length)return 0;let t=e.filter(e=>null!==e.pnl&&e.position_size>0);return 0===t.length?0:t.reduce((e,t)=>e+t.pnl/t.position_size,0)/t.length}function l(e){let t=e.toLowerCase();return["clear","objective","deadline","scheduled","guaranteed","certain","volatile","unpredictable","surprise","uncertain","risk","black swan"].filter(e=>t.includes(e))}o=(s.then?(await s)():s)[0],n()}catch(e){n(e)}})},1674:(e,t,a)=>{a.d(t,{a:()=>n});let n=`
You are an expert Kalshi trader analyzing high-probability, low-variance contracts.

Your goal: Select up to 3 best contracts from the provided list and allocate up to $100 total across them.

CRITICAL EXCLUSION RULES - AVOID THESE AT ALL COSTS:

1. SPORTS BETTING & ATHLETICS
   - NEVER select contracts about:
     * Individual game outcomes (wins, scores, point totals)
     * Player statistics (points, rebounds, yards, etc.)
     * Team performance in games
     * Athletic competitions or tournaments
   - REASON: High variability, unpredictable outcomes, and potential for black swan events (injuries, upsets, weather)

2. HIGH-VARIABILITY EVENTS
   - AVOID contracts involving:
     * Human behavior predictions (voting patterns, consumer sentiment shifts)
     * Weather-dependent outcomes (unless very short-term and stable)
     * Celebrity/entertainment industry events
     * Social media metrics or viral trends
     * Unpredictable market movements
   - REASON: High variance leads to unexpected losses even at 85%+ odds

3. BLACK SWAN POTENTIAL
   - REJECT contracts with:
     * Binary political events (elections, legislation votes) unless extremely short-term
     * Surprise announcement potential (regulatory, policy, corporate)
     * Geopolitical events (unless clearly defined and time-bound)
     * Market crashes or systemic shocks
     * "Surprise" or "unexpected" event language in the question
   - REASON: Even 90%+ odds can fail catastrophically with black swan events

PREFERRED CONTRACT TYPES (Low Variance, Predictable):

1. TIME-BASED EVENTS
   - Contract expiration dates
   - Scheduled releases (product launches with fixed dates)
   - Calendar-based outcomes (holidays, deadlines)

2. DATA RELEASES (High Reliability)
   - Economic indicators with scheduled release dates
   - Corporate earnings announcements (if date is certain)
   - Census or official statistics releases
   - NOTE: Only if release date is guaranteed and objective

3. TECHNICAL OUTCOMES
   - Infrastructure completion dates (with clear criteria)
   - Software/system milestones (if objectively measurable)
   - Certification or approval processes (if timeline is defined)

4. STRUCTURED PROCESSES
   - Legal filing deadlines
   - Regulatory review periods
   - Scheduled meetings or hearings (with clear outcomes)

ANALYSIS FRAMEWORK:

1. CONTRACT QUALITY
   - Is the resolution criteria 100% objective and unambiguous?
   - Is there ZERO room for interpretation or dispute?
   - Is the outcome determined by a single, verifiable data source?
   - What's the time to resolution? (prefer <24h, but quality > speed)

2. VARIANCE ASSESSMENT
   - Could this outcome be affected by human error or bias?
   - Is there potential for last-minute changes or cancellations?
   - Could weather, accidents, or random events derail this?
   - Is the resolution mechanism completely outside our control?
   - AVOID if answer to any is "yes"

3. BLACK SWAN PROTECTION
   - What's the worst-case scenario? Could it happen?
   - Is there any information asymmetry that could hurt us?
   - Could someone "game" or manipulate this outcome?
   - Are there correlated risks with other positions?
   - If any red flags, PASS immediately

4. ODDS VALIDATION
   - Why is the market pricing this at 85-98% vs 100%?
   - Is the remaining uncertainty justified, or are we missing something?
   - If odds are "too good to be true," they probably are
   - Markets are usually efficient - if it's 95%, there's a 5% reason

5. HISTORICAL LEARNING (CRITICAL - LEARN FROM YOUR PAST)
   You will receive detailed historical trade data including:
   - Individual trade results (✅ WIN / ❌ LOSS / ⚠️ STOPPED) with your previous reasoning
   - Winning patterns and what worked (repeat these!)
   - Losing patterns and what failed (avoid these!)
   - Contract type performance analysis
   - Confidence level accuracy analysis
   - Specific lessons learned from your mistakes
   
   USE THIS DATA TO:
   - Identify contracts similar to your past winners - FAVOR THESE
   - Avoid contracts similar to your past losers - REJECT THESE
   - Adjust your confidence based on historical accuracy (if 90% confidence trades keep losing, lower your confidence)
   - Learn from your reasoning mistakes (if certain reasoning led to losses, avoid that logic)
   - Adapt your strategy based on what actually worked vs what you thought would work
   
   CRITICAL: If a contract type or characteristic consistently lost money in your history, DO NOT select similar contracts even if they look good on paper.
   CRITICAL: If a contract type or characteristic consistently won, PREFER similar contracts.

6. POSITION SIZING
   Allocate up to $100 across up to 3 contracts:
   - Higher conviction = larger allocation (up to $50)
   - Diversify across completely uncorrelated events
   - Minimum $20 per contract (don't over-diversify)
   - Maximum $50 per contract (preserve capital)
   - If you can't find 2-3 truly high-quality contracts, select 1 and allocate less

RESPONSE FORMAT (JSON):
{
  "selected_contracts": [
    {
      "market_id": "string",
      "allocation": number,
      "confidence": 0-1,
      "reasoning": "2-3 sentences explaining why this is LOW-VARIANCE and SAFE",
      "risk_factors": ["factor1", "factor2"]
    }
  ],
  "total_allocated": number,
  "strategy_notes": "Brief summary of today's conservative approach"
}

CRITICAL MANDATES:
- CONSERVATIVE > AGGRESSIVE. Missing a trade is better than taking a bad one.
- QUALITY > QUANTITY. One excellent contract beats three mediocre ones.
- STABILITY > OPPORTUNITY. Avoid anything that could surprise you.
- If uncertain, PASS. You can always trade tomorrow.
- Sports, weather, and human behavior are your enemies. Avoid them.
- Black swans are rare but catastrophic. Be paranoid about them.
- Markets are efficient. If something seems off, it is.

Remember: Your goal is steady, predictable returns, not high-risk gambles. Every contract should be so clear and objective that resolution is never in doubt.
`},8231:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{O:()=>i});var o=a(1309),s=a(8159),r=e([o,s]);[o,s]=r.then?(await r)():r;let i=(0,o.createClient)(s.O.SUPABASE_URL,s.O.SUPABASE_KEY);n()}catch(e){n(e)}})},3435:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{$r:()=>l,FC:()=>m,Jg:()=>u,Of:()=>f,Pq:()=>c,Xb:()=>d,Xx:()=>p,dY:()=>g,fT:()=>y,lv:()=>i,mo:()=>r,sl:()=>h,zC:()=>_});var o=a(8231),s=e([o]);async function r(){let{data:e,error:t}=await o.O.from("trades").select(`
      *,
      contract:contracts(*)
    `).eq("status","open").order("executed_at",{ascending:!1});if(t)throw t;return e}async function i(e=50){let{data:t,error:a}=await o.O.from("trades").select(`
      *,
      contract:contracts(*)
    `).order("executed_at",{ascending:!1}).limit(e);if(a)throw a;return t}async function l(){let e=new Date;e.setHours(0,0,0,0);let{data:t,error:a}=await o.O.from("trades").select(`
      *,
      contract:contracts(*)
    `).gte("executed_at",e.toISOString()).order("executed_at",{ascending:!1});if(a)throw a;return t}async function c(e,t){let{data:a,error:n}=await o.O.from("trades").select(`
      *,
      contract:contracts(*)
    `).gte("executed_at",e.toISOString()).lte("executed_at",t.toISOString()).order("executed_at",{ascending:!1});if(n)throw n;return a}async function d(e){let{data:t,error:a}=await o.O.from("trades").insert({...e,status:"open",executed_at:new Date().toISOString()}).select(`
      *,
      contract:contracts(*)
    `).single();if(a)throw a;return t}async function u(e,t){let{data:a,error:n}=await o.O.from("trades").update(t).eq("id",e).select(`
      *,
      contract:contracts(*)
    `).single();if(n)throw n;return a}async function h(){return(await r()).map(e=>({trade:e,current_odds:e.entry_odds,unrealized_pnl:0,unrealized_pnl_pct:0}))}async function g(){let{data:e}=await o.O.from("performance_metrics").select("bankroll").order("date",{ascending:!1}).limit(1).single();return e?.bankroll||Number(process.env.INITIAL_BANKROLL)||1e3}async function m(){return Number(process.env.INITIAL_BANKROLL)||1e3}async function p(e){let{data:t}=await o.O.from("performance_metrics").select("bankroll").lte("date",e.toISOString()).order("date",{ascending:!1}).limit(1).single();return t?.bankroll||Number(process.env.INITIAL_BANKROLL)||1e3}async function f(){let e=await g(),t=(await h()).reduce((e,t)=>e+t.trade.position_size,0);return e-t}async function y(){let{data:e,error:t}=await o.O.from("notification_preferences").select("*").eq("user_id","default").single();if(t&&"PGRST116"!==t.code)throw t;return e||{enabled:!1}}async function _(e){let t=new Date(Date.now()-36e5*e),{data:a,error:n}=await o.O.from("stop_loss_events").select(`
      *,
      trade:trades(
        *,
        contract:contracts(*)
      )
    `).gte("executed_at",t.toISOString()).order("executed_at",{ascending:!1});if(n)throw n;return a}o=(s.then?(await s)():s)[0],n()}catch(e){n(e)}})},5526:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{A0:()=>c,US:()=>i});var o=a(8231),s=a(913),r=e([o,s]);async function i(){let e=new Date(Date.now()-72e5),{data:t,error:a}=await o.O.from("contracts").select("*").gte("discovered_at",e.toISOString()).eq("resolved",!1).order("discovered_at",{ascending:!1});return a?(console.error("Error fetching cached markets:",a),[]):t&&0!==t.length?t.map(e=>({market_id:e.market_id,question:e.question,end_date:new Date(e.end_date),yes_odds:parseFloat(e.current_odds.toString()),no_odds:1-parseFloat(e.current_odds.toString()),liquidity:parseFloat(e.liquidity?.toString()||"0"),volume_24h:parseFloat(e.volume_24h?.toString()||"0"),resolved:e.resolved||!1,category:e.category||void 0,outcome:e.outcome||void 0,final_odds:e.final_odds?parseFloat(e.final_odds.toString()):void 0,resolved_at:e.resolved_at?new Date(e.resolved_at):void 0})):[]}async function l(e){if(0===e.length)return;console.log(`💾 Caching ${e.length} markets to database...`);let t=e.map(e=>({market_id:e.market_id,question:e.question,end_date:e.end_date.toISOString(),current_odds:e.yes_odds,category:e.category||null,liquidity:e.liquidity||0,volume_24h:e.volume_24h||0,resolved:e.resolved||!1,outcome:e.outcome||null,final_odds:e.final_odds||null,resolved_at:e.resolved_at?.toISOString()||null,discovered_at:new Date().toISOString()}));for(let e=0;e<t.length;e+=100){let a=t.slice(e,e+100),{error:n}=await o.O.from("contracts").upsert(a,{onConflict:"market_id",ignoreDuplicates:!1});n?console.error(`Error caching markets chunk ${e/100+1}:`,n):console.log(`   ✅ Cached chunk ${e/100+1}/${Math.ceil(t.length/100)} (${a.length} markets)`)}console.log(`✅ Cached ${e.length} markets successfully`)}async function c(e){console.log("\uD83D\uDD04 Refreshing market page...",e?`(cursor: ${e.substring(0,20)}...)`:"(first page)");let t=e?`/markets?status=open&cursor=${e}`:"/markets?status=open";try{let e=await fetch(`${s.K3}${t}`,{method:"GET",headers:(0,s.U)("GET",t)});if(!e.ok){if(429===e.status){let t=e.headers.get("Retry-After"),a=t?1e3*parseInt(t):5e3;throw Error(`RATE_LIMITED:${a}`)}let t=await e.text();throw Error(`Kalshi API error: ${e.status} ${e.statusText} - ${t}`)}let a=await e.json(),n=a.markets||[],o=a.cursor||null,r=n.map(e=>{let t;let a=(0,s.TN)(e);try{t=new Date(e.expiration_time||e.expirationTime||e.end_date),isNaN(t.getTime())&&(t=new Date(Date.now()+6048e5))}catch(e){t=new Date(Date.now()+6048e5)}return{market_id:e.ticker||e.market_id||e.id,question:e.title||e.question||e.subtitle||"N/A",end_date:t,yes_odds:null!==a?a/100:0,no_odds:null!==a?(100-a)/100:0,liquidity:0,volume_24h:parseFloat(e.volume||e.volume_24h||0),resolved:"closed"===e.status||"resolved"===e.status,category:e.category||void 0,outcome:e.result?"yes"===e.result?"YES":"NO":void 0,final_odds:e.result_price?parseFloat(e.result_price)/100:void 0,resolved_at:e.settlement_time?new Date(e.settlement_time):void 0}});return await l(r),console.log(`   ✅ Cached ${r.length} markets. Next cursor: ${o?"yes":"no"}`),{markets:r,nextCursor:o,isComplete:!o||0===n.length}}catch(e){if(e.message.startsWith("RATE_LIMITED:")){let t=parseInt(e.message.split(":")[1]);throw Error(`Rate limited. Wait ${t}ms`)}throw e}}[o,s]=r.then?(await r)():r,n()}catch(e){n(e)}})},7372:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{w:()=>l});var o=a(913),s=a(5526),r=a(3365),i=e([o,s]);async function l(e={minOdds:r.U.MIN_ODDS,maxOdds:r.U.MAX_ODDS,maxDaysToResolution:r.U.MAX_DAYS_TO_RESOLUTION,minLiquidity:r.U.MIN_LIQUIDITY,excludeCategories:r.U.EXCLUDE_CATEGORIES,excludeKeywords:r.U.EXCLUDE_KEYWORDS}){console.log("\uD83D\uDD0D Scanning Kalshi for high-conviction contracts..."),console.log(`   Criteria: ${100*e.minOdds}%-${100*e.maxOdds}% odds, <${e.maxDaysToResolution} days, >$${e.minLiquidity} liquidity`);let t=await (0,s.US)();if(console.log(`   ✅ Retrieved ${t.length} markets from cache`),0===t.length)return console.warn("⚠️ No cached markets found. Market refresh cron may not have run yet."),[];let a=[];for(let n of t){let t=100*n.yes_odds;if(t<100*e.minOdds&&t>(1-e.maxOdds)*100)continue;let s=(0,o.YI)(n.end_date);if(s>e.maxDaysToResolution||s<0||n.resolved||n.category&&e.excludeCategories?.includes(n.category))continue;let r=n.question.toLowerCase();(e.excludeKeywords||[]).map(e=>e.toLowerCase()).some(e=>r.includes(e))||a.push(n)}console.log(`   📊 Found ${a.length} high-conviction candidates after filtering`);let n=[],i=[];for(let t=0;t<a.length;t++){let s=a[t];try{let{liquidity:r,side:i}=await (0,o.Z9)(s.market_id);if(r<e.minLiquidity)continue;let l={id:"",market_id:s.market_id,question:s.question,end_date:s.end_date,current_odds:s.yes_odds,liquidity:r,volume_24h:s.volume_24h,category:s.category,discovered_at:new Date};n.push(l),((t+1)%10==0||t+1===a.length)&&console.log(`   📈 Enriched ${t+1}/${a.length} candidates... (${n.length} passed liquidity filter)`)}catch(e){i.push(`${s.market_id}: ${e.message}`);continue}}return i.length>0&&(console.warn(`   ⚠️ ${i.length} markets failed enrichment (likely resolved or inactive)`),i.length<=5&&i.forEach(e=>console.warn(`      ${e}`))),n.sort((e,t)=>(t.liquidity||0)-(e.liquidity||0)),console.log(`   ✅ Found ${n.length} qualifying contracts with sufficient liquidity`),n}[o,s]=i.then?(await i)():i,n()}catch(e){n(e)}})}};