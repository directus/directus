#!/bin/bash
# =============================================================================
# Tenant Configuration Script
# =============================================================================
# This script is called at EC2 instance launch via user-data to configure
# the tenant-specific settings. The AMI already has all dependencies installed.
#
# Required environment variables (passed via user-data):
#   TENANT_NAME         - Tenant identifier (e.g., "staging")
#   FQDN                - Fully qualified domain name (e.g., "staging.example.com")
#   NAME_PREFIX         - Prefix for resource names (e.g., "f2f")
#   DB_HOST             - Aurora/PostgreSQL host
#   DB_PORT             - Database port (default: 5432)
#   DB_NAME             - Database name (same as TENANT_NAME)
#   DB_USER             - Database user (same as TENANT_NAME)
#   DB_SECRET_ARN       - AWS Secrets Manager ARN for DB password
#   DIRECTUS_KEY        - Directus KEY (for encryption)
#   DIRECTUS_SECRET     - Directus SECRET (for encryption)
#   ADMIN_EMAIL         - Directus admin email
#   ADMIN_SECRET_ARN    - AWS Secrets Manager ARN for admin password
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
    "DB_SECRET_ARN"
    "DIRECTUS_KEY"
    "DIRECTUS_SECRET"
    "ADMIN_EMAIL"
    "ADMIN_SECRET_ARN"
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
# Fetch secrets from AWS Secrets Manager
# =============================================================================
echo "=== Fetching secrets from AWS Secrets Manager ==="

DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "$DB_SECRET_ARN" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text)

ADMIN_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "$ADMIN_SECRET_ARN" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text)

echo "  Secrets retrieved successfully"

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
# Configure Directus
# =============================================================================
echo "=== Configuring Directus ==="

# Create docker-compose.yml
cat > /opt/directus/docker-compose.yml << EOF
services:
  directus:
    image: directus/directus:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:${DIRECTUS_PORT}:8055"
    volumes:
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
      - ./database:/directus/database
      - ./logs:/directus/logs
    environment:
      # Database
      DB_CLIENT: "pg"
      DB_HOST: "${DB_HOST}"
      DB_PORT: "${DB_PORT}"
      DB_DATABASE: "${DB_NAME}"
      DB_USER: "${DB_USER}"
      DB_PASSWORD: "${DB_PASSWORD}"

      # Security
      KEY: "${DIRECTUS_KEY}"
      SECRET: "${DIRECTUS_SECRET}"

      # Admin user
      ADMIN_EMAIL: "${ADMIN_EMAIL}"
      ADMIN_PASSWORD: "${ADMIN_PASSWORD}"

      # Server
      PUBLIC_URL: "https://${FQDN}"

      # Cache & Performance
      CACHE_ENABLED: "true"
      CACHE_AUTO_PURGE: "true"
      CACHE_STORE: "memory"

      # Logging
      LOG_LEVEL: "info"
      LOG_STYLE: "pretty"

      # Extensions
      EXTENSIONS_PATH: "/directus/extensions"
      EXTENSIONS_AUTO_RELOAD: "false"

      # File storage
      STORAGE_LOCATIONS: "local"
      STORAGE_LOCAL_DRIVER: "local"
      STORAGE_LOCAL_ROOT: "/directus/uploads"

      # Rate limiting
      RATE_LIMITER_ENABLED: "true"
      RATE_LIMITER_STORE: "memory"
      RATE_LIMITER_POINTS: "50"
      RATE_LIMITER_DURATION: "1"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
EOF

# Create logs directory
mkdir -p /opt/directus/logs
chown -R ubuntu:ubuntu /opt/directus

echo "  Docker Compose configured"

# =============================================================================
# Start Directus
# =============================================================================
echo "=== Starting Directus ==="

cd /opt/directus
docker compose pull
docker compose up -d

# Wait for Directus to be healthy
echo "  Waiting for Directus to start..."
for i in {1..60}; do
    if curl -sf http://localhost:${DIRECTUS_PORT}/server/health > /dev/null 2>&1; then
        echo "  Directus is healthy!"
        break
    fi
    if [[ $i -eq 60 ]]; then
        echo "  WARNING: Directus health check timed out, but continuing..."
    fi
    sleep 5
done

# =============================================================================
# Configure SSL (if enabled)
# =============================================================================
if [[ "$ENABLE_SSL" == "true" ]]; then
    echo "=== Configuring SSL ==="

    # Wait for DNS to propagate
    echo "  Checking DNS resolution for $FQDN..."
    DNS_READY=false
    for i in {1..30}; do
        if host "$FQDN" 8.8.8.8 2>/dev/null | grep -q "has address"; then
            echo "  DNS resolved successfully"
            DNS_READY=true
            break
        fi
        echo "  Waiting for DNS propagation... (attempt $i/30)"
        sleep 10
    done

    if [[ "$DNS_READY" == "true" ]]; then
        echo "  Obtaining SSL certificate..."
        certbot --nginx \
            --non-interactive \
            --agree-tos \
            --email "$SSL_EMAIL" \
            --domains "$FQDN" \
            || echo "  WARNING: Certbot failed, SSL will need manual setup"
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
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/databases/${TENANT_NAME}/${TIMESTAMP}.sql.gz" --region "$AWS_REGION"

# Cleanup
rm -f "$BACKUP_FILE"

echo "Backup completed: s3://${BACKUP_BUCKET}/databases/${TENANT_NAME}/${TIMESTAMP}.sql.gz"
BACKUP_EOF

    chmod +x /usr/local/bin/db-backup.sh

    # Add environment variables to backup script
    sed -i "1a\\
DB_HOST='$DB_HOST'\\
DB_PORT='$DB_PORT'\\
DB_NAME='$DB_NAME'\\
DB_USER='$DB_USER'\\
DB_PASSWORD='$DB_PASSWORD'\\
BACKUP_BUCKET='$BACKUP_BUCKET'\\
TENANT_NAME='$TENANT_NAME'\\
AWS_REGION='$AWS_REGION'" /usr/local/bin/db-backup.sh

    # Set up daily cron job
    echo "0 2 * * * root /usr/local/bin/db-backup.sh >> /var/log/db-backup.log 2>&1" > /etc/cron.d/db-backup
    chmod 644 /etc/cron.d/db-backup

    echo "  Backup scripts configured"
fi

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
echo "    docker compose -f /opt/directus/docker-compose.yml ps"
echo "    curl -s http://localhost:${DIRECTUS_PORT}/server/health"
echo ""

# Signal success
touch /var/run/tenant-configured
