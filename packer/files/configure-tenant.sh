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
# Optional environment variables (for BSL 1.1 license consent):
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
# Configure Directus with PM2 (initial - Directus only)
# =============================================================================
echo "=== Configuring Directus ==="
write_status "running" "Configuring Directus"

# Export variables for envsubst (TEMPLATE_API_TOKEN will be set later)
export DIRECTUS_PORT DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
export DIRECTUS_KEY DIRECTUS_SECRET ADMIN_EMAIL ADMIN_PASSWORD FQDN
export TEMPLATE_API_TOKEN="placeholder-will-be-updated"

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
export PUBLIC_URL="https://$FQDN"
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
            echo ""
            echo "  Common issues:"
            echo "    - Let's Encrypt rate limits (wait 1 hour and retry)"
            echo "    - DNS not propagated (verify with: dig $FQDN)"
            echo "    - Firewall blocking port 80 (check security group)"
        fi
    else
        echo "  WARNING: DNS not yet propagated after 5 minutes, skipping SSL setup"
        echo "  Run 'sudo certbot --nginx -d $FQDN' manually after DNS propagates"
    fi
fi

# =============================================================================
# Create Template API Service Account
# =============================================================================
echo "=== Creating Template API Service Account ==="
write_status "running" "Creating Template API service account"

# Generate a secure token for the service account
TEMPLATE_API_TOKEN=$(openssl rand -hex 32)

# Service account email - use tenant FQDN for valid email format
SERVICE_ACCOUNT_EMAIL="template-api@${FQDN}"

# Authenticate as admin to get access token (with retry for race conditions)
echo "  Authenticating as admin..."
ACCESS_TOKEN=""
AUTH_ATTEMPTS=0
AUTH_MAX_ATTEMPTS=5

while [[ -z "$ACCESS_TOKEN" && $AUTH_ATTEMPTS -lt $AUTH_MAX_ATTEMPTS ]]; do
    AUTH_ATTEMPTS=$((AUTH_ATTEMPTS + 1))
    echo "  Authentication attempt $AUTH_ATTEMPTS/$AUTH_MAX_ATTEMPTS..."
    
    # Give Directus a moment to be fully ready
    sleep 2
    
    AUTH_RESPONSE=$(curl -s --max-time 30 -X POST "http://localhost:${DIRECTUS_PORT}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}" 2>&1) || true
    
    # Try to extract access token using jq (preferred) or grep (fallback)
    if command -v jq &> /dev/null; then
        ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.access_token // empty' 2>/dev/null) || true
    else
        ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4) || true
    fi
    
    if [[ -z "$ACCESS_TOKEN" ]]; then
        echo "  Auth response: $AUTH_RESPONSE"
        if [[ $AUTH_ATTEMPTS -lt $AUTH_MAX_ATTEMPTS ]]; then
            echo "  Retrying in 5 seconds..."
            sleep 5
        fi
    fi
done

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "  ERROR: Failed to authenticate as admin after $AUTH_MAX_ATTEMPTS attempts"
    echo "  Last response: $AUTH_RESPONSE"
    write_status "failed" "Failed to authenticate as admin"
    exit 1
fi

echo "  Authentication successful"

# Check if template-api user already exists
echo "  Checking for existing service account..."
EXISTING_USER_RESPONSE=$(curl -s --max-time 30 "http://localhost:${DIRECTUS_PORT}/users?limit=100" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}") || true

if command -v jq &> /dev/null; then
    EXISTING_USER=$(echo "$EXISTING_USER_RESPONSE" | jq -r --arg email "$SERVICE_ACCOUNT_EMAIL" '.data[] | select(.email == $email) | .id // empty' 2>/dev/null) || true
else
    # Fallback: grep for the email and extract nearby id
    if echo "$EXISTING_USER_RESPONSE" | grep -q "$SERVICE_ACCOUNT_EMAIL"; then
        EXISTING_USER=$(echo "$EXISTING_USER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4) || true
    else
        EXISTING_USER=""
    fi
fi

if [[ -n "$EXISTING_USER" ]]; then
    echo "  Service account already exists (ID: $EXISTING_USER), updating token..."
    # Update the existing user's token
    UPDATE_RESPONSE=$(curl -s --max-time 30 -X PATCH "http://localhost:${DIRECTUS_PORT}/users/${EXISTING_USER}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"token\": \"${TEMPLATE_API_TOKEN}\"}") || true
    
    if echo "$UPDATE_RESPONSE" | grep -q '"id"'; then
        echo "  Service account token updated successfully"
    else
        echo "  ERROR: Failed to update service account token"
        echo "  Response: $UPDATE_RESPONSE"
        write_status "failed" "Failed to update service account token"
        exit 1
    fi
else
    echo "  Creating service account user..."
    
    # Get the first role (Administrator) - on fresh install there's only one role
    # Note: We avoid using filter[] syntax as it has shell escaping issues
    ROLES_RESPONSE=$(curl -s --max-time 30 "http://localhost:${DIRECTUS_PORT}/roles?limit=1" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}") || true
    
    echo "  Roles API response: $ROLES_RESPONSE"
    
    if command -v jq &> /dev/null; then
        ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | jq -r '.data[0].id // empty' 2>/dev/null) || true
    else
        ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4) || true
    fi
    
    if [[ -z "$ADMIN_ROLE_ID" ]]; then
        echo "  ERROR: Could not find any roles"
        echo "  Roles response: $ROLES_RESPONSE"
        write_status "failed" "Could not find admin role"
        exit 1
    fi
    
    echo "  Found role: $ADMIN_ROLE_ID"
    
    # Create the service account with a valid email format
    CREATE_RESPONSE=$(curl -s --max-time 30 -X POST "http://localhost:${DIRECTUS_PORT}/users" \
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
    
    if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
        echo "  Service account created successfully"
    else
        echo "  ERROR: Failed to create service account"
        echo "  Response: $CREATE_RESPONSE"
        write_status "failed" "Failed to create service account"
        exit 1
    fi
fi

echo "  Template API service account configured"

# =============================================================================
# Update ecosystem config with Template API token and start Template API
# =============================================================================
echo "=== Starting Template API ==="
write_status "running" "Starting Template API"

# Re-export TEMPLATE_API_TOKEN with the real value and regenerate ecosystem config
export TEMPLATE_API_TOKEN
envsubst < /opt/directus/ecosystem.config.cjs.template > /opt/directus/ecosystem.config.cjs

# Start Template API from the ecosystem config
cd /opt/directus
sudo -u ubuntu pm2 start ecosystem.config.cjs --only template-api

# Save PM2 process list
sudo -u ubuntu pm2 save

# Wait for Template API to be healthy
if ! wait_for_service "http://localhost:3000/health" 60 5 "Template API"; then
    echo "  Dumping PM2 logs for debugging:"
    sudo -u ubuntu pm2 logs template-api --lines 30 --nostream || true
    write_status "failed" "Template API health check timed out"
    exit 1
fi

echo "  Template API started on port 3000"

# =============================================================================
# Apply Directus Template (schema and seed data)
# =============================================================================
echo "=== Applying Directus Template (v${TEMPLATE_VERSION}) ==="

# Check if template exists (cloned earlier in this script)
if [[ -d "/opt/directus-template" ]]; then
    echo "  Template found at /opt/directus-template"
    echo "  Version: $(cat /opt/directus-template/.version 2>/dev/null || echo 'unknown')"
    
    # Apply template using the Template API
    TEMPLATE_APPLY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/apply \
        -H "Content-Type: application/json" \
        -d "{
            \"templateLocation\": \"/opt/directus-template\",
            \"directusUrl\": \"http://localhost:${DIRECTUS_PORT}\",
            \"directusToken\": \"${TEMPLATE_API_TOKEN}\"
        }")
    
    # Check if apply was successful
    if echo "$TEMPLATE_APPLY_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        echo "  Template v${TEMPLATE_VERSION} applied successfully!"
    else
        ERROR_MSG=$(echo "$TEMPLATE_APPLY_RESPONSE" | jq -r '.error // "Unknown error"')
        echo "  WARNING: Template apply failed: $ERROR_MSG"
        echo "  Response: $TEMPLATE_APPLY_RESPONSE"
        # Don't exit - tenant can still function without template
    fi
else
    echo "  ERROR: Template not found at /opt/directus-template"
    echo "  Template should have been cloned earlier in this script"
    write_status "failed" "Template not found after clone"
    exit 1
fi

# =============================================================================
# Create backup scripts (if bucket configured)
# =============================================================================
if [[ -n "$BACKUP_BUCKET" ]]; then
    echo "=== Setting up backup scripts ==="
    write_status "running" "Setting up backup scripts"

    cat > /usr/local/bin/db-backup.sh << 'BACKUP_EOF'
#!/bin/bash
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup
# NOTE: pg_dump version should match or be newer than PostgreSQL server version.
# AMI includes PostgreSQL client from Ubuntu repos. If using Aurora/RDS with
# a newer PostgreSQL version, install matching client: sudo apt install postgresql-client-15
PGSSLMODE=require PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/databases/${TENANT_NAME}/${TIMESTAMP}.sql.gz" --region "$AWS_REGION"

# Cleanup
rm -f "$BACKUP_FILE"

echo "Backup completed: s3://${BACKUP_BUCKET}/databases/${TENANT_NAME}/${TIMESTAMP}.sql.gz"
BACKUP_EOF

    chmod +x /usr/local/bin/db-backup.sh

    # Create secure environment file for backup credentials (mode 600)
    mkdir -p /etc/directus
    cat > /etc/directus/backup.env << BACKUP_ENV_EOF
# Backup credentials - DO NOT EDIT (generated by configure-tenant.sh)
DB_HOST='$DB_HOST'
DB_PORT='$DB_PORT'
DB_NAME='$DB_NAME'
DB_USER='$DB_USER'
DB_PASSWORD='$DB_PASSWORD'
BACKUP_BUCKET='$BACKUP_BUCKET'
TENANT_NAME='$TENANT_NAME'
AWS_REGION='$AWS_REGION'
BACKUP_ENV_EOF

    chmod 600 /etc/directus/backup.env
    chown root:root /etc/directus/backup.env

    # Update backup script to source environment file
    sed -i '2a\source /etc/directus/backup.env' /usr/local/bin/db-backup.sh

    # Create cron job for daily backups at 2 AM
    cat > /etc/cron.d/directus-backup << 'CRON_EOF'
# Directus database backup - daily at 2 AM UTC
0 2 * * * root /usr/local/bin/db-backup.sh >> /var/log/db-backup.log 2>&1
CRON_EOF

    chmod 644 /etc/cron.d/directus-backup

    echo "  Backup scripts configured"
    echo "  Daily backups scheduled for 2 AM UTC"
fi

# =============================================================================
# Completion
# =============================================================================
echo ""
echo "=== Tenant configuration complete ==="
write_status "completed" "Tenant configuration successful"

# Summary with SSL status
if [[ "$SSL_CONFIGURED" == "true" ]]; then
    echo "  Directus URL: https://$FQDN"
    echo "  Template API: https://$FQDN/template-api/"
else
    echo "  Directus URL: http://$FQDN (SSL not configured)"
    echo "  Template API: http://$FQDN/template-api/"
    if [[ "$ENABLE_SSL" == "true" ]]; then
        echo ""
        echo "  ⚠️  SSL was enabled but certificate could not be obtained."
        echo "  Run 'sudo certbot --nginx -d $FQDN' to configure SSL manually."
    fi
fi
echo "  Admin Email: $ADMIN_EMAIL"
echo "  Template Version: $TEMPLATE_VERSION"
echo ""
echo "  Configuration completed at $(date)"
