#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path')
echo "$FILE" | grep -qE '\.(js|mjs|ts|json|vue|scss|css|md|yaml|yml)$' && ./node_modules/.bin/prettier --write "$FILE" || true
