#!/usr/bin/env bash
# Usage: bench/run.sh "trade idea" [outfile]
set -euo pipefail
out=${2:-/tmp/redline-run.ndjson}
body=$(node -e 'console.log(JSON.stringify({text:process.argv[1],profile:{accountUsd:5000,maxLeverage:10,maxLeverageIntoEvent:3,maxRiskPerTradePct:2,maxWeekendLeverage:5,custom:[]}}))' "$1")
curl -sN -m 290 -X POST "${REDLINE_URL:-http://localhost:3100}/api/redline" -H 'content-type: application/json' -d "$body" > "$out"
node -e '
const L=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
for (const e of L){
  if(e.type==="step") console.log("STEP",e.status.padEnd(7),e.id.padEnd(12),String(e.ms??"").padStart(6),e.detail??"");
  else if(e.type==="verdict") console.log("VERDICT",JSON.stringify(e,null,1));
  else if(e.type==="error") console.log("ERROR",e.message);
  else if(e.type==="debate") console.log("DEBATE",e.turn.role,"|",e.turn.stance);
  else if(e.type==="rules") console.log("RULES",JSON.stringify(e.violations));
  else if(e.type==="evidence") console.log("EVIDENCE",e.evidence.length,"items");
  else console.log(e.type);
}' "$out"
