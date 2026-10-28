#!/bin/bash
# Usage: session.sh [--seed] <variant>...   Runs under the shared perfbench lock.
set -e
D=${D:-/tmp/perfbench-form}; mkdir -p $D
S=$(cd "$(dirname "$0")" && pwd)
W=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PORT=8165
URL=http://127.0.0.1:$PORT

until mkdir /tmp/perfbench.lock 2>/dev/null; do sleep 10; done
cleanup() { stop_api; rmdir /tmp/perfbench.lock; }
trap cleanup EXIT
echo "lock acquired $(date +%T)"

start_api() {
	rm -rf "$W/app/dist" && cp -R "/tmp/perfbench-dists/$1" "$W/app/dist"
	(cd "$W/api" && CONFIG_PATH=$D/api.env nohup mise exec node@24 -- node dist/cli/run.js start > $D/api.log 2>&1 & echo $! > $D/api.pid)
	for i in $(seq 1 60); do sleep 0.5; curl -sf $URL/server/ping >/dev/null && echo "up $1" && return 0; done
	echo "API failed"; tail $D/api.log; exit 1
}
stop_api() { kill "$(cat $D/api.pid 2>/dev/null)" 2>/dev/null || true; rm -f $D/api.pid; lsof -ti tcp:$PORT | xargs kill 2>/dev/null || true; sleep 1; }

if [ "$1" = "--seed" ]; then
	shift
	cp "$W/api/bench.db" $D/bench.db
	start_api baseline
	mise exec node@24 -- node $S/seed-form.mjs $URL
	stop_api
fi

for v in "$@"; do
	start_api "$v"
	mise exec node@24 -- node $S/bench-form.mjs "$v" ${RUNS1:-5} form_bench,form_bench_cond 1 $URL
	mise exec node@24 -- node $S/bench-form.mjs "$v" ${RUNS4:-3} form_bench,form_bench_cond 4 $URL
	stop_api
done
echo "done $(date +%T)"
