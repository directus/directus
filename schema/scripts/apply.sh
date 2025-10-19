#!/bin/bash
# DirectApp - Apply Schema Snapshot
#
# Applies a schema snapshot to Directus instance
# Use this to sync schema from one environment to another
#
# Usage:
#   ./schema/scripts/apply.sh [environment]
#   ./schema/scripts/apply.sh dev
#   ./schema/scripts/apply.sh staging
#   ./schema/scripts/apply.sh prod

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

echo -e "${YELLOW}DirectApp Schema Apply${NC}"
echo "Environment: $ENV"
echo "Snapshot: $SNAPSHOT_FILE"
echo ""

# Check if snapshot exists
if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo -e "${RED}Error: Snapshot file not found: $SNAPSHOT_FILE${NC}"
    echo ""
    echo "Available snapshots:"
    ls -1 "$SNAPSHOTS_DIR"/*.json 2>/dev/null || echo "  (none)"
    exit 1
fi

# Check if Directus is accessible
if ! curl -fsS "${DIRECTUS_URL:-http://localhost:8055}/server/health" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to Directus at ${DIRECTUS_URL:-http://localhost:8055}${NC}"
    echo "Make sure Directus is running and DIRECTUS_URL is set"
    exit 1
fi

# Safety check for production
if [ "$ENV" == "prod" ]; then
    echo -e "${RED}⚠️  WARNING: You are about to apply schema to PRODUCTION${NC}"
    echo ""
    echo "This will modify the production database schema."
    echo "Make sure you have:"
    echo "  1. Reviewed the schema changes"
    echo "  2. Tested in dev/staging"
    echo "  3. Created a database backup"
    echo ""
    read -p "Type 'yes' to continue: " -r
    echo ""
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check for directus CLI
if ! command -v directus &> /dev/null; then
    echo -e "${YELLOW}Installing Directus CLI...${NC}"
    npm install -g directus@11.12.0
fi

# Apply schema
echo -e "${YELLOW}Applying schema...${NC}"
npx directus schema apply "$SNAPSHOT_FILE" --yes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema applied successfully${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Verify changes in Directus UI"
    echo "2. Test affected features"
    echo "3. Check for any errors in logs"
else
    echo -e "${RED}✗ Schema apply failed${NC}"
    echo ""
    echo "If there are conflicts, you may need to:"
    echo "  1. Review the diff first: ./schema/scripts/diff.sh"
    echo "  2. Manually resolve conflicts"
    echo "  3. Re-export the schema"
    exit 1
fi
