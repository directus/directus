#!/bin/bash
# run.sh <tag> <db> <throttle> <rounds> <variants...>  Interleaves variants one run at a time (A B A B).
B=~/perfbench-fm; cd $B; export CHROME=$HOME/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome
TAG=$1; DB=$2; T=$3; ROUNDS=$4; shift 4
R=$B/results/raw; mkdir -p $R
API=$B/repo/api
start_api() { rm -rf $API/../app/dist && cp -R $B/dists/$1 $API/../app/dist
  (cd $API && CONFIG_PATH=$B/api.env DB_FILENAME=$B/$DB.run.db nohup mise exec node@24 -- node dist/cli/run.js start > $B/api.log 2>&1 & echo $! > $B/api.pid)
  for i in $(seq 1 120); do sleep 0.5; curl -sf http://127.0.0.1:8175/server/ping >/dev/null && return 0; done; echo "API failed"; tail $B/api.log; exit 1; }
stop_api() { pkill -f "DB_FILENAME=$B" 2>/dev/null; kill $(cat $B/api.pid) 2>/dev/null; fuser -k 8175/tcp >/dev/null 2>&1; sleep 1; }
echo "start $TAG $(date +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
for k in $(seq 1 $ROUNDS); do for v in "$@"; do
  start_api $v
  mise exec node@24 -- node bench.mjs $v 1 1000,25 $T > $R/$TAG-$v-table-x$T-$k.json 2>> $R/$TAG.log || echo "FAILED table $v r$k"
  mise exec node@24 -- node form.mjs $v 1 $T > $R/$TAG-$v-form-x$T-$k.json 2>> $R/$TAG.log || echo "FAILED form $v r$k"
  stop_api
done; echo "round $k $(date +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"; done
for v in "$@"; do for kind in table form; do
  node -e 'const fs=require("fs");const out=[];for(const f of process.argv.slice(1)){const t=fs.readFileSync(f,"utf8");if(t.trim())out.push(...JSON.parse(t).map((r,i)=>({...r,run:out.length+i})))};console.log(JSON.stringify(out))' $R/$TAG-$v-$kind-x$T-*.json > $B/results/$TAG-$v-$kind-x$T.json
done; done
