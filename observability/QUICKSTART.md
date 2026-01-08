# Quick Start Guide

## 🚀 Get Started in 2 Minutes

### For Development (Docker Compose)

```bash
# 1. Clone and setup
cd /path/to/directus

# 2. Start observability stack
docker compose up -d

# 3. Access dashboards
open http://localhost:3000  # Grafana (admin/admin)
open http://localhost:9090  # Prometheus  
open http://localhost:3200  # Tempo
open http://localhost:3100  # Loki

# 4. Generate some traffic
for i in {1..10}; do curl http://localhost:8055/server/info; done

# 5. View metrics (wait 60s for export)
curl -s 'http://localhost:9090/api/v1/label/__name__/values' | jq -r '.data[]' | grep "web_vitals"
```

### For Production (AMI)

The setup is fully automated! Just:

1. Build AMI with Packer (includes OTEL script)
2. Launch EC2 instance
3. The `configure-tenant.sh` script automatically sets up OTEL Collector
4. View data in AWS Console:
   - CloudWatch Logs: `/${NAME_PREFIX}/${TENANT_NAME}/otel-logs`
   - CloudWatch Metrics: Namespace `${NAME_PREFIX}/${ENVIRONMENT}`
   - X-Ray: Service map and traces

## 📁 What's Where?

```
observability/
├── configs/              ← All OTEL/Tempo/Loki/Prometheus configs
├── scripts/              ← AMI deployment automation
├── README.md             ← Full documentation
├── SUMMARY.md            ← What was done + next steps
├── AMI-INTEGRATION.md    ← How to integrate with Packer
└── STRUCTURE.md          ← Directory reference
```

## 🔍 Verify Everything Works

### Development
```bash
# Check OTEL Collector
docker compose ps otel-collector

# Check metrics
curl http://localhost:8888/metrics | grep http_server

# Check Prometheus
curl http://localhost:9090/-/healthy
```

### Production (AMI)
```bash
# On EC2 instance
sudo systemctl status otel-collector
sudo journalctl -u otel-collector -f

# From AWS CLI
aws logs describe-log-groups --log-group-name-prefix "/f2f/"
aws xray get-service-graph --start-time $(date -u -d '1 hour ago' +%s) --end-time $(date -u +%s)
```

## 📊 Metrics Being Collected

### Backend
- HTTP requests (method, endpoint, status, duration)
- Outbound API calls  
- Full request traces
- Structured logs

### Frontend  
- Web Vitals: LCP, FCP, TTFB, CLS, INP
- API call tracking
- Page navigations
- Memory usage
- Ready for custom tracking!

## 🎯 Next Steps

1. **Explore Grafana**: Create custom dashboards
2. **Set up alerts**: CloudWatch Alarms or Grafana alerts
3. **Integrate with Packer**: See `AMI-INTEGRATION.md`
4. **Customize metrics**: Add business-specific metrics
5. **Optimize costs**: Implement sampling and filtering

## 📖 Full Documentation

- `README.md` - Complete setup guide for all deployment methods
- `SUMMARY.md` - Overview of what was implemented
- `AMI-INTEGRATION.md` - Step-by-step Packer integration
- `STRUCTURE.md` - Directory and file reference

## 💡 Common Tasks

### Restart OTEL Collector (Docker)
```bash
docker compose restart otel-collector
docker compose logs -f otel-collector
```

### Restart OTEL Collector (AMI)
```bash
sudo systemctl restart otel-collector
sudo journalctl -u otel-collector -f
```

### Switch to Production Config (Docker)
```bash
export OTEL_COLLECTOR_CONFIG_FILE=./observability/configs/otel-collector-config.production.yaml
export AWS_REGION=us-east-1
export ENVIRONMENT=production
docker compose up -d otel-collector
```

### View Real-time Logs
```bash
# Development
docker compose logs -f directus otel-collector

# Production (AMI)
sudo journalctl -u otel-collector -u directus -f
```
