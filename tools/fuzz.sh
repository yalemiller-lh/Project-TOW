#!/bin/sh
# The full fuzz (SEEDS games of every configuration in test-playthrough.mjs), one process per
# configuration in parallel. Usage: sh tools/fuzz.sh [seeds=8] [out=/tmp/fuzz]. Prints PASS or FAIL.
SEEDS=${1:-8}; OUT=${2:-/tmp/fuzz}; cd "$(dirname "$0")/.." || exit 1
COUNT=$(node -e "const t=require('fs').readFileSync('test-playthrough.mjs','utf8');const m=t.match(/for\(const \[index,\[opponent,format,points,extra\]\]of (\[.*\])\.entries\(\)\)/);console.log(eval(m[1]).length)")
i=0; while [ $i -lt "$COUNT" ]; do SEEDS=$SEEDS CONFIG=$i node test-playthrough.mjs > "$OUT.$i.txt" 2>&1 & i=$((i+1)); done; wait
FAIL=0; i=0; GAMES=0
while [ $i -lt "$COUNT" ]; do
 if grep -q "^PASS" "$OUT.$i.txt"; then GAMES=$((GAMES+$(grep -o "PASS [0-9]*" "$OUT.$i.txt" | grep -o "[0-9]*"))); else FAIL=1; echo "FAIL configuration $i:"; tail -5 "$OUT.$i.txt"; fi
 i=$((i+1)); done
if [ $FAIL -eq 0 ]; then echo "PASS $GAMES seeded games in $COUNT configurations"; else exit 1; fi
