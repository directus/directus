#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path')
echo "$FILE" | grep -qE '\.(js|mjs|ts|vue)$' && ./node_modules/.bin/eslint --fix "$FILE" || true
