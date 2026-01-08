observability/
├── configs/                          # Configuration files
│   ├── .env.observability            # Development environment variables
│   ├── .env.observability.example    # Template for environment variables
│   ├── otel-collector-config.yaml    # Default OTEL config (development)
│   ├── otel-collector-config.development.yaml   # Docker Compose with Tempo/Loki/Prometheus
│   ├── otel-collector-config.production.yaml    # AWS CloudWatch/X-Ray
│   ├── tempo.yaml                    # Tempo tracing backend config
│   ├── loki.yaml                     # Loki log aggregation config
│   ├── prometheus.yml                # Prometheus metrics config
│   └── grafana-datasources.yaml      # Grafana data source definitions
│
├── scripts/                          # Deployment and setup scripts
│   └── setup-otel-collector.sh       # AMI deployment script
│
├── docker-compose.production.yml     # Production Docker Compose example
├── README.md                         # Main documentation
└── AMI-INTEGRATION.md                # Packer AMI integration guide

## Quick Start

### Development (Docker Compose)
```bash
# Start observability stack
docker compose up -d otel-collector tempo loki prometheus grafana

# View logs
docker compose logs -f otel-collector

# Access Grafana
open http://localhost:3000  # admin/admin
```

### Production (AWS AMI)
The setup script is automatically called during EC2 instance launch.
See AMI-INTEGRATION.md for details.

### Production (Docker)
```bash
# Use production compose file
docker compose -f observability/docker-compose.production.yml up -d
```

## Configuration Files

All configurations use environment variables for flexibility:
- Development: `configs/.env.observability`
- Production: Environment variables from user-data/ECS task definition
