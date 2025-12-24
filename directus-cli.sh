#!/bin/bash
# Helper script to run local Directus CLI with proper environment

# Change to api directory
cd "$(dirname "$0")/api" || exit 1

# Load .env file if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Run the CLI with all arguments passed through
node dist/cli/run.js "$@"
