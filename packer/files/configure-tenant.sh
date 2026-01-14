#!/bin/bash
# =============================================================================
# Tenant Configuration Script
# =============================================================================
# This script is called at EC2 instance launch via user-data to configure
# the tenant-specific settings. The AMI already has Directus built and ready.
#
# Required environment variables (passed via user-data):
#   TENANT_NAME         - Tenant identifier (e.g., "staging")
#   FQDN                - Fully qualified domain name (e.g., "staging.example.com")
#   NAME_PREFIX         - Prefix for resource names (e.g., "f2f")
#   DB_HOST             - Aurora/PostgreSQL host
#   DB_PORT             - Database port (default: 5432)
#   DB_NAME             - Database name (same as TENANT_NAME)
#   DB_USER             - Database user (same as TENANT_NAME)
#   DB_PASSWORD         - Database password
#   DIRECTUS_KEY        - Directus KEY (for encryption)
#   DIRECTUS_SECRET     - Directus SECRET (for encryption)
#   ADMIN_EMAIL         - Directus admin email
#   ADMIN_PASSWORD      - Directus admin password
#   AWS_REGION          - AWS region
#   ENABLE_SSL          - Whether to enable SSL (true/false)
#   SSL_EMAIL           - Email for Let's Encrypt
#   BACKUP_BUCKET       - S3 bucket for backups
#   TEMPLATE_VERSION    - Template version tag (e.g., "1.0.0") - REQUIRED
#   GITHUB_TOKEN        - GitHub PAT for cloning private template repo
#
# Optional environment variables:
#   TEMPLATE_API_TOKEN  - API auth token for Template API (generated if not provided)
#   PROJECT_OWNER       - Project owner email (defaults to ADMIN_EMAIL)
#   PROJECT_USAGE       - Usage type: personal/educational/non-profit/commercial/agency
#   ORG_NAME            - Organization name
#   PRODUCT_UPDATES     - Whether to receive product updates (true/false)
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================
LOG_FILE="/var/log/tenant-configure.log"
STATUS_FILE="/var/run/tenant-configure.status"

# Redirect all output to log file while also displaying to stdout
exec > >(tee -a "$LOG_FILE") 2>&1

# =============================================================================
# Utility Functions
# =============================================================================

# Write status to file for external monitoring
write_status() {
    local status="$1"
    local message="${2:-}"
    echo "{\"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -Iseconds)\"}" > "$STATUS_FILE"
}

# Retry a command with exponential backoff
# Usage: retry_with_backoff <max_attempts> <initial_delay> <command...>
retry_with_backoff() {
    local max_attempts=$1
    local delay=$2
    shift 2
    local attempt=1
    local exit_code=0

    while [[ $attempt -le $max_attempts ]]; do
        if "$@"; then
            return 0
        fi
        exit_code=$?
        
        if [[ $attempt -lt $max_attempts ]]; then
            echo "  Attempt $attempt/$max_attempts failed (exit code: $exit_code). Retrying in ${delay}s..."
            sleep "$delay"
            # Exponential backoff with cap at 60 seconds
            delay=$((delay * 2))
            [[ $delay -gt 60 ]] && delay=60
        fi
        ((attempt++))
    done

    echo "  All $max_attempts attempts failed"
    return $exit_code
}

# Wait for a service to become healthy
# Usage: wait_for_service <url> <timeout_seconds> <interval_seconds> <service_name>
wait_for_service() {
    local url=$1
    local timeout=$2
    local interval=$3
    local service_name=$4
    local elapsed=0

    echo "  Waiting for $service_name to start..."
    while true; do
        if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
            echo "  $service_name is healthy!"
            return 0
        fi

        elapsed=$((elapsed + interval))
        if [[ $elapsed -ge $timeout ]]; then
            echo "  ERROR: $service_name health check timed out after ${timeout}s"
            return 1
        fi

        echo "  Waiting for $service_name... (${elapsed}s / ${timeout}s)"
        sleep "$interval"
    done
}

# Test database connectivity
test_db_connection() {
    PGSSLMODE=require PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1
}

# Error handler for trap
on_error() {
    local exit_code=$?
    local line_number=$1
    echo ""
    echo "=============================================="
    echo "ERROR: Script failed at line $line_number"
    echo "Exit code: $exit_code"
    echo "Time: $(date)"
    echo "=============================================="
    write_status "failed" "Script failed at line $line_number with exit code $exit_code"
    
    # Don't exit - let the script continue to show what was happening
}

# Set up error trap
trap 'on_error $LINENO' ERR

# =============================================================================
# Main Script
# =============================================================================

echo "=== Starting tenant configuration at $(date) ==="
write_status "starting" "Beginning tenant configuration"

# Validate required variables
REQUIRED_VARS=(
    "TENANT_NAME"
    "FQDN"
    "NAME_PREFIX"
    "DB_HOST"
    "DB_PASSWORD"
    "DIRECTUS_KEY"
    "DIRECTUS_SECRET"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
    "AWS_REGION"
    "TEMPLATE_VERSION"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: Required variable $var is not set"
        write_status "failed" "Required variable $var is not set"
        exit 1
    fi
done

# Validate TEMPLATE_VERSION format (must be a valid semver-like tag)
if [[ ! "$TEMPLATE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo "ERROR: TEMPLATE_VERSION must be a valid version tag (e.g., 1.0.0 or 1.0.0-beta.1)"
    echo "  Received: $TEMPLATE_VERSION"
    write_status "failed" "Invalid TEMPLATE_VERSION format"
    exit 1
fi

# Set defaults
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-directus}"
DB_USER="${DB_USER:-$TENANT_NAME}"
DIRECTUS_PORT="${DIRECTUS_PORT:-8055}"
ENABLE_SSL="${ENABLE_SSL:-true}"
SSL_EMAIL="${SSL_EMAIL:-$ADMIN_EMAIL}"
BACKUP_BUCKET="${BACKUP_BUCKET:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Template API token - use provided value or generate one
# Track whether token was provided externally for later use
TEMPLATE_API_TOKEN_PROVIDED=false
if [[ -n "${TEMPLATE_API_TOKEN:-}" ]]; then
    TEMPLATE_API_TOKEN_PROVIDED=true
    echo "  Using TEMPLATE_API_TOKEN from environment"
else
    TEMPLATE_API_TOKEN=$(openssl rand -hex 32)
    echo "  Generated TEMPLATE_API_TOKEN"
fi
export TEMPLATE_API_TOKEN

# Project owner defaults (BSL 1.1 license consent)
PROJECT_OWNER="${PROJECT_OWNER:-$ADMIN_EMAIL}"
PROJECT_USAGE="${PROJECT_USAGE:-commercial}"
ORG_NAME="${ORG_NAME:-}"
PRODUCT_UPDATES="${PRODUCT_UPDATES:-false}"

echo "=== Configuration ==="
echo "  Tenant: $TENANT_NAME"
echo "  FQDN: $FQDN"
echo "  DB Host: $DB_HOST"
echo "  Region: $AWS_REGION"
echo "  Template Version: $TEMPLATE_VERSION"
echo "  Template API Token: ${TEMPLATE_API_TOKEN_PROVIDED:+provided}${TEMPLATE_API_TOKEN_PROVIDED:-generated}"

# =============================================================================
# Clone Directus Template (versioned)
# =============================================================================
echo "=== Cloning Directus Template (v${TEMPLATE_VERSION}) ==="
write_status "running" "Cloning template version $TEMPLATE_VERSION"

# Ensure template directory exists and is empty
sudo rm -rf /opt/directus-template
sudo mkdir -p /opt/directus-template
sudo chown ubuntu:ubuntu /opt/directus-template

# Clone using the specific version tag
if [[ -n "$GITHUB_TOKEN" ]]; then
    echo "  Using authenticated clone (private repo)"
    if git clone --depth 1 --branch "v${TEMPLATE_VERSION}" \
        "https://oauth2:${GITHUB_TOKEN}@github.com/Face-to-Face-IT/directus-template.git" \
        /opt/directus-template 2>&1; then
        echo "  Template v${TEMPLATE_VERSION} cloned successfully"
    else
        echo "  ERROR: Failed to clone template v${TEMPLATE_VERSION}"
        echo "  Verify the tag exists: https://github.com/Face-to-Face-IT/directus-template/releases/tag/v${TEMPLATE_VERSION}"
        write_status "failed" "Failed to clone template v${TEMPLATE_VERSION}"
        exit 1
    fi
    # Remove git directory to clean up credentials
    rm -rf /opt/directus-template/.git
else
    echo "  Using public clone (no auth)"
    if git clone --depth 1 --branch "v${TEMPLATE_VERSION}" \
        "https://github.com/Face-to-Face-IT/directus-template.git" \
        /opt/directus-template 2>&1; then
        echo "  Template v${TEMPLATE_VERSION} cloned successfully"
    else
        echo "  ERROR: Failed to clone template v${TEMPLATE_VERSION}"
        echo "  Verify the tag exists: https://github.com/Face-to-Face-IT/directus-template/releases/tag/v${TEMPLATE_VERSION}"
        write_status "failed" "Failed to clone template v${TEMPLATE_VERSION}"
        exit 1
    fi
    rm -rf /opt/directus-template/.git
fi

# Record the template version for reference
echo "$TEMPLATE_VERSION" > /opt/directus-template/.version
echo "  Template version recorded in /opt/directus-template/.version"

# =============================================================================
# Validate Database Connectivity
# =============================================================================
echo "=== Validating Database Connectivity ==="
write_status "running" "Validating database connectivity"

if retry_with_backoff 5 5 test_db_connection; then
    echo "  Database connection successful"
else
    echo "  ERROR: Cannot connect to database after multiple attempts"
    echo "  Please verify:"
    echo "    - DB_HOST ($DB_HOST) is correct"
    echo "    - DB_PORT ($DB_PORT) is correct"
    echo "    - DB_USER ($DB_USER) has access"
    echo "    - Security groups allow inbound traffic on port $DB_PORT"
    write_status "failed" "Database connection failed"
    exit 1
fi

# =============================================================================
# Configure Nginx
# =============================================================================
echo "=== Configuring Nginx ==="
write_status "running" "Configuring Nginx"

# Create nginx config from template
export FQDN DIRECTUS_PORT
envsubst '${FQDN} ${DIRECTUS_PORT}' < /etc/nginx/templates/nginx-directus.conf.template \
    > /etc/nginx/sites-available/directus

# Enable the site
ln -sf /etc/nginx/sites-available/directus /etc/nginx/sites-enabled/directus

# Test and reload nginx
if nginx -t; then
    systemctl reload nginx
    echo "  Nginx configured for $FQDN"
else
    echo "  ERROR: Nginx configuration test failed"
    exit 1
fi

# =============================================================================
# Configure CloudWatch Agent
# =============================================================================
echo "=== Configuring CloudWatch Agent ==="
write_status "running" "Configuring CloudWatch Agent"

export NAME_PREFIX TENANT_NAME
envsubst '${NAME_PREFIX} ${TENANT_NAME}' < /opt/aws/amazon-cloudwatch-agent/etc/templates/cloudwatch-agent.json.template \
    > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

echo "  CloudWatch Agent started"

# =============================================================================
# Configure Directus with PM2
# =============================================================================
echo "=== Configuring Directus ==="
write_status "running" "Configuring Directus"

# Export variables for envsubst
export DIRECTUS_PORT DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
export DIRECTUS_KEY DIRECTUS_SECRET ADMIN_EMAIL ADMIN_PASSWORD FQDN
export STORAGE_LOCATIONS STORAGE_S3_DRIVER STORAGE_S3_ROOT STORAGE_S3_BUCKET STORAGE_S3_REGION
# TEMPLATE_API_TOKEN is already exported above

# Create ecosystem.config.cjs from template (using .cjs for CommonJS compatibility)
envsubst < /opt/directus/ecosystem.config.cjs.template > /opt/directus/ecosystem.config.cjs

# Set ownership
chown -R ubuntu:ubuntu /opt/directus
chown -R ubuntu:ubuntu /opt/template-api

echo "  PM2 ecosystem configured"

# =============================================================================
# Bootstrap Directus Database
# =============================================================================
echo "=== Bootstrapping Directus Database ==="
write_status "running" "Bootstrapping Directus database"

cd /opt/directus

# Export environment variables for bootstrap command
# These must match what Directus expects for database connection
export DB_CLIENT=pg
export DB_HOST="$DB_HOST"
export DB_PORT="$DB_PORT"
export DB_DATABASE="$DB_NAME"
export DB_USER="$DB_USER"
export DB_PASSWORD="$DB_PASSWORD"
export DB_SSL=true
export KEY="$DIRECTUS_KEY"
export SECRET="$DIRECTUS_SECRET"
# Use HTTP when SSL is disabled (ALB/CloudFront handles SSL termination)
if [[ "$ENABLE_SSL" == "true" ]]; then
    export PUBLIC_URL="https://$FQDN"
else
    export PUBLIC_URL="http://$FQDN"
fi
export PORT="$DIRECTUS_PORT"

# Run bootstrap as ubuntu user
# This is idempotent:
#   - If DB is empty: initializes schema and creates admin user
#   - If DB has tables: skips init, only runs pending migrations
echo "  Running directus bootstrap..."
if sudo -u ubuntu -E node directus/cli.js bootstrap 2>&1; then
    echo "  Bootstrap completed successfully"
else
    BOOTSTRAP_EXIT=$?
    echo "  WARNING: Bootstrap exited with code $BOOTSTRAP_EXIT"
    echo "  This may be okay if the database was already initialized"
fi

# =============================================================================
# Set Project Owner (BSL 1.1 License Consent)
# =============================================================================
# Set project owner fields to skip the consent screen on first login.
# This updates directus_settings after bootstrap to pre-fill the license
# consent fields required by Directus 11.x (BSL 1.1 license).
if [[ -n "$PROJECT_OWNER" ]]; then
    echo "=== Setting Project Owner (BSL 1.1 License) ==="
    
    # Convert boolean string to PostgreSQL boolean
    PG_PRODUCT_UPDATES="false"
    if [[ "$PRODUCT_UPDATES" == "true" ]]; then
        PG_PRODUCT_UPDATES="true"
    fi
    
    # Escape single quotes in org_name for SQL
    ESCAPED_ORG_NAME="${ORG_NAME//\'/\'\'}" 
    
    # Update directus_settings with project owner information
    # project_status = NULL indicates consent has been given
    if PGSSLMODE=require PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE directus_settings SET 
            project_owner = '$PROJECT_OWNER',
            project_usage = '$PROJECT_USAGE',
            org_name = '$ESCAPED_ORG_NAME',
            product_updates = $PG_PRODUCT_UPDATES,
            project_status = NULL
        WHERE id = 1;
    " 2>&1; then
        echo "  Project owner set to $PROJECT_OWNER"
        echo "  Project usage: $PROJECT_USAGE"
        [[ -n "$ORG_NAME" ]] && echo "  Organization: $ORG_NAME"
    else
        echo "  WARNING: Failed to set project owner"
        echo "  This may be okay if the columns don't exist yet (older Directus version)"
    fi
fi

# =============================================================================
# Start Directus with PM2 (only Directus, not Template API yet)
# =============================================================================
echo "=== Starting Directus ==="
write_status "running" "Starting Directus"

cd /opt/directus

# Start only Directus app with PM2 as ubuntu user (Template API started later)
sudo -u ubuntu pm2 start ecosystem.config.cjs --only directus

# Save PM2 process list for startup
sudo -u ubuntu pm2 save

# Wait for Directus to be healthy
if ! wait_for_service "http://localhost:${DIRECTUS_PORT}/server/health" 300 5 "Directus"; then
    echo "  Dumping PM2 logs for debugging:"
    sudo -u ubuntu pm2 logs directus --lines 50 --nostream || true
    write_status "failed" "Directus health check timed out"
    exit 1
fi

# =============================================================================
# Configure SSL (if enabled) - BEFORE service account to ensure HTTPS works
# =============================================================================
SSL_CONFIGURED=false

if [[ "$ENABLE_SSL" == "true" ]]; then
    echo "=== Configuring SSL ==="
    write_status "running" "Configuring SSL certificate"

    # Wait for DNS to propagate (try multiple resolvers)
    echo "  Checking DNS resolution for $FQDN..."
    DNS_READY=false
    DNS_RESOLVERS=("1.1.1.1" "8.8.8.8" "9.9.9.9")  # Cloudflare, Google, Quad9
    
    for i in {1..30}; do
        for resolver in "${DNS_RESOLVERS[@]}"; do
            if host "$FQDN" "$resolver" 2>/dev/null | grep -q "has address"; then
                echo "  DNS resolved successfully (via $resolver)"
                DNS_READY=true
                break 2  # Break out of both loops
            fi
        done
        echo "  Waiting for DNS propagation... (attempt $i/30)"
        sleep 10
    done

    if [[ "$DNS_READY" == "true" ]]; then
        echo "  Obtaining SSL certificate..."
        
        # Function to run certbot (for use with retry)
        run_certbot() {
            certbot --nginx \
                --non-interactive \
                --agree-tos \
                --email "$SSL_EMAIL" \
                --domains "$FQDN" \
                2>&1
        }
        
        # Retry certbot with exponential backoff
        # Let's Encrypt can return "Service busy" during high load
        CERTBOT_ATTEMPTS=5
        CERTBOT_DELAY=10
        CERTBOT_SUCCESS=false
        
        for attempt in $(seq 1 $CERTBOT_ATTEMPTS); do
            echo "  Certbot attempt $attempt/$CERTBOT_ATTEMPTS..."
            CERTBOT_OUTPUT=$(mktemp)
            
            if run_certbot | tee "$CERTBOT_OUTPUT"; then
                echo "  SSL certificate obtained successfully"
                CERTBOT_SUCCESS=true
                SSL_CONFIGURED=true
                rm -f "$CERTBOT_OUTPUT"
                break
            fi
            
            CERTBOT_EXIT=$?
            CERTBOT_ERROR=$(cat "$CERTBOT_OUTPUT")
            rm -f "$CERTBOT_OUTPUT"
            
            # Check if this is a retryable error
            if echo "$CERTBOT_ERROR" | grep -qiE "service busy|rate limit|too many|try again|temporarily"; then
                echo "  Certbot failed with transient error (attempt $attempt/$CERTBOT_ATTEMPTS)"
                if [[ $attempt -lt $CERTBOT_ATTEMPTS ]]; then
                    echo "  Waiting ${CERTBOT_DELAY}s before retry..."
                    sleep "$CERTBOT_DELAY"
                    # Exponential backoff
                    CERTBOT_DELAY=$((CERTBOT_DELAY * 2))
                    [[ $CERTBOT_DELAY -gt 120 ]] && CERTBOT_DELAY=120
                fi
            else
                # Non-retryable error - break out of loop
                echo "  ERROR: Certbot failed with non-retryable error (exit code: $CERTBOT_EXIT)"
                echo "  Error output: $CERTBOT_ERROR"
                break
            fi
        done
        
        if [[ "$CERTBOT_SUCCESS" != "true" ]]; then
            echo "  WARNING: SSL certificate could not be obtained after $CERTBOT_ATTEMPTS attempts"
            echo "  The deployment will continue, but HTTPS will not work until SSL is configured."
            echo "  To manually obtain SSL certificate, run:"
            echo "    sudo certbot --nginx -d $FQDN"
        fi
    else
        echo "  WARNING: DNS not resolving for $FQDN after 5 minutes"
        echo "  Skipping SSL configuration. To configure SSL manually later, run:"
        echo "    sudo certbot --nginx -d $FQDN"
    fi
else
    echo "=== SSL Disabled ==="
    echo "  ENABLE_SSL is not set to 'true', skipping SSL configuration"
fi

# =============================================================================
# Create Template API Service Account
# =============================================================================
echo "=== Creating Template API Service Account ==="
write_status "running" "Creating Template API service account"

# Service account email - use tenant FQDN for valid email format
SERVICE_ACCOUNT_EMAIL="template-api@${FQDN}"

# Get admin access token for API calls
echo "  Authenticating as admin..."
AUTH_RESPONSE=$(curl -s --max-time 30 -X POST \
    "http://localhost:${DIRECTUS_PORT}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}") || true

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.access_token // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "  ERROR: Failed to authenticate as admin"
    echo "  Response: $AUTH_RESPONSE"
    write_status "failed" "Admin authentication failed"
    exit 1
fi

echo "  Admin authentication successful"

# Check if template-api user already exists
echo "  Checking for existing service account..."
EXISTING_USER_RESPONSE=$(curl -s --max-time 30 \
    "http://localhost:${DIRECTUS_PORT}/users?limit=100" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}") || true

# Parse to find existing user by email
EXISTING_USER=$(echo "$EXISTING_USER_RESPONSE" | jq -r ".data[] | select(.email == \"${SERVICE_ACCOUNT_EMAIL}\") | .id // empty")

if [[ -n "$EXISTING_USER" ]]; then
    echo "  Service account already exists (ID: $EXISTING_USER), updating token..."
    # Update the existing user's token
    UPDATE_RESPONSE=$(curl -s --max-time 30 -X PATCH \
        "http://localhost:${DIRECTUS_PORT}/users/${EXISTING_USER}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"token\": \"${TEMPLATE_API_TOKEN}\"}") || true
    
    if echo "$UPDATE_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
        echo "  Service account token updated successfully"
    else
        echo "  WARNING: Failed to update service account token"
        echo "  Response: $UPDATE_RESPONSE"
    fi
else
    echo "  Creating service account user..."
    
    # Get the first role (Administrator on fresh install)
    ROLES_RESPONSE=$(curl -s --max-time 30 \
        "http://localhost:${DIRECTUS_PORT}/roles?limit=1" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}") || true
    
    ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | jq -r '.data[0].id // empty')
    
    if [[ -z "$ADMIN_ROLE_ID" ]]; then
        echo "  ERROR: Could not find any roles"
        echo "  Response: $ROLES_RESPONSE"
        write_status "failed" "No roles found for service account"
        exit 1
    fi
    
    echo "  Using role: $ADMIN_ROLE_ID"
    
    # Create the service account with a valid email format
    CREATE_RESPONSE=$(curl -s --max-time 30 -X POST \
        "http://localhost:${DIRECTUS_PORT}/users" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${SERVICE_ACCOUNT_EMAIL}\",
            \"password\": \"$(openssl rand -hex 32)\",
            \"role\": \"${ADMIN_ROLE_ID}\",
            \"token\": \"${TEMPLATE_API_TOKEN}\",
            \"first_name\": \"Template\",
            \"last_name\": \"API Service\",
            \"status\": \"active\"
        }") || true
    
    if echo "$CREATE_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
        SERVICE_ACCOUNT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
        echo "  Service account created successfully (ID: $SERVICE_ACCOUNT_ID)"
    else
        echo "  WARNING: Failed to create service account"
        echo "  Response: $CREATE_RESPONSE"
        echo "  The Template API may not be able to authenticate with Directus"
    fi
fi

# =============================================================================
# Start Template API
# =============================================================================
echo "=== Starting Template API ==="
write_status "running" "Starting Template API"

cd /opt/directus

# Start Template API from the ecosystem config
sudo -u ubuntu pm2 start ecosystem.config.cjs --only template-api

# Save PM2 process list
sudo -u ubuntu pm2 save

# Wait for Template API to be healthy
if wait_for_service "http://localhost:3000/health" 60 5 "Template API"; then
    echo "  Template API started successfully"
else
    echo "  WARNING: Template API health check failed"
    echo "  Dumping PM2 logs for debugging:"
    sudo -u ubuntu pm2 logs template-api --lines 30 --nostream || true
fi

# =============================================================================
# Apply Initial Template (if template exists and database is empty)
# =============================================================================
if [[ -d "/opt/directus-template/src" ]]; then
    echo "=== Checking for Existing Data ==="

    # Check if database has existing non-system collections
    COLLECTIONS_RESPONSE=$(curl -s --max-time 30 \
        "http://localhost:${DIRECTUS_PORT}/collections" \
        -H "Authorization: Bearer ${TEMPLATE_API_TOKEN}") || true

    # Count non-system collections (those not starting with "directus_")
    CUSTOM_COLLECTIONS=$(echo "$COLLECTIONS_RESPONSE" | jq -r '[.data[]? | select(.collection | startswith("directus_") | not)] | length' 2>/dev/null || echo "0")

    if [[ "$CUSTOM_COLLECTIONS" -gt 0 ]]; then
        echo "  Found $CUSTOM_COLLECTIONS existing collection(s) - skipping template application"
        echo "  Database already contains data, preserving existing state"
    else
        echo "=== Applying Initial Template ==="
        write_status "running" "Applying initial template"
    
    # Determine the base URL based on SSL configuration
    if [[ "$SSL_CONFIGURED" == "true" ]]; then
        DIRECTUS_BASE_URL="https://${FQDN}"
    else
        DIRECTUS_BASE_URL="http://localhost:${DIRECTUS_PORT}"
    fi
    
    echo "  Applying template v${TEMPLATE_VERSION} to Directus..."
    echo "  Using Directus URL: $DIRECTUS_BASE_URL"
    
    # Call Template API to apply the template
    APPLY_RESPONSE=$(curl -s --max-time 300 -X POST \
        "http://localhost:3000/api/apply" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${TEMPLATE_API_TOKEN}" \
        -d "{
            \"directusUrl\": \"${DIRECTUS_BASE_URL}\",
            \"directusToken\": \"${TEMPLATE_API_TOKEN}\",
            \"templateLocation\": \"/opt/directus-template\",
            \"templateType\": \"local\"
        }") || true
    
    if echo "$APPLY_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        echo "  Template applied successfully!"
    else
        echo "  WARNING: Template application may have failed"
        echo "  Response: $APPLY_RESPONSE"
        echo "  You can manually apply the template later via the Template API"
    fi
    fi
else
    echo "=== No Template to Apply ==="
    echo "  Template directory /opt/directus-template/src not found"
    echo "  Skipping initial template application"
fi

# =============================================================================
# Configure Backup Cron Job (if bucket specified)
# =============================================================================
if [[ -n "$BACKUP_BUCKET" ]]; then
    echo "=== Configuring Backup Cron Job ==="
    write_status "running" "Configuring backup cron job"
    
    # Create backup script
    cat > /opt/directus/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
set -euo pipefail

# Load environment from PM2
eval $(sudo -u ubuntu pm2 env directus 2>/dev/null | grep -E '^(DB_|BACKUP_BUCKET|TENANT_NAME)' | sed 's/^/export /')

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/directus_backup_${TIMESTAMP}.sql.gz"

# Dump database
PGSSLMODE=require PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "${DB_DATABASE:-directus}" | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/${TENANT_NAME}/database/${TIMESTAMP}.sql.gz"

# Cleanup
rm -f "$BACKUP_FILE"

# Keep only last 30 backups
aws s3 ls "s3://${BACKUP_BUCKET}/${TENANT_NAME}/database/" | sort | head -n -30 | awk '{print $4}' | xargs -I {} aws s3 rm "s3://${BACKUP_BUCKET}/${TENANT_NAME}/database/{}"
BACKUP_SCRIPT
    
    chmod +x /opt/directus/backup.sh
    
    # Add cron job (daily at 2 AM)
    echo "0 2 * * * root /opt/directus/backup.sh >> /var/log/directus-backup.log 2>&1" > /etc/cron.d/directus-backup
    
    echo "  Backup cron job configured (daily at 2 AM UTC)"
else
    echo "=== Backup Not Configured ==="
    echo "  BACKUP_BUCKET not specified, skipping backup configuration"
fi

# =============================================================================
# Final Status
# =============================================================================
echo ""
echo "=============================================="
echo "=== Tenant Configuration Complete ==="
echo "=============================================="
echo "  Tenant: $TENANT_NAME"
# Show correct URL based on SSL configuration
if [[ "$SSL_CONFIGURED" == "true" ]]; then
    echo "  URL: https://$FQDN"
    ADMIN_URL="https://$FQDN/admin"
else
    echo "  URL: http://$FQDN (SSL terminates at ALB/CloudFront)"
    ADMIN_URL="http://$FQDN/admin"
fi
echo "  Template Version: $TEMPLATE_VERSION"
echo "  SSL on EC2: ${SSL_CONFIGURED:-false}"
echo "  Time: $(date)"
echo "=============================================="

write_status "complete" "Tenant configuration completed successfully"

# Ensure PM2 saves the final state
sudo -u ubuntu pm2 save

echo ""
echo "Directus is ready!"
echo "  Admin URL: $ADMIN_URL"
echo "  Admin Email: $ADMIN_EMAIL"
echo ""
