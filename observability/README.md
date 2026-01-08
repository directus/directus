# Directus Observability: Development vs Production

This directory contains OpenTelemetry Collector configurations for different deployment methods.

## Directory Structure

```
observability/
├── configs/                    # OpenTelemetry and observability configs
│   ├── .env.observability      # Environment variables (development)
│   ├── .env.observability.example
│   ├── otel-collector-config.yaml             # Default config (points to development)
│   ├── otel-collector-config.development.yaml # Docker Compose (Tempo/Loki/Prometheus)
│   ├── otel-collector-config.production.yaml  # AWS CloudWatch/X-Ray
│   ├── tempo.yaml              # Tempo configuration
│   ├── loki.yaml               # Loki configuration
│   ├── prometheus.yml          # Prometheus configuration
│   └── grafana-datasources.yaml # Grafana data sources
├── scripts/                    # Deployment scripts
│   └── setup-otel-collector.sh # AMI deployment script
├── docker-compose.production.yml # Production Docker Compose example
└── README.md                   # This file
```

## Deployment Methods

### 1. Docker Compose (Development)
Local development with full observability stack

### 2. AWS AMI (Production)
Custom AMI with OTEL Collector sending to CloudWatch/X-Ray

### 3. Docker Compose (Production)
Containerized production with CloudWatch exporters

## Development Setup

### 1. Create Environment File

```bash
cp .env.observability.example .env.observability
```

Edit `.env.observability`:
```bash
ENVIRONMENT=development
OTEL_COLLECTOR_CONFIG_FILE=./otel-collector-config.development.yaml
```

### 2. Start Observability Stack

```bash
docker compose up -d otel-collector tempo loki prometheus grafana
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3000 (admin/admin)
  - Data Sources: Tempo (traces), Loki (logs), Prometheus (metrics)
- **Prometheus**: http://localhost:9090
- **Tempo**: http://localhost:3200

## Production Setup (AWS CloudWatch)

### Prerequisites

1. **AWS Resources**
   ```bash
   # Create CloudWatch Log Groups
   aws logs create-log-group --log-group-name /directus/production/logs
   aws logs create-log-group --log-group-name /directus/production/metrics
   
   # Set retention policy (optional)
   aws logs put-retention-policy \
     --log-group-name /directus/production/logs \
     --retention-in-days 30
   ```

2. **IAM Permissions**

   For ECS/EKS/EC2 with IAM roles, attach this policy to your task/node role:
   
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "logs:CreateLogStream",
           "logs:PutLogEvents",
           "logs:DescribeLogStreams"
         ],
         "Resource": "arn:aws:logs:*:*:log-group:/directus/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "xray:PutTraceSegments",
           "xray:PutTelemetryRecords"
         ],
         "Resource": "*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "cloudwatch:PutMetricData"
         ],
         "Resource": "*",
         "Condition": {
           "StringEquals": {
             "cloudwatch:namespace": "Directus/production"
           }
         }
       }
     ]
   }
   ```

### Deployment Options

#### Option 1: Docker Compose (Simple)

```bash
# Configure environment
export AWS_REGION=us-east-1
export ENVIRONMENT=production
export OTEL_COLLECTOR_CONFIG_FILE=./otel-collector-config.production.yaml

# Deploy
docker compose -f docker-compose.production.yml up -d
```

#### Option 2: AWS ECS Fargate (Recommended)

**Task Definition** (`directus-task-definition.json`):

```json
{
  "family": "directus-production",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/directus-task-role",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "otel-collector",
      "image": "otel/opentelemetry-collector-contrib:latest",
      "essential": true,
      "command": ["--config=/etc/otel-collector-config.yaml"],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "AWS_REGION", "value": "us-east-1"}
      ],
      "portMappings": [
        {"containerPort": 4317, "protocol": "tcp"},
        {"containerPort": 4318, "protocol": "tcp"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/directus-otel-collector",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "otel"
        }
      },
      "mountPoints": [
        {
          "sourceVolume": "otel-config",
          "containerPath": "/etc/otel-collector-config.yaml",
          "readOnly": true
        }
      ]
    },
    {
      "name": "directus",
      "image": "directus/directus:latest",
      "essential": true,
      "environment": [
        {"name": "OPENTELEMETRY_ENABLED", "value": "true"},
        {"name": "OPENTELEMETRY_SERVICE_NAME", "value": "directus-api"},
        {"name": "OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT", "value": "http://localhost:4318"}
      ],
      "portMappings": [
        {"containerPort": 8055, "protocol": "tcp"}
      ],
      "dependsOn": [
        {
          "containerName": "otel-collector",
          "condition": "START"
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "otel-config",
      "host": {
        "sourcePath": "/etc/otel-collector-config.production.yaml"
      }
    }
  ]
}
```

Deploy:
```bash
aws ecs register-task-definition --cli-input-json file://directus-task-definition.json
aws ecs create-service \
  --cluster directus-cluster \
  --service-name directus \
  --task-definition directus-production \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### Option 3: Kubernetes/EKS

See `docs/kubernetes/` for Helm charts and manifests.

### Monitoring Production

#### CloudWatch Logs Insights

**Query API Errors:**
```
fields @timestamp, service_name, severity_text, body
| filter service_name = "directus-api" and severity_text = "ERROR"
| sort @timestamp desc
| limit 100
```

**Query Slow Requests:**
```
fields @timestamp, http.method, http.target, http.duration
| filter http.duration > 1000
| sort http.duration desc
| limit 50
```

#### CloudWatch Metrics

Custom metrics are published to namespace `Directus/production`:

- `web_vitals_lcp` - Largest Contentful Paint
- `app_api_requests_total` - API request count
- `http_server_duration_milliseconds` - Request duration

#### AWS X-Ray

View traces in X-Ray console:
1. Open AWS X-Ray Console
2. Select Service Map to see dependencies
3. Navigate to Traces to view individual requests

### Cost Optimization

1. **Set Log Retention**
   ```bash
   aws logs put-retention-policy \
     --log-group-name /directus/production/logs \
     --retention-in-days 7  # Adjust based on compliance needs
   ```

2. **Use Log Filtering**
   - Filter debug/info logs in production
   - Only send ERROR/WARN severity logs

3. **Sampling Traces**
   - Configure trace sampling in OTEL collector
   - Sample 10% of successful requests, 100% of errors

4. **Metric Aggregation**
   - Use longer export intervals (60s in production config)
   - Pre-aggregate metrics in the collector

## Environment Variables Reference

### Development
```bash
ENVIRONMENT=development
OTEL_COLLECTOR_CONFIG_FILE=./otel-collector-config.development.yaml
```

### Production (AWS)
```bash
ENVIRONMENT=production
AWS_REGION=us-east-1
OTEL_COLLECTOR_CONFIG_FILE=./otel-collector-config.production.yaml
CORS_ALLOWED_ORIGIN=https://your-domain.com
```

### Frontend (Vite)
```bash
# app/.env
VITE_OPENTELEMETRY_ENABLED=true
VITE_OPENTELEMETRY_SERVICE_NAME=directus-app
VITE_OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  # Dev
# VITE_OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=https://otel-collector.your-domain.com  # Prod
```

### Backend (Node.js)
```bash
# api/.env
OPENTELEMETRY_ENABLED=true
OPENTELEMETRY_SERVICE_NAME=directus-api
OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  # Dev
# OPENTELEMETRY_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318  # Prod (internal)
```

## Troubleshooting

### OTEL Collector Not Receiving Data

1. Check collector health:
   ```bash
   curl http://localhost:13133/
   ```

2. View collector logs:
   ```bash
   docker compose logs otel-collector
   ```

3. Enable debug exporter and check output

### CloudWatch Permissions Issues

```bash
# Test AWS credentials
aws sts get-caller-identity

# Check if log group exists
aws logs describe-log-groups --log-group-name-prefix /directus/

# Validate IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:role/directus-task-role \
  --action-names logs:PutLogEvents logs:CreateLogStream \
  --resource-arns "arn:aws:logs:us-east-1:ACCOUNT:log-group:/directus/production/logs:*"
```

### High CloudWatch Costs

1. Review metrics being sent:
   ```bash
   # Check metric count
   aws cloudwatch list-metrics --namespace Directus/production
   ```

2. Reduce log verbosity in production
3. Implement sampling for traces
4. Use metric filters to reduce cardinality

## Additional Resources

- [OpenTelemetry Collector Documentation](https://opentelemetry.io/docs/collector/)
- [AWS CloudWatch EMF Format](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [Directus Deployment Guide](https://docs.directus.io/self-hosted/docker-guide.html)
