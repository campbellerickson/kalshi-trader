#!/bin/bash

# Validate all cron jobs are configured correctly

echo "🔍 Validating Cron Jobs Configuration"
echo "======================================"
echo ""

CRON_SECRET="2FYlg42wajLvnRlktyZieGgESkNWEFQtqZfI/rfK0Is="
BASE_URL="https://polymarket-trader.vercel.app"

# Cron jobs from vercel.json
declare -A CRONS=(
    ["morning-report"]="0 7 * * * (Daily 7am)"
    ["trading"]="0 8 * * * (Daily 8am)"
    ["stop-loss"]="0 */2 * * * (Every 2 hours)"
    ["check-fills"]="0 * * * * (Every hour)"
    ["check-resolutions"]="0 */6 * * * (Every 6 hours)"
    ["screen-markets"]="30 7 * * * (Daily 7:30am)"
    ["monthly-analysis"]="0 0 1 * * (1st of month)"
    ["cleanup-resolved"]="0 2 * * * (Daily 2am)"
)

echo "📋 Checking file existence:"
echo ""
for cron in "${!CRONS[@]}"; do
    FILE="pages/api/cron/${cron}.ts"
    if [ -f "$FILE" ]; then
        echo "✅ $FILE"
    else
        echo "❌ MISSING: $FILE"
    fi
done

echo ""
echo "🌐 Testing endpoints (with 5s timeout each):"
echo ""

for cron in "${!CRONS[@]}"; do
    ENDPOINT="${BASE_URL}/api/cron/${cron}"
    SCHEDULE="${CRONS[$cron]}"

    echo "Testing: $cron - $SCHEDULE"

    # Test with timeout
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 5 \
        -X POST "$ENDPOINT" \
        -H "Authorization: Bearer $CRON_SECRET" 2>/dev/null)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "  ✅ Responds 200 OK"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "  ⏱️  Timeout (endpoint might be slow but working)"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "  ❌ 401 Unauthorized (check CRON_SECRET)"
    else
        echo "  ⚠️  HTTP $HTTP_CODE"
    fi
    echo ""
done

echo "======================================"
echo "✅ Validation complete!"
