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
#
# Optional environment variables (for BSL 1.1 license consent):
#   PROJECT_OWNER       - Project owner email (defaults to ADMIN_EMAIL)
#   PROJECT_USAGE       - Usage type: personal/educational/non-profit/commercial/agency
#   ORG_NAME            - Organization name
#   PRODUCT_UPDATES     - Whether to receive product updates (true/false)
# =============================================================================

set -euo pipefail

LOG_FILE="/var/log/tenant-configure.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Starting tenant configuration at $(date) ==="

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
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: Required variable $var is not set"
        exit 1
    fi
done

# Set defaults
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-directus}"
DB_USER="${DB_USER:-$TENANT_NAME}"
DIRECTUS_PORT="${DIRECTUS_PORT:-8055}"
ENABLE_SSL="${ENABLE_SSL:-true}"
SSL_EMAIL="${SSL_EMAIL:-$ADMIN_EMAIL}"
BACKUP_BUCKET="${BACKUP_BUCKET:-}"

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

# =============================================================================
# Configure Nginx
# =============================================================================
echo "=== Configuring Nginx ==="

# Create nginx config from template
export FQDN DIRECTUS_PORT
envsubst '${FQDN} ${DIRECTUS_PORT}' < /etc/nginx/templates/nginx-directus.conf.template \
    > /etc/nginx/sites-available/directus

# Enable the site
ln -sf /etc/nginx/sites-available/directus /etc/nginx/sites-enabled/directus

# Test and reload nginx
nginx -t
systemctl reload nginx

echo "  Nginx configured for $FQDN"

# =============================================================================
# Configure CloudWatch Agent
# =============================================================================
echo "=== Configuring CloudWatch Agent ==="

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
    echo "  WARNING: Bootstrap failed with exit code $BOOTSTRAP_EXIT"
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

cd /opt/directus

# Start only Directus app with PM2 as ubuntu user (Template API started later)
sudo -u ubuntu pm2 start ecosystem.config.cjs --only directus

# Save PM2 process list for startup
sudo -u ubuntu pm2 save

# Wait for Directus to be healthy (with timeout)
echo "  Waiting for Directus to start..."
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=5
HEALTH_CHECK_ELAPSED=0

while true; do
    if curl -sf http://localhost:${DIRECTUS_PORT}/server/health > /dev/null 2>&1; then
        echo "  Directus is healthy!"
        break
    fi
    
    HEALTH_CHECK_ELAPSED=$((HEALTH_CHECK_ELAPSED + HEALTH_CHECK_INTERVAL))
    if [[ $HEALTH_CHECK_ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]]; then
        echo "  ERROR: Directus health check timed out after ${HEALTH_CHECK_TIMEOUT}s"
        sudo -u ubuntu pm2 logs directus --lines 50 --nostream || true
        exit 1
    fi
    
    echo "  Waiting for Directus... (${HEALTH_CHECK_ELAPSED}s / ${HEALTH_CHECK_TIMEOUT}s)"
    sleep $HEALTH_CHECK_INTERVAL
done

# =============================================================================
# Configure SSL (if enabled) - BEFORE service account to ensure HTTPS works
# =============================================================================
if [[ "$ENABLE_SSL" == "true" ]]; then
    echo "=== Configuring SSL ==="

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
        CERTBOT_OUTPUT=$(mktemp)
        if certbot --nginx \
            --non-interactive \
            --agree-tos \
            --email "$SSL_EMAIL" \
            --domains "$FQDN" \
            2>&1 | tee "$CERTBOT_OUTPUT"; then
            echo "  SSL certificate obtained successfully"
        else
            CERTBOT_EXIT=$?
            echo "  ERROR: Certbot failed (exit code: $CERTBOT_EXIT)"
            echo "  Output: $(cat "$CERTBOT_OUTPUT")"
            echo "  SSL will need manual setup: sudo certbot --nginx -d $FQDN"
            # Don't exit - continue with service account setup
        fi
        rm -f "$CERTBOT_OUTPUT"
    else
        echo "  WARNING: DNS not yet propagated after 5 minutes, skipping SSL setup"
        echo "  Run 'sudo certbot --nginx -d $FQDN' manually after DNS propagates"
    fi
fi

# =============================================================================
# Create Template API Service Account
# =============================================================================
echo "=== Creating Template API Service Account ==="

# Generate a secure token for the service account
TEMPLATE_API_TOKEN=$(openssl rand -hex 32)

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
    
    AUTH_RESPONSE=$(curl -s -X POST "http://localhost:${DIRECTUS_PORT}/auth/login" \
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
    exit 1
fi

echo "  Authentication successful"

# Check if template-api user already exists
echo "  Checking for existing service account..."
EXISTING_USER_RESPONSE=$(curl -s "http://localhost:${DIRECTUS_PORT}/users?filter[email][_eq]=template-api@internal.local" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>&1) || true

if command -v jq &> /dev/null; then
    EXISTING_USER=$(echo "$EXISTING_USER_RESPONSE" | jq -r '.data[0].id // empty' 2>/dev/null) || true
else
    EXISTING_USER=$(echo "$EXISTING_USER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4) || true
fi

if [[ -n "$EXISTING_USER" ]]; then
    echo "  Service account already exists (ID: $EXISTING_USER), updating token..."
    # Update the existing user's token
    UPDATE_RESPONSE=$(curl -s -X PATCH "http://localhost:${DIRECTUS_PORT}/users/${EXISTING_USER}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"token\": \"${TEMPLATE_API_TOKEN}\"}" 2>&1) || true
    
    if echo "$UPDATE_RESPONSE" | grep -q '"id"'; then
        echo "  Service account token updated successfully"
    else
        echo "  ERROR: Failed to update service account token"
        echo "  Response: $UPDATE_RESPONSE"
        exit 1
    fi
else
    echo "  Creating service account user..."
    
    # Get the Administrator role ID (Directus 11.x uses role name, not admin_access field)
    ROLES_RESPONSE=$(curl -s "http://localhost:${DIRECTUS_PORT}/roles?filter[name][_eq]=Administrator&limit=1" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>&1) || true
    
    if command -v jq &> /dev/null; then
        ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | jq -r '.data[0].id // empty' 2>/dev/null) || true
    else
        ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4) || true
    fi
    
    if [[ -z "$ADMIN_ROLE_ID" ]]; then
        echo "  ERROR: Could not find Administrator role"
        echo "  Roles response: $ROLES_RESPONSE"
        exit 1
    fi
    
    echo "  Found Administrator role: $ADMIN_ROLE_ID"
    
    # Create the service account
    CREATE_RESPONSE=$(curl -s -X POST "http://localhost:${DIRECTUS_PORT}/users" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"template-api@internal.local\",
            \"password\": \"$(openssl rand -hex 32)\",
            \"role\": \"${ADMIN_ROLE_ID}\",
            \"token\": \"${TEMPLATE_API_TOKEN}\",
            \"first_name\": \"Template\",
            \"last_name\": \"API Service\",
            \"status\": \"active\"
        }" 2>&1) || true
    
    if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
        echo "  Service account created successfully"
    else
        echo "  ERROR: Failed to create service account"
        echo "  Response: $CREATE_RESPONSE"
        exit 1
    fi
fi

echo "  Template API service account configured"

# =============================================================================
# Update ecosystem config with Template API token and start Template API
# =============================================================================
echo "=== Starting Template API ==="

# Re-export TEMPLATE_API_TOKEN with the real value and regenerate ecosystem config
export TEMPLATE_API_TOKEN
envsubst < /opt/directus/ecosystem.config.cjs.template > /opt/directus/ecosystem.config.cjs

# Start Template API from the ecosystem config
cd /opt/directus
sudo -u ubuntu pm2 start ecosystem.config.cjs --only template-api

# Save PM2 process list
sudo -u ubuntu pm2 save

# Wait for Template API to be healthy
echo "  Waiting for Template API to start..."
TEMPLATE_API_TIMEOUT=60
TEMPLATE_API_ELAPSED=0

while true; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "  Template API is healthy!"
        break
    fi
    
    TEMPLATE_API_ELAPSED=$((TEMPLATE_API_ELAPSED + 5))
    if [[ $TEMPLATE_API_ELAPSED -ge $TEMPLATE_API_TIMEOUT ]]; then
        echo "  ERROR: Template API health check timed out"
        pm2 logs template-api --lines 30 --nostream || true
        exit 1
    fi
    
    echo "  Waiting for Template API... (${TEMPLATE_API_ELAPSED}s / ${TEMPLATE_API_TIMEOUT}s)"
    sleep 5
done

echo "  Template API started on port 3000"

# =============================================================================
# Create backup scripts (if bucket configured)
# =============================================================================
if [[ -n "$BACKUP_BUCKET" ]]; then
    echo "=== Setting up backup scripts ==="

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
# Final Status
# =============================================================================
echo ""
echo "=== Tenant configuration complete ==="
echo "  Directus URL: https://$FQDN"
echo "  Admin Email: $ADMIN_EMAIL"
echo "  Template API: https://$FQDN/template-api/"
echo ""
echo "  Configuration completed at $(date)"
