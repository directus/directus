# OpenTelemetry Integration for Packer AMI

## Overview

This guide shows how to integrate the OpenTelemetry observability stack into the existing Packer AMI build process.

## Changes Required

### 1. Update Packer Build Script

Add to `packer/directus-base.pkr.hcl` provisioners (after Directus installation):

```hcl
  # Copy OpenTelemetry setup scripts
  provisioner "file" {
    source      = "${path.root}/../observability/scripts/setup-otel-collector.sh"
    destination = "/tmp/setup-otel-collector.sh"
  }

  # Make script executable
  provisioner "shell" {
    inline = [
      "sudo mv /tmp/setup-otel-collector.sh /usr/local/bin/",
      "sudo chmod +x /usr/local/bin/setup-otel-collector.sh"
    ]
  }
```

### 2. Update tenant configuration script

Modify `packer/files/configure-tenant.sh` to call the OTEL setup:

```bash
# After database setup and before starting Directus
echo "=== Setting up OpenTelemetry Collector ==="
/usr/local/bin/setup-otel-collector.sh

# Update Directus environment to use OTEL
cat >> "${DIRECTUS_DIR}/.env" <<EOF

# OpenTelemetry Configuration
OPENTELEMETRY_ENABLED=true
OPENTELEMETRY_SERVICE_NAME=directus-api
OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
EOF
```

### 3. Update CloudWatch Agent Configuration

Modify `packer/files/cloudwatch-agent.json.template` to include OTEL Collector logs:

```json
{
  "file_path": "/var/log/otel-collector-setup.log",
  "log_group_name": "/aws/ec2/${NAME_PREFIX}-${TENANT_NAME}/otel-setup",
  "log_stream_name": "{instance_id}",
  "retention_in_days": 7
}
```

### 4. Update IAM Policy

Add to `packer/iam-policy.json`:

```json
{
  "Effect": "Allow",
  "Action": [
    "xray:PutTraceSegments",
    "xray:PutTelemetryRecords"
  ],
  "Resource": "*"
}
```

## CloudWatch Resources Created

### Log Groups
- `/${NAME_PREFIX}/${TENANT_NAME}/otel-logs` - Application logs from OTEL
- `/${NAME_PREFIX}/${TENANT_NAME}/otel-metrics` - EMF metrics
- `/${NAME_PREFIX}/${TENANT_NAME}/otel-setup` - Setup logs

### Metrics Namespace
- `${NAME_PREFIX}/${ENVIRONMENT}` - All custom metrics

### X-Ray
- Traces automatically appear in X-Ray service map

## Migration from CloudWatch Agent

The OTEL Collector **replaces** the CloudWatch Agent for application logs and metrics.

### What to Keep
- CloudWatch Agent for system metrics (CPU, memory, disk)
- CloudWatch Agent for syslog/nginx access logs (if desired)

### What Changes
- Application logs: PM2/Directus logs → OTEL → CloudWatch Logs
- Application metrics: Custom metrics → OTEL → CloudWatch EMF
- Traces: Not available before → OTEL → X-Ray

## Development vs Production

### Development (Docker Compose)
```bash
cd /path/to/directus
docker compose up -d
# Access Grafana: http://localhost:3000
```

### Production (AMI)
The OTEL Collector is automatically configured during EC2 launch via user-data.

Configuration happens in `configure-tenant.sh` using environment variables passed to the instance.

## Verification

### Check OTEL Collector Status
```bash
sudo systemctl status otel-collector
sudo journalctl -u otel-collector -f
```

### Test OTLP Endpoints
```bash
# Health check
curl http://localhost:13133/

# Metrics
curl http://localhost:8888/metrics
```

### View in AWS Console

1. **CloudWatch Logs**: Navigate to log groups starting with your NAME_PREFIX
2. **CloudWatch Metrics**: Check namespace `${NAME_PREFIX}/${ENVIRONMENT}`
3. **X-Ray**: Open X-Ray console to view service map and traces

## Cost Considerations

- **CloudWatch Logs**: ~$0.50/GB ingested + $0.03/GB stored
- **CloudWatch Metrics**: $0.30 per custom metric per month
- **X-Ray**: $5.00 per 1 million traces recorded, $0.50 per 1 million retrieved

Estimated cost for small deployment: $10-30/month

To reduce costs:
- Set shorter log retention (7-30 days)
- Sample traces (10% of successful requests)
- Filter debug/info logs in production
- Use metric aggregation in OTEL Collector

## Troubleshooting

### OTEL Collector not starting
```bash
# Check logs
sudo journalctl -u otel-collector -n 100

# Validate config
/opt/otel-collector/otelcol-contrib --config=/opt/otel-collector/config/otel-collector-config.yaml --dry-run
```

### No data in CloudWatch
```bash
# Verify IAM permissions
aws sts get-caller-identity

# Check CloudWatch Logs
aws logs describe-log-groups --log-group-name-prefix "/${NAME_PREFIX}/"

# Test CloudWatch access
aws logs create-log-stream \
  --log-group-name "/${NAME_PREFIX}/${TENANT_NAME}/otel-logs" \
  --log-stream-name test-stream
```

### No traces in X-Ray
```bash
# Verify X-Ray daemon is receiving data
curl http://localhost:2000/  # X-Ray SDK endpoint

# Check X-Ray service
aws xray get-service-graph \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```
