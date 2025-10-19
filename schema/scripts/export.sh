#!/bin/bash
# DirectApp - Export Schema Snapshot
#
# Exports current Directus schema to snapshot file
# Run this after making schema changes in Directus UI
#
# Usage:
#   ./schema/scripts/export.sh [environment]
#   ./schema/scripts/export.sh dev
#   ./schema/scripts/export.sh prod

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_DIR="$(dirname "$SCRIPT_DIR")"
SNAPSHOTS_DIR="$SCHEMA_DIR/snapshots"

# Default environment
ENV="${1:-dev}"
SNAPSHOT_FILE="$SNAPSHOTS_DIR/${ENV}.json"

echo -e "${YELLOW}DirectApp Schema Export${NC}"
echo "Environment: $ENV"
echo "Output: $SNAPSHOT_FILE"
echo ""

# Check if Directus is accessible
if ! curl -fsS "${DIRECTUS_URL:-http://localhost:8055}/server/health" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to Directus at ${DIRECTUS_URL:-http://localhost:8055}${NC}"
    echo "Make sure Directus is running and DIRECTUS_URL is set"
    exit 1
fi

# Check for directus CLI
if ! command -v directus &> /dev/null; then
    echo -e "${YELLOW}Installing Directus CLI...${NC}"
    npm install -g directus@11.12.0
fi

# Create snapshots directory if it doesn't exist
mkdir -p "$SNAPSHOTS_DIR"

# Export schema
echo -e "${YELLOW}Exporting schema...${NC}"
npx directus schema snapshot "$SNAPSHOT_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema exported successfully${NC}"
    echo ""
    echo "Snapshot saved to: $SNAPSHOT_FILE"
    echo ""

    # Show summary
    echo "Collections:"
    jq -r '.collections[].collection' "$SNAPSHOT_FILE" 2>/dev/null | sort | head -10

    COLLECTION_COUNT=$(jq '.collections | length' "$SNAPSHOT_FILE" 2>/dev/null || echo "unknown")
    FIELD_COUNT=$(jq '.fields | length' "$SNAPSHOT_FILE" 2>/dev/null || echo "unknown")
    RELATION_COUNT=$(jq '.relations | length' "$SNAPSHOT_FILE" 2>/dev/null || echo "unknown")

    echo ""
    echo "Total collections: $COLLECTION_COUNT"
    echo "Total fields: $FIELD_COUNT"
    echo "Total relations: $RELATION_COUNT"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Review the snapshot file"
    echo "2. Commit to version control"
    echo "3. Use ./schema/scripts/diff.sh to compare environments"
else
    echo -e "${RED}✗ Schema export failed${NC}"
    exit 1
fi
