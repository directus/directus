#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path')
echo "$FILE" | grep -qE '\.(css|scss|vue)$' && ./node_modules/.bin/stylelint --fix "$FILE" || true
