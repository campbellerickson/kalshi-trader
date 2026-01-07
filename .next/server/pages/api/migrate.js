"use strict";(()=>{var t={};t.id=220,t.ids=[220],t.modules={145:t=>{t.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},1309:t=>{t.exports=import("@supabase/supabase-js")},9926:t=>{t.exports=import("zod")},6249:(t,e)=>{Object.defineProperty(e,"l",{enumerable:!0,get:function(){return function t(e,r){return r in e?e[r]:"then"in e&&"function"==typeof e.then?e.then(e=>t(e,r)):"function"==typeof e&&"default"===r?e:void 0}}})},5694:(t,e,r)=>{r.a(t,async(t,a)=>{try{r.r(e),r.d(e,{config:()=>A,default:()=>_,routeModule:()=>l});var n=r(1802),s=r(7153),i=r(6249),o=r(1361),E=t([o]);o=(E.then?(await E)():E)[0];let _=(0,i.l)(o,"default"),A=(0,i.l)(o,"config"),l=new n.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/migrate",pathname:"/api/migrate",bundlePath:"",filename:""},userland:o});a()}catch(t){a(t)}})},8159:(t,e,r)=>{r.a(t,async(t,a)=>{try{r.d(e,{O:()=>o});var n=r(9926),s=t([n]);let i=(n=(s.then?(await s)():s)[0]).z.object({KALSHI_API_ID:n.z.string().min(1),KALSHI_PRIVATE_KEY:n.z.string().min(1),VERCEL_AI_GATEWAY_KEY:n.z.string().min(1).optional(),AI_GATEWAY_API_KEY:n.z.string().min(1).optional(),VERCEL_OIDC_TOKEN:n.z.string().min(1).optional(),SUPABASE_URL:n.z.string().url(),SUPABASE_KEY:n.z.string().min(1).optional(),SUPABASE_SERVICE_ROLE_KEY:n.z.string().min(1).optional(),CRON_SECRET:n.z.string().min(1),DAILY_BUDGET:n.z.string().transform(Number).default("100"),MIN_ODDS:n.z.string().transform(Number).default("0.85"),MAX_ODDS:n.z.string().transform(Number).default("0.98"),MAX_DAYS_TO_RESOLUTION:n.z.string().transform(Number).default("2"),MIN_LIQUIDITY:n.z.string().transform(Number).default("2000"),DRY_RUN:n.z.string().transform(t=>"true"===t).default("false"),INITIAL_BANKROLL:n.z.string().transform(Number).default("1000")}),o=function(){try{let t=i.parse(process.env),e=t.SUPABASE_KEY||t.SUPABASE_SERVICE_ROLE_KEY;if(!e)throw Error("Missing SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)");let r=t.VERCEL_AI_GATEWAY_KEY||t.AI_GATEWAY_API_KEY||t.VERCEL_OIDC_TOKEN;if(!r)throw Error("Missing VERCEL_AI_GATEWAY_KEY (or AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN)");return{...t,SUPABASE_KEY:e,VERCEL_AI_GATEWAY_KEY:r}}catch(t){if(t instanceof n.z.ZodError){let e=t.errors.map(t=>t.path.join(".")).join(", ");throw Error(`Missing or invalid environment variables: ${e}`)}throw t}}();a()}catch(t){a(t)}})},8231:(t,e,r)=>{r.a(t,async(t,a)=>{try{r.d(e,{O:()=>o});var n=r(1309),s=r(8159),i=t([n,s]);[n,s]=i.then?(await i)():i;let o=(0,n.createClient)(s.O.SUPABASE_URL,s.O.SUPABASE_KEY);a()}catch(t){a(t)}})},1361:(t,e,r)=>{r.a(t,async(t,a)=>{try{r.r(e),r.d(e,{default:()=>i});var n=r(8231),s=t([n]);async function i(t,e){if(t.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`)return e.status(401).json({error:"Unauthorized"});if("POST"!==t.method)return e.status(405).json({error:"Method not allowed"});try{let{error:t}=await n.O.from("monthly_analysis").select("id").limit(1);if(!t)return e.status(200).json({message:"Table already exists",table:"monthly_analysis"});let r=`
-- Migration: Monthly Market Analysis Table
CREATE TABLE IF NOT EXISTS monthly_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year DATE NOT NULL UNIQUE,
  total_trades INT DEFAULT 0,
  total_invested DECIMAL(10,2) DEFAULT 0,
  total_pnl DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,4),
  avg_roi DECIMAL(5,2),
  market_type_analysis JSONB,
  series_analysis JSONB,
  top_market_types JSONB,
  top_series_ids JSONB,
  worst_market_types JSONB,
  worst_series_ids JSONB,
  insights TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_analysis_month_year ON monthly_analysis(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_analysis_created_at ON monthly_analysis(created_at);
`;return e.status(200).json({message:"Table does not exist. Run this SQL in Supabase Dashboard:",sql:r,instructions:["1. Go to Supabase Dashboard → SQL Editor","2. Paste the SQL above",'3. Click "Run"',"4. Refresh this endpoint to verify"]})}catch(t){return console.error("Migration check error:",t),e.status(500).json({error:t.message,hint:"Run the migration SQL in Supabase Dashboard → SQL Editor"})}}n=(s.then?(await s)():s)[0],a()}catch(t){a(t)}})},7153:(t,e)=>{var r;Object.defineProperty(e,"x",{enumerable:!0,get:function(){return r}}),function(t){t.PAGES="PAGES",t.PAGES_API="PAGES_API",t.APP_PAGE="APP_PAGE",t.APP_ROUTE="APP_ROUTE"}(r||(r={}))},1802:(t,e,r)=>{t.exports=r(145)}};var e=require("../../webpack-api-runtime.js");e.C(t);var r=e(e.s=5694);module.exports=r})();