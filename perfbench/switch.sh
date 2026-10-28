#!/bin/bash
set -e
W="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
[ -f /tmp/perfbench-api.pid ] && kill "$(cat /tmp/perfbench-api.pid)" 2>/dev/null || true
sleep 1
rm -rf "$W/app/dist" && cp -R "/tmp/perfbench-dists/$1" "$W/app/dist"
cd "$W/api"
nohup node dist/cli/run.js start > /tmp/perfbench-api.log 2>&1 &
echo $! > /tmp/perfbench-api.pid
for i in $(seq 1 40); do sleep 0.5; curl -sf http://127.0.0.1:8155/server/ping >/dev/null && echo "up $1" && exit 0; done
echo "API failed"; tail /tmp/perfbench-api.log; exit 1
