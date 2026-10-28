#!/bin/bash
# api.sh start <db> | stop   (own API on 8175, serving whatever is in the perfbench app/dist)
D=${D:-/tmp/perfbench-fields}; mkdir -p $D
W=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); API=$W/api
if [ "$1" = stop ]; then [ -f $D/api.pid ] && kill "$(cat $D/api.pid)" 2>/dev/null; rm -f $D/api.pid; lsof -ti tcp:8175 | xargs kill 2>/dev/null; sleep 1; exit 0; fi
cd $API
CONFIG_PATH=$D/api.env DB_FILENAME="$2" nohup node dist/cli/run.js start > $D/api.log 2>&1 &
echo $! > $D/api.pid
for i in $(seq 1 120); do sleep 0.5; curl -sf http://127.0.0.1:8175/server/ping >/dev/null && echo "api up $2" && exit 0; done
echo "API failed"; tail $D/api.log; exit 1
