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
DB_NAME="${DB_NAME:-$TENANT_NAME}"
DB_USER="${DB_USER:-$TENANT_NAME}"
DIRECTUS_PORT="${DIRECTUS_PORT:-8055}"
ENABLE_SSL="${ENABLE_SSL:-true}"
SSL_EMAIL="${SSL_EMAIL:-$ADMIN_EMAIL}"
BACKUP_BUCKET="${BACKUP_BUCKET:-}"

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
# Configure Directus with PM2
# =============================================================================
echo "=== Configuring Directus ==="

# Export all variables for envsubst
export DIRECTUS_PORT DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
export DIRECTUS_KEY DIRECTUS_SECRET ADMIN_EMAIL ADMIN_PASSWORD FQDN

# Create ecosystem.config.cjs from template (using .cjs for CommonJS compatibility)
envsubst < /opt/directus/ecosystem.config.cjs.template > /opt/directus/ecosystem.config.cjs

# Set ownership
chown -R ubuntu:ubuntu /opt/directus

echo "  PM2 ecosystem configured"

# =============================================================================
# Start Directus with PM2
# =============================================================================
echo "=== Starting Directus ==="

cd /opt/directus

# Start with PM2 as ubuntu user (using .cjs file)
sudo -u ubuntu pm2 start ecosystem.config.cjs

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
        pm2 logs directus --lines 50 --nostream || true
        exit 1
    fi
    
    echo "  Waiting for Directus... (${HEALTH_CHECK_ELAPSED}s / ${HEALTH_CHECK_TIMEOUT}s)"
    sleep $HEALTH_CHECK_INTERVAL
done

# =============================================================================
# Configure SSL (if enabled)
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
            echo "  WARNING: Certbot failed (exit code: $CERTBOT_EXIT)"
            echo "  Output: $(cat "$CERTBOT_OUTPUT")"
            echo "  SSL will need manual setup: sudo certbot --nginx -d $FQDN"
        fi
        rm -f "$CERTBOT_OUTPUT"
    else
        echo "  WARNING: DNS not yet propagated, skipping SSL setup"
        echo "  Run 'sudo certbot --nginx -d $FQDN' manually after DNS propagates"
    fi
fi

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
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/databases/${TENANT_NAME}/${TIMESTAMP}.sql.gz" --region "$AWS_REGION"

# Cleanup
rm -f "$BACKUP_FILE"

echo "Backup completed: s3://${BACKUP_BUCKET}/databases/${TENANT_NAME}/${TIMESTAMP}.sql.gz"
BACKUP_EOF

    chmod +x /usr/local/bin/db-backup.sh

    # Create secure environment file for backup credentials (mode 600)
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

    # Set up daily cron job with flock to prevent overlapping runs
    # Uses UTC time - adjust CRON_TZ if needed for specific timezone
    cat > /etc/cron.d/db-backup << 'CRON_EOF'
# Daily database backup at 2 AM UTC
CRON_TZ=UTC
0 2 * * * root /usr/bin/flock -n /var/lock/db-backup.lock /usr/local/bin/db-backup.sh >> /var/log/db-backup.log 2>&1
CRON_EOF
    chmod 644 /etc/cron.d/db-backup

    echo "  Backup scripts configured"
fi

# =============================================================================
# Create update script
# =============================================================================
echo "=== Creating update script ==="

cat > /usr/local/bin/update-directus.sh << 'UPDATE_EOF'
#!/bin/bash
set -euo pipefail

echo "=== Updating Directus ==="
cd /opt/directus

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Build
pnpm build

# Restart PM2
pm2 restart directus

echo "=== Update complete ==="
UPDATE_EOF

chmod +x /usr/local/bin/update-directus.sh
chown ubuntu:ubuntu /usr/local/bin/update-directus.sh

# =============================================================================
# Final status
# =============================================================================
echo ""
echo "=== Tenant configuration complete at $(date) ==="
echo ""
echo "  Directus URL: https://${FQDN}"
echo "  Admin Email: ${ADMIN_EMAIL}"
echo ""
echo "  Check status with:"
echo "    pm2 status"
echo "    pm2 logs directus"
echo "    curl -s http://localhost:${DIRECTUS_PORT}/server/health"
echo ""
echo "  Update Directus with:"
echo "    sudo -u ubuntu /usr/local/bin/update-directus.sh"
echo ""

# Signal success
touch /var/run/tenant-configured
