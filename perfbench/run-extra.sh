#!/bin/bash
cd "$(dirname "$0")"
for v in baseline Bfull B; do
  ./switch.sh $v || exit 1
  node vis.mjs $v
  [ $v = B ] && continue
  node select.mjs $v 5 1 > /tmp/perfbench-results/select-$v-x1.json 2>/tmp/perfbench-results/select-$v-x1.log || echo "FAILED select $v"
  node select.mjs $v 3 4 > /tmp/perfbench-results/select-$v-x4.json 2>/tmp/perfbench-results/select-$v-x4.log || echo "FAILED select $v x4"
  [ $v = baseline ] && node bench.mjs baseline-recheck 3 1000 1 > /tmp/perfbench-results/baseline-recheck-x1.json 2>/dev/null
done
echo EXTRADONE
