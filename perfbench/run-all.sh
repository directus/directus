#!/bin/bash
mkdir -p /tmp/perfbench-results
cd "$(dirname "$0")"
for v in baseline A B AB Bfull; do
  ./switch.sh $v || exit 1
  node bench.mjs $v 5 1000,25 1 > /tmp/perfbench-results/$v-x1.json 2>/tmp/perfbench-results/$v-x1.log || echo "FAILED $v"
  echo "done $v"
done
for v in baseline AB Bfull; do
  ./switch.sh $v || exit 1
  node bench.mjs $v 3 1000,25 4 > /tmp/perfbench-results/$v-x4.json 2>/tmp/perfbench-results/$v-x4.log || echo "FAILED $v x4"
  echo "done $v x4"
done
echo ALLDONE
