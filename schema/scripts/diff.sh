#!/bin/bash
# DirectApp - Schema Diff
#
# Compare schemas between environments
# Helps identify what will change before applying
#
# Usage:
#   ./schema/scripts/diff.sh [source] [target]
#   ./schema/scripts/diff.sh prod dev     # What's different from prod to dev
#   ./schema/scripts/diff.sh staging prod # What will change in prod

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_DIR="$(dirname "$SCRIPT_DIR")"
SNAPSHOTS_DIR="$SCHEMA_DIR/snapshots"

# Environments
SOURCE_ENV="${1:-prod}"
TARGET_ENV="${2:-dev}"
SOURCE_FILE="$SNAPSHOTS_DIR/${SOURCE_ENV}.json"
TARGET_FILE="$SNAPSHOTS_DIR/${TARGET_ENV}.json"

echo -e "${YELLOW}DirectApp Schema Diff${NC}"
echo "Comparing: $SOURCE_ENV → $TARGET_ENV"
echo ""

# Check if snapshots exist
if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}Error: Source snapshot not found: $SOURCE_FILE${NC}"
    exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo -e "${RED}Error: Target snapshot not found: $TARGET_FILE${NC}"
    exit 1
fi

# Check for directus CLI
if ! command -v directus &> /dev/null; then
    echo -e "${YELLOW}Installing Directus CLI...${NC}"
    npm install -g directus@11.12.0
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    echo "Install with: sudo apt-get install jq (Ubuntu) or brew install jq (macOS)"
    exit 1
fi

# Run Directus schema diff
echo -e "${BLUE}=== Directus Schema Diff ===${NC}"
npx directus schema diff "$SOURCE_FILE" "$TARGET_FILE"

echo ""
echo -e "${BLUE}=== Summary ===${NC}"

# Collections comparison
SOURCE_COLLECTIONS=$(jq -r '.collections[].collection' "$SOURCE_FILE" 2>/dev/null | sort)
TARGET_COLLECTIONS=$(jq -r '.collections[].collection' "$TARGET_FILE" 2>/dev/null | sort)

# New collections
NEW_COLLECTIONS=$(comm -13 <(echo "$SOURCE_COLLECTIONS") <(echo "$TARGET_COLLECTIONS") || true)
if [ -n "$NEW_COLLECTIONS" ]; then
    echo -e "${GREEN}New collections in $TARGET_ENV:${NC}"
    echo "$NEW_COLLECTIONS" | sed 's/^/  + /'
    echo ""
fi

# Removed collections
REMOVED_COLLECTIONS=$(comm -23 <(echo "$SOURCE_COLLECTIONS") <(echo "$TARGET_COLLECTIONS") || true)
if [ -n "$REMOVED_COLLECTIONS" ]; then
    echo -e "${RED}Collections removed in $TARGET_ENV:${NC}"
    echo "$REMOVED_COLLECTIONS" | sed 's/^/  - /'
    echo ""
fi

# Stats
SOURCE_FIELD_COUNT=$(jq '.fields | length' "$SOURCE_FILE" 2>/dev/null || echo "0")
TARGET_FIELD_COUNT=$(jq '.fields | length' "$TARGET_FILE" 2>/dev/null || echo "0")
FIELD_DIFF=$((TARGET_FIELD_COUNT - SOURCE_FIELD_COUNT))

SOURCE_RELATION_COUNT=$(jq '.relations | length' "$SOURCE_FILE" 2>/dev/null || echo "0")
TARGET_RELATION_COUNT=$(jq '.relations | length' "$TARGET_FILE" 2>/dev/null || echo "0")
RELATION_DIFF=$((TARGET_RELATION_COUNT - SOURCE_RELATION_COUNT))

echo "Field count: $SOURCE_FIELD_COUNT → $TARGET_FIELD_COUNT ($FIELD_DIFF)"
echo "Relation count: $SOURCE_RELATION_COUNT → $TARGET_RELATION_COUNT ($RELATION_DIFF)"
echo ""

if [ "$FIELD_DIFF" -eq 0 ] && [ "$RELATION_DIFF" -eq 0 ] && [ -z "$NEW_COLLECTIONS" ] && [ -z "$REMOVED_COLLECTIONS" ]; then
    echo -e "${GREEN}✓ Schemas are identical${NC}"
else
    echo -e "${YELLOW}⚠ Schemas differ${NC}"
    echo ""
    echo -e "${YELLOW}Review changes carefully before applying to $SOURCE_ENV${NC}"
fi
