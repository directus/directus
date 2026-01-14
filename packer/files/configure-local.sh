#!/bin/bash
# =============================================================================
# Local Configuration Script for VirtualBox/VMware
# =============================================================================
# This script configures Directus for local development/testing.
# Unlike the AWS tenant script, this uses local PostgreSQL and simpler setup.
#
# Usage:
#   sudo /usr/local/bin/configure-local.sh [OPTIONS]
#
# Options:
#   --db-host HOST       PostgreSQL host (default: localhost)
#   --db-port PORT       PostgreSQL port (default: 5432)
#   --db-name NAME       Database name (default: directus)
#   --db-user USER       Database user (default: directus)
#   --db-password PASS   Database password (default: directus)
#   --admin-email EMAIL  Admin email (default: admin@example.com)
#   --admin-password PW  Admin password (default: admin123)
#   --port PORT          Directus port (default: 8055)
#   --install-postgres   Install PostgreSQL locally
# =============================================================================

set -euo pipefail

# Default values
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-directus}"
DB_USER="${DB_USER:-directus}"
DB_PASSWORD="${DB_PASSWORD:-directus}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
DIRECTUS_PORT="${DIRECTUS_PORT:-8055}"
INSTALL_POSTGRES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --db-host) DB_HOST="$2"; shift 2 ;;
    --db-port) DB_PORT="$2"; shift 2 ;;
    --db-name) DB_NAME="$2"; shift 2 ;;
    --db-user) DB_USER="$2"; shift 2 ;;
    --db-password) DB_PASSWORD="$2"; shift 2 ;;
    --admin-email) ADMIN_EMAIL="$2"; shift 2 ;;
    --admin-password) ADMIN_PASSWORD="$2"; shift 2 ;;
    --port) DIRECTUS_PORT="$2"; shift 2 ;;
    --install-postgres) INSTALL_POSTGRES=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

LOG_FILE="/var/log/configure-local.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Starting local configuration at $(date) ==="
echo "  DB Host: $DB_HOST"
echo "  DB Name: $DB_NAME"
echo "  Admin Email: $ADMIN_EMAIL"
echo "  Directus Port: $DIRECTUS_PORT"

# =============================================================================
# Install PostgreSQL (if requested)
# =============================================================================
if [[ "$INSTALL_POSTGRES" == "true" ]]; then
    echo "=== Installing PostgreSQL ==="
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib

    # Start PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql

    # Create database and user
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

    echo "  PostgreSQL installed and configured"
fi

# =============================================================================
# Generate Directus keys
# =============================================================================
echo "=== Generating Directus keys ==="
DIRECTUS_KEY=$(openssl rand -hex 32)
DIRECTUS_SECRET=$(openssl rand -hex 32)

# =============================================================================
# Configure Nginx for localhost
# =============================================================================
echo "=== Configuring Nginx ==="

cat > /etc/nginx/sites-available/directus << NGINX_EOF
upstream directus_backend {
    server 127.0.0.1:${DIRECTUS_PORT};
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name localhost _;

    location / {
        proxy_pass http://directus_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_buffering off;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/directus /etc/nginx/sites-enabled/directus
nginx -t
systemctl reload nginx

echo "  Nginx configured"

# =============================================================================
# Configure Directus with PM2
# =============================================================================
echo "=== Configuring Directus ==="

# Create ecosystem.config.js
cat > /opt/directus/ecosystem.config.js << PM2_EOF
module.exports = {
  apps: [
    {
      name: 'directus',
      cwd: '/opt/directus',
      script: 'pnpm',
      args: '--filter @directus/api start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: '${DIRECTUS_PORT}',
        DB_CLIENT: 'pg',
        DB_HOST: '${DB_HOST}',
        DB_PORT: '${DB_PORT}',
        DB_DATABASE: '${DB_NAME}',
        DB_USER: '${DB_USER}',
        DB_PASSWORD: '${DB_PASSWORD}',
        KEY: '${DIRECTUS_KEY}',
        SECRET: '${DIRECTUS_SECRET}',
        ADMIN_EMAIL: '${ADMIN_EMAIL}',
        ADMIN_PASSWORD: '${ADMIN_PASSWORD}',
        PUBLIC_URL: 'http://localhost',
        CACHE_ENABLED: 'true',
        CACHE_AUTO_PURGE: 'true',
        CACHE_STORE: 'memory',
        LOG_LEVEL: 'info',
        LOG_STYLE: 'pretty',
        EXTENSIONS_PATH: '/opt/directus/extensions',
        EXTENSIONS_AUTO_RELOAD: 'true',
        STORAGE_LOCATIONS: 'local',
        STORAGE_LOCAL_DRIVER: 'local',
        STORAGE_LOCAL_ROOT: '/opt/directus/uploads',
        RATE_LIMITER_ENABLED: 'false',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/directus/logs/error.log',
      out_file: '/opt/directus/logs/out.log',
      log_file: '/opt/directus/logs/combined.log',
      time: true,
    },
  ],
};
PM2_EOF

chown -R ubuntu:ubuntu /opt/directus

echo "  PM2 ecosystem configured"

# =============================================================================
# Start Directus
# =============================================================================
echo "=== Starting Directus ==="

cd /opt/directus
sudo -u ubuntu pm2 start ecosystem.config.js
sudo -u ubuntu pm2 save

# Wait for Directus to be healthy
echo "  Waiting for Directus to start..."
for i in {1..60}; do
    if curl -sf http://localhost:${DIRECTUS_PORT}/server/health > /dev/null 2>&1; then
        echo "  Directus is healthy!"
        break
    fi
    if [[ $i -eq 60 ]]; then
        echo "  WARNING: Directus health check timed out"
    fi
    sleep 5
done

# =============================================================================
# Create helper scripts
# =============================================================================
echo "=== Creating helper scripts ==="

# Update script
cat > /usr/local/bin/update-directus.sh << 'UPDATE_EOF'
#!/bin/bash
set -euo pipefail
echo "=== Updating Directus ==="
cd /opt/directus
git pull origin main
pnpm install
NODE_OPTIONS='--max-old-space-size=4096' pnpm build
pm2 restart directus
echo "=== Update complete ==="
UPDATE_EOF
chmod +x /usr/local/bin/update-directus.sh

# Status script
cat > /usr/local/bin/directus-status.sh << 'STATUS_EOF'
#!/bin/bash
echo "=== Directus Status ==="
pm2 status directus
echo ""
echo "=== Health Check ==="
curl -s http://localhost:8055/server/health | jq . || echo "Health check failed"
echo ""
echo "=== Recent Logs ==="
pm2 logs directus --lines 20 --nostream
STATUS_EOF
chmod +x /usr/local/bin/directus-status.sh

# =============================================================================
# Final status
# =============================================================================
echo ""
echo "=== Local configuration complete at $(date) ==="
echo ""
echo "  Directus URL: http://localhost"
echo "  Admin Email: ${ADMIN_EMAIL}"
echo "  Admin Password: ${ADMIN_PASSWORD}"
echo ""
echo "  Commands:"
echo "    pm2 status                     - Check process status"
echo "    pm2 logs directus              - View logs"
echo "    directus-status.sh             - Full status check"
echo "    update-directus.sh             - Update from git"
echo ""

touch /var/run/local-configured
