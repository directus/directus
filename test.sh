#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-}"
case "$MODE" in
	base)
		echo "[base] running existing tests"
		pnpm -C api exec vitest run src/logger/redact-query.test.ts src/logger/logs-stream.test.ts
		;;
	new)
		echo "[new] running new problem tests"
		pnpm -C api exec vitest run src/request-id-correlation.test.ts
		;;
	*)
		echo "usage: ./test.sh {base|new}"
		exit 1
		;;
esac
  