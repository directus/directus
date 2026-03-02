#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path')
echo "$FILE" | grep -qE '\.(css|scss|vue)$' && "$CLAUDE_PROJECT_DIR"/node_modules/.bin/stylelint --fix "$FILE" || true
