#!/bin/bash
# =============================================================================
# OpenTelemetry Collector Setup Script for AMI Deployment
# =============================================================================
# This script configures and starts the OpenTelemetry Collector on an EC2
# instance launched from the custom AMI.
#
# Usage:
#   This script is called from configure-tenant.sh during instance launch
#
# Required environment variables:
#   AWS_REGION          - AWS region (e.g., us-east-1)
#   ENVIRONMENT         - Environment name (e.g., production, staging)
#   TENANT_NAME         - Tenant identifier
#   NAME_PREFIX         - Resource name prefix
#
# Installation directory: /opt/otel-collector/
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/otel-collector"
CONFIG_DIR="${INSTALL_DIR}/config"
LOG_FILE="/var/log/otel-collector-setup.log"

# Redirect output to log
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== OpenTelemetry Collector Setup ==="
echo "Timestamp: $(date -Iseconds)"

# =============================================================================
# Validate Environment
# =============================================================================

if [[ -z "${AWS_REGION:-}" ]]; then
    echo "ERROR: AWS_REGION is required"
    exit 1
fi

if [[ -z "${ENVIRONMENT:-}" ]]; then
    echo "ERROR: ENVIRONMENT is required"
    exit 1
fi

TENANT_NAME="${TENANT_NAME:-default}"
NAME_PREFIX="${NAME_PREFIX:-directus}"

# =============================================================================
# Install OpenTelemetry Collector
# =============================================================================

echo "Installing OpenTelemetry Collector..."

# Create directories
sudo mkdir -p "${CONFIG_DIR}"
sudo mkdir -p "${INSTALL_DIR}/data"

# Download and install OTEL Collector (contrib distribution for CloudWatch support)
OTEL_VERSION="0.115.0"  # Update as needed
ARCH="amd64"

wget -q "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${OTEL_VERSION}/otelcol-contrib_${OTEL_VERSION}_linux_${ARCH}.tar.gz" \
    -O /tmp/otelcol.tar.gz

sudo tar -xzf /tmp/otelcol.tar.gz -C "${INSTALL_DIR}"
sudo chmod +x "${INSTALL_DIR}/otelcol-contrib"
rm /tmp/otelcol.tar.gz

echo "✓ OpenTelemetry Collector ${OTEL_VERSION} installed"

# =============================================================================
# Generate Configuration
# =============================================================================

echo "Generating OpenTelemetry Collector configuration..."

# Get instance metadata
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
AVAILABILITY_ZONE=$(ec2-metadata --availability-zone | cut -d " " -f 2)

cat > "${CONFIG_DIR}/otel-collector-config.yaml" <<EOF
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 8192

  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128

  resourcedetection:
    detectors: [env, ec2]
    timeout: 5s

  resource:
    attributes:
      - key: environment
        value: ${ENVIRONMENT}
        action: upsert
      - key: tenant.name
        value: ${TENANT_NAME}
        action: upsert
      - key: service.namespace
        value: directus
        action: upsert
      - key: cloud.provider
        value: aws
        action: upsert
      - key: cloud.region
        value: ${AWS_REGION}
        action: upsert
      - key: cloud.availability_zone
        value: ${AVAILABILITY_ZONE}
        action: upsert
      - key: cloud.instance_id
        value: ${INSTANCE_ID}
        action: upsert

exporters:
  # AWS CloudWatch Logs
  awscloudwatchlogs:
    region: ${AWS_REGION}
    log_group_name: /${NAME_PREFIX}/${TENANT_NAME}/otel-logs
    log_stream_name: ${INSTANCE_ID}

  # AWS CloudWatch Metrics (EMF format)
  awsemf:
    region: ${AWS_REGION}
    namespace: ${NAME_PREFIX}/${ENVIRONMENT}
    log_group_name: /${NAME_PREFIX}/${TENANT_NAME}/otel-metrics
    log_stream_name: ${INSTANCE_ID}
    dimension_rollup_option: NoDimensionRollup
    resource_to_telemetry_conversion:
      enabled: true

  # AWS X-Ray for traces
  awsxray:
    region: ${AWS_REGION}
    index_all_attributes: true
    indexed_attributes:
      - http.method
      - http.status_code
      - http.url
      - service.name

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, resource, batch]
      exporters: [awsxray]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, resource, batch]
      exporters: [awscloudwatchlogs]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, resource, batch]
      exporters: [awsemf]

  telemetry:
    logs:
      level: info
    metrics:
      level: detailed
      address: 0.0.0.0:8888
EOF

echo "✓ Configuration generated at ${CONFIG_DIR}/otel-collector-config.yaml"

# =============================================================================
# Create systemd Service
# =============================================================================

echo "Creating systemd service..."

sudo tee /etc/systemd/system/otel-collector.service > /dev/null <<EOF
[Unit]
Description=OpenTelemetry Collector
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/otelcol-contrib --config=${CONFIG_DIR}/otel-collector-config.yaml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=otel-collector

# Resource limits
LimitNOFILE=65536
LimitNPROC=8192

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable otel-collector.service

echo "✓ Systemd service created and enabled"

# =============================================================================
# Start Service
# =============================================================================

echo "Starting OpenTelemetry Collector..."

sudo systemctl start otel-collector.service

# Wait for service to be ready
sleep 5

if sudo systemctl is-active --quiet otel-collector.service; then
    echo "✓ OpenTelemetry Collector is running"
    sudo systemctl status otel-collector.service --no-pager
else
    echo "ERROR: OpenTelemetry Collector failed to start"
    sudo journalctl -u otel-collector.service --no-pager -n 50
    exit 1
fi

# =============================================================================
# Verification
# =============================================================================

echo "Verifying OpenTelemetry Collector endpoints..."

# Check health endpoint
if curl -sf http://localhost:13133/ > /dev/null 2>&1; then
    echo "✓ Health endpoint is accessible"
else
    echo "WARNING: Health endpoint not accessible"
fi

# Check metrics endpoint
if curl -sf http://localhost:8888/metrics > /dev/null 2>&1; then
    echo "✓ Metrics endpoint is accessible"
else
    echo "WARNING: Metrics endpoint not accessible"
fi

echo "=== OpenTelemetry Collector Setup Complete ==="
echo "Endpoints:"
echo "  - OTLP gRPC: localhost:4317"
echo "  - OTLP HTTP: localhost:4318"
echo "  - Metrics:   localhost:8888/metrics"
echo ""
echo "Logs: sudo journalctl -u otel-collector.service -f"
