#!/bin/bash
# vis.sh <db> <variants...>  screenshots per variant, under the lock
D=${D:-/tmp/perfbench-fields}; mkdir -p $D; S=$(cd "$(dirname "$0")" && pwd); W=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
DB=$1; shift
until mkdir /tmp/perfbench.lock 2>/dev/null; do sleep 10; done
trap '$S/api.sh stop; rmdir /tmp/perfbench.lock' EXIT
cd $S
for v in "$@"; do
	rm -rf "$W/app/dist" && cp -R "/tmp/perfbench-dists/$v" "$W/app/dist"
	./api.sh start "$DB" || exit 1
	node vis.mjs "$v"
	./api.sh stop
done
rm -rf "$W/app/dist" && cp -R /tmp/perfbench-dists/baseline "$W/app/dist"
