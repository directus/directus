#!/bin/bash
# DirectApp - Lint Permissions
#
# Validates permission rules for security issues
# Checks for:
# - Unscoped delete permissions
# - Missing dealership_id filters on non-admin policies
# - Dangerous user update permissions
# - Missing TFA enforcement on admin policies
#
# Usage:
#   ./schema/scripts/lint-permissions.sh [environment]
#   ./schema/scripts/lint-permissions.sh prod

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

# Default to checking prod schema
ENV="${1:-prod}"
SNAPSHOT_FILE="$SNAPSHOTS_DIR/${ENV}.json"

# Also check roles export if available
ROLES_FILE="$(dirname "$SCHEMA_DIR")/schema-exported/roles.json"

echo -e "${YELLOW}DirectApp Permission Linter${NC}"
echo "Environment: $ENV"
echo ""

# Check if snapshot exists
if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo -e "${RED}Error: Snapshot file not found: $SNAPSHOT_FILE${NC}"
    exit 1
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    exit 1
fi

ERRORS=0
WARNINGS=0

# Use roles.json if available (more complete), else use snapshot
if [ -f "$ROLES_FILE" ]; then
    PERMISSION_SOURCE="$ROLES_FILE"
    echo "Checking permissions from: $ROLES_FILE"
else
    PERMISSION_SOURCE="$SNAPSHOT_FILE"
    echo "Checking permissions from: $SNAPSHOT_FILE"
fi

echo ""
echo -e "${YELLOW}Running security checks...${NC}"
echo ""

# Check 1: Unscoped delete permissions on cars collection
echo "[1/5] Checking for unscoped delete permissions..."
UNSCOPED_DELETES=$(jq -r '.permissions[] | select(.collection == "cars" and .action == "delete" and .permissions == null) | .policy' "$PERMISSION_SOURCE" 2>/dev/null || echo "")

if [ -n "$UNSCOPED_DELETES" ]; then
    echo -e "${RED}  ✗ CRITICAL: Found unscoped delete permissions on cars:${NC}"
    echo "$UNSCOPED_DELETES" | while read policy; do
        POLICY_NAME=$(jq -r ".policies[] | select(.id == \"$policy\") | .name" "$PERMISSION_SOURCE" 2>/dev/null || echo "Unknown")
        echo "    Policy: $POLICY_NAME (ID: $policy)"
    done
    echo -e "${RED}  ⚠  Users with these policies can delete ANY car without restrictions!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}  ✓ No unscoped delete permissions found${NC}"
fi
echo ""

# Check 2: Missing dealership_id filters on non-admin read/write
echo "[2/5] Checking for missing dealership_id filters..."
MISSING_DEALERSHIP_FILTER=$(jq -r '.permissions[] | select(.collection == "cars" and (.action == "read" or .action == "update" or .action == "create") and .permissions != null and (.permissions | tostring | contains("dealership_id") | not)) | .policy' "$PERMISSION_SOURCE" 2>/dev/null || echo "")

if [ -n "$MISSING_DEALERSHIP_FILTER" ]; then
    echo -e "${RED}  ✗ WARNING: Found permissions without dealership_id filter:${NC}"
    echo "$MISSING_DEALERSHIP_FILTER" | while read policy; do
        POLICY_NAME=$(jq -r ".policies[] | select(.id == \"$policy\") | .name" "$PERMISSION_SOURCE" 2>/dev/null || echo "Unknown")
        IS_ADMIN=$(jq -r ".policies[] | select(.id == \"$policy\") | .admin_access" "$PERMISSION_SOURCE" 2>/dev/null || echo "false")
        if [ "$IS_ADMIN" == "false" ]; then
            echo "    Policy: $POLICY_NAME (ID: $policy)"
        fi
    done
    echo -e "${YELLOW}  ⚠  Non-admin users may see data from other dealerships${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}  ✓ All non-admin permissions have dealership_id filters${NC}"
fi
echo ""

# Check 3: Dangerous user update permissions (password, email)
echo "[3/5] Checking for dangerous user update permissions..."
DANGEROUS_USER_UPDATES=$(jq -r '.permissions[] | select(.collection == "directus_users" and .action == "update" and (.fields | contains(["password"]) or contains(["email"]))) | select(.permissions == null or (.permissions | tostring | contains("CURRENT_USER") | not)) | .policy' "$PERMISSION_SOURCE" 2>/dev/null || echo "")

if [ -n "$DANGEROUS_USER_UPDATES" ]; then
    echo -e "${RED}  ✗ CRITICAL: Found dangerous user update permissions:${NC}"
    echo "$DANGEROUS_USER_UPDATES" | while read policy; do
        POLICY_NAME=$(jq -r ".policies[] | select(.id == \"$policy\") | .name" "$PERMISSION_SOURCE" 2>/dev/null || echo "Unknown")
        IS_ADMIN=$(jq -r ".policies[] | select(.id == \"$policy\") | .admin_access" "$PERMISSION_SOURCE" 2>/dev/null || echo "false")
        if [ "$IS_ADMIN" == "false" ]; then
            echo "    Policy: $POLICY_NAME (ID: $policy)"
        fi
    done
    echo -e "${RED}  ⚠  Non-admin users can update passwords/emails of other users!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}  ✓ No dangerous user update permissions found${NC}"
fi
echo ""

# Check 4: TFA enforcement on admin policies
echo "[4/5] Checking TFA enforcement on admin policies..."
NO_TFA_ADMIN=$(jq -r '.policies[] | select(.admin_access == true and .enforce_tfa != true) | .name' "$PERMISSION_SOURCE" 2>/dev/null || echo "")

if [ -n "$NO_TFA_ADMIN" ]; then
    echo -e "${YELLOW}  ⚠ WARNING: Admin policies without TFA enforcement:${NC}"
    echo "$NO_TFA_ADMIN" | while read policy; do
        echo "    Policy: $policy"
    done
    echo -e "${YELLOW}  ⚠  Recommended: Enable TFA for all admin policies${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}  ✓ All admin policies enforce TFA${NC}"
fi
echo ""

# Check 5: Overlapping/duplicate permissions
echo "[5/5] Checking for duplicate permission rules..."
DUPLICATE_PERMS=$(jq -r '[.permissions[] | "\(.collection)|\(.action)|\(.policy)"] | group_by(.) | map(select(length > 1)) | .[] | .[0]' "$PERMISSION_SOURCE" 2>/dev/null || echo "")

if [ -n "$DUPLICATE_PERMS" ]; then
    echo -e "${YELLOW}  ⚠ WARNING: Found duplicate permission rules:${NC}"
    echo "$DUPLICATE_PERMS" | while read perm; do
        IFS='|' read -ra PARTS <<< "$perm"
        echo "    Collection: ${PARTS[0]}, Action: ${PARTS[1]}, Policy: ${PARTS[2]}"
    done
    echo -e "${YELLOW}  ⚠  Duplicate rules may cause confusion${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}  ✓ No duplicate permission rules found${NC}"
fi
echo ""

# Summary
echo -e "${YELLOW}=== Summary ===${NC}"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ FAILED - $ERRORS critical security issues found${NC}"
    echo ""
    echo "These issues MUST be fixed before production deployment!"
    echo "See: .claude/SCHEMA_ANALYSIS.md for fix instructions"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ PASSED with warnings - $WARNINGS recommendations${NC}"
    echo ""
    echo "Review warnings and consider fixing for better security"
    exit 0
else
    echo -e "${GREEN}✓ PASSED - No security issues found${NC}"
    exit 0
fi
