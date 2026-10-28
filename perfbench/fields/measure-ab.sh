#!/bin/bash
# measure-ab.sh <tag> <db> <throttle> <rounds> <variants...>
# Interleaves variants one run at a time (A B A B ...) so machine-load drift hits all of them equally.
# Holds the shared perfbench lock for the session. Output: results/<tag>-<variant>-{table,form}-x<t>.json (merged)
D=${D:-/tmp/perfbench-fields}; mkdir -p $D; S=$(cd "$(dirname "$0")" && pwd); W=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
TAG=$1; DB=$2; T=$3; ROUNDS=$4; shift 4
R=$D/results/raw; mkdir -p $R
until mkdir /tmp/perfbench.lock 2>/dev/null; do sleep 10; done
trap '$S/api.sh stop; rmdir /tmp/perfbench.lock; echo "released $(date +%T)"' EXIT
echo "lock $(date +%T) load $(uptime | sed 's/.*averages: //')"
cd $S
for k in $(seq 1 $ROUNDS); do
	for v in "$@"; do
		rm -rf "$W/app/dist" && cp -R "/tmp/perfbench-dists/$v" "$W/app/dist"
		./api.sh start "$DB" >/dev/null || exit 1
		node bench.mjs "$v" 1 1000,25 $T > "$R/$TAG-$v-table-x$T-$k.json" 2>> "$R/$TAG.log" || echo "FAILED table $v x$T r$k"
		node form.mjs "$v" 1 $T > "$R/$TAG-$v-form-x$T-$k.json" 2>> "$R/$TAG.log" || echo "FAILED form $v x$T r$k"
		./api.sh stop
	done
	echo "round $k $(date +%T) load $(uptime | sed 's/.*averages: //')"
done
rm -rf "$W/app/dist" && cp -R /tmp/perfbench-dists/baseline "$W/app/dist"
for v in "$@"; do for kind in table form; do
	node -e 'const fs=require("fs");const out=[];for(const f of process.argv.slice(1)){const t=fs.readFileSync(f,"utf8");if(t.trim())out.push(...JSON.parse(t).map((r,i)=>({...r,run:out.length+i})))};console.log(JSON.stringify(out))' $R/$TAG-$v-$kind-x$T-*.json > "$D/results/$TAG-$v-$kind-x$T.json"
done; done
