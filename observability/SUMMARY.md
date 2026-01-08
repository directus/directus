# Observability Stack Summary

## What Was Done

### 1. Organized Configuration Files
Moved all observability configs from root to `observability/` directory:
- ✅ All OTEL Collector configs in `observability/configs/`
- ✅ Tempo, Loki, Prometheus configs organized
- ✅ Environment-specific configurations separated
- ✅ Updated docker-compose.yml to reference new paths

### 2. Multiple Deployment Methods Supported

#### Development (Docker Compose)
- **Stack**: OTEL Collector → Tempo (traces) + Loki (logs) + Prometheus (metrics)
- **Visualization**: Grafana (all-in-one dashboard)
- **Config**: `observability/configs/otel-collector-config.development.yaml`
- **Start**: `docker compose up -d`

#### Production (AWS CloudWatch)
- **Stack**: OTEL Collector → CloudWatch Logs + CloudWatch Metrics (EMF) + X-Ray
- **Visualization**: AWS Console (CloudWatch + X-Ray)
- **Config**: `observability/configs/otel-collector-config.production.yaml`
- **Deployment**: Via `docker-compose.production.yml` or AMI script

#### Production (Custom AMI)
- **Stack**: OTEL Collector → CloudWatch + X-Ray
- **Installation**: Automated via `observability/scripts/setup-otel-collector.sh`
- **Integration**: Called from Packer build + tenant configuration
- **Config**: Generated dynamically during EC2 launch

### 3. Metrics Collected

#### Backend (API)
- ✅ HTTP server metrics (requests, duration, status codes)
- ✅ HTTP client metrics (outbound calls)
- ✅ Traces (complete request lifecycle)
- ✅ Structured logs (pino → OTEL)

#### Frontend (App)
- ✅ Web Vitals (LCP, FCP, TTFB, CLS, INP)
- ✅ API request tracking (endpoint, method, duration, status)
- ✅ Navigation tracking (route changes)
- ✅ Memory usage (JS heap)
- ✅ User interactions (ready for custom tracking)
- ✅ Component render times (ready for custom tracking)

### 4. Documentation Created
- ✅ `observability/README.md` - Main documentation
- ✅ `observability/AMI-INTEGRATION.md` - Packer integration guide
- ✅ `observability/STRUCTURE.md` - Directory structure reference
- ✅ `observability/SUMMARY.md` - This file

## File Locations

```
Root configs moved to: observability/configs/
AMI deployment script: observability/scripts/setup-otel-collector.sh
Production compose: observability/docker-compose.production.yml
Documentation: observability/*.md
```

## Next Steps for AMI Integration

1. **Update Packer template** (`packer/directus-base.pkr.hcl`):
   - Add provisioner to copy `setup-otel-collector.sh`
   - Install script in `/usr/local/bin/`

2. **Update tenant configuration** (`packer/files/configure-tenant.sh`):
   - Call `/usr/local/bin/setup-otel-collector.sh`
   - Add OPENTELEMETRY_* env vars to Directus .env

3. **Update IAM policy** (`packer/iam-policy.json`):
   - Add X-Ray permissions (PutTraceSegments, PutTelemetryRecords)
   - Add CloudWatch permissions (already present)

4. **Test the integration**:
   - Build AMI with Packer
   - Launch EC2 instance
   - Verify OTEL Collector is running: `sudo systemctl status otel-collector`
   - Check CloudWatch Logs for data
   - View traces in X-Ray console

## Environment Variables

### Development (.env files)
```bash
# api/.env
OPENTELEMETRY_ENABLED=true
OPENTELEMETRY_SERVICE_NAME=directus-api
OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# app/.env
VITE_OPENTELEMETRY_ENABLED=true
VITE_OPENTELEMETRY_SERVICE_NAME=directus-app
VITE_OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Production (EC2 User Data / ECS Task Definition)
```bash
ENVIRONMENT=production
AWS_REGION=us-east-1
TENANT_NAME=production
NAME_PREFIX=f2f

OPENTELEMETRY_ENABLED=true
OPENTELEMETRY_SERVICE_NAME=directus-api
OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Verification Commands

### Development
```bash
# Check if metrics are being collected
curl -s 'http://localhost:9090/api/v1/label/__name__/values' | jq -r '.data[]' | grep -E "web_vitals|app_"

# View traces
open http://localhost:3200  # Tempo

# View logs
open http://localhost:3100  # Loki

# Dashboard
open http://localhost:3000  # Grafana
```

### Production (AMI)
```bash
# OTEL Collector status
sudo systemctl status otel-collector

# OTEL Collector logs
sudo journalctl -u otel-collector -f

# Check CloudWatch Logs
aws logs describe-log-groups --log-group-name-prefix "/f2f/"

# View X-Ray traces
open https://console.aws.amazon.com/xray/
```

## Cost Estimate (Production)

For a single-tenant deployment:
- CloudWatch Logs: ~$5-10/month (depends on log volume)
- CloudWatch Metrics: ~$5-15/month (custom metrics)
- X-Ray: ~$5-10/month (1M traces)
- **Total**: ~$15-35/month per tenant

To optimize costs:
- Set log retention to 7-30 days
- Sample traces (10% of successful requests)
- Filter debug logs in production
- Aggregate metrics before export
