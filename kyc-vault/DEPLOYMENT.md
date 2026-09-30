# Deployment Guide - KYC Vault SSI Ecosystem

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Compose Deployment](#docker-compose-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Deployment (Terraform)](#aws-deployment-terraform)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

```bash
# Install Node.js 18+ and pnpm
node --version  # v18.0.0 or higher
npm install -g pnpm
pnpm --version  # 8.0.0 or higher

# Verify Docker
docker --version
docker-compose --version
```

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/kyc-vault/kyc-vault.git
cd kyc-vault

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start PostgreSQL, Redis, and observability stack
cd infra
docker-compose up postgres redis prometheus grafana

# 5. In separate terminal, apply database initialization
psql -U kyc-admin -h localhost -d kyc-vault < init-db.sql
psql -U kyc-admin -h localhost -d kyc-vault < create-indexes.sql

# 6. Start all services (each in separate terminal)
# Terminal 2
cd services/veramo-agent && pnpm dev

# Terminal 3
cd services/issuer-service && pnpm dev

# Terminal 4
cd services/verifier-service && pnpm dev

# Terminal 5
cd services/notification-service && pnpm dev

# Terminal 6
cd services/revocation-service && pnpm dev

# Terminal 7 (optional - wallet frontend)
cd apps/wallet-frontend && pnpm web
```

## Docker Compose Deployment

### Quick Start

```bash
cd infra
docker-compose up

# Wait for services to be healthy
docker-compose ps

# Access services:
# - Wallet: http://localhost:8081
# - Veramo Agent: http://localhost:3001
# - Issuer Service: http://localhost:3002
# - Verifier Service: http://localhost:3003
# - Notification Service: http://localhost:3004
# - Revocation Service: http://localhost:3005
# - Grafana: http://localhost:3000 (admin/admin)
# - Prometheus: http://localhost:9090
```

### Scale Services

```bash
# Scale veramo-agent to 3 replicas
docker-compose up -d --scale veramo-agent=3
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f veramo-agent

# Last 100 lines
docker-compose logs --tail=100 issuer-service
```

### Cleanup

```bash
# Stop services
docker-compose down

# Remove volumes (warning: data loss)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm (optional)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Deploy to Kubernetes

```bash
# 1. Create namespace and secrets
kubectl apply -f infra/k8s/00-namespace.yml

# 2. Update secrets with real values
kubectl create secret generic kyc-vault-secrets \
  -n kyc-vault \
  --from-literal=db-password='your-secure-password'

# 3. Deploy all resources
kubectl apply -f infra/k8s/

# 4. Verify deployment
kubectl get pods -n kyc-vault
kubectl get services -n kyc-vault
kubectl get pvc -n kyc-vault

# 5. Wait for rollout
kubectl rollout status deployment/veramo-agent -n kyc-vault
```

### Access Services

```bash
# Port forward to access services locally
kubectl port-forward -n kyc-vault svc/veramo-agent 3001:3001
kubectl port-forward -n kyc-vault svc/issuer-service 3002:3002
kubectl port-forward -n kyc-vault svc/verifier-service 3003:3003

# Or use NodePort to access from outside cluster
kubectl get service -n kyc-vault
```

### Update Deployment

```bash
# Build and push new Docker images
docker build -t your-registry/veramo-agent:v1.1.0 services/veramo-agent/
docker push your-registry/veramo-agent:v1.1.0

# Update K8s manifest with new image
kubectl set image deployment/veramo-agent \
  veramo-agent=your-registry/veramo-agent:v1.1.0 \
  -n kyc-vault

# Roll back if needed
kubectl rollout undo deployment/veramo-agent -n kyc-vault
```

### Check Logs

```bash
# Get logs
kubectl logs -n kyc-vault deployment/veramo-agent

# Stream logs
kubectl logs -n kyc-vault deployment/veramo-agent -f

# Previous pod logs (if restarted)
kubectl logs -n kyc-vault deployment/veramo-agent --previous
```

## AWS Deployment (Terraform)

### Prerequisites

```bash
# Install Terraform
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Configure AWS credentials
aws configure
# Or set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### Deploy Infrastructure

```bash
cd infra/terraform

# 1. Initialize Terraform
terraform init

# 2. Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Plan deployment
terraform plan -out=tfplan

# 4. Review and apply
terraform apply tfplan

# 5. Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name kyc-vault-cluster

# 6. Verify
kubectl get nodes
kubectl get services
```

### Output Values

```bash
# Get outputs
terraform output

# Get specific output
terraform output eks_cluster_endpoint
terraform output rds_endpoint
```

### Destroy Infrastructure

```bash
# Warning: This will delete all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=aws_eks_node_group.main
```

### State Management

```bash
# Configure remote state (S3 + DynamoDB)
# 1. Uncomment backend in infra/terraform/backend.tf
# 2. Create S3 bucket and DynamoDB table for state
# 3. Run: terraform init

# View state
terraform state list
terraform state show aws_eks_cluster.main

# Backup state
terraform state pull > backup.tfstate
```

## CI/CD with GitHub Actions

### Setup Secrets

```bash
# Required secrets in GitHub repository settings

# Docker Hub
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-token

# Kubernetes
KUBE_CONFIG_STAGING=<base64 encoded kubeconfig>
KUBE_CONFIG_PRODUCTION=<base64 encoded kubeconfig>

# Security
SNYK_TOKEN=your-snyk-token
```

### Encode Kubeconfig

```bash
cat ~/.kube/config | base64 -w 0 | pbcopy  # macOS
cat ~/.kube/config | base64 -w 0 | xclip   # Linux
```

### Trigger Deployments

```bash
# Push to develop -> Staging deployment
git push origin feature/my-feature
git push origin develop

# Push to main -> Production deployment
git push origin main
```

## Production Checklist

### Security

- [ ] Enable TLS/SSL for all services
- [ ] Configure mTLS for service-to-service communication
- [ ] Set up secrets management (Vault/AWS Secrets Manager)
- [ ] Enable network policies
- [ ] Configure RBAC for Kubernetes
- [ ] Set up CORS properly
- [ ] Enable rate limiting
- [ ] Audit logging enabled and reviewed

### High Availability

- [ ] Multiple replicas for all services (minimum 2)
- [ ] RDS Multi-AZ enabled
- [ ] Auto-scaling configured
- [ ] Load balancing configured
- [ ] Database backup strategy set up
- [ ] Disaster recovery plan documented

### Monitoring & Observability

- [ ] Prometheus metrics configured
- [ ] Grafana dashboards set up
- [ ] Alert rules configured
- [ ] Centralized logging (Loki/ELK) enabled
- [ ] Distributed tracing configured
- [ ] Health checks and readiness probes configured

### Data & Compliance

- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] Database backups automated
- [ ] GDPR compliance measures implemented
- [ ] Audit trail complete and immutable
- [ ] Data retention policies defined

### Infrastructure

- [ ] Domain and DNS configured
- [ ] SSL/TLS certificates managed (Let's Encrypt/ACM)
- [ ] CDN configured for static assets
- [ ] Backup strategy in place
- [ ] Disaster recovery tested
- [ ] Database connection pooling optimized

## Monitoring & Logging

### Prometheus Metrics

```bash
# Access Prometheus
http://localhost:9090

# Useful queries
# Request latency (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Credential issuance rate
rate(credentials_issued_total[5m])
```

### Grafana Dashboards

```bash
# Access Grafana
http://localhost:3000
# Credentials: admin/admin

# Pre-built dashboards
# 1. Service Health Overview
# 2. Credential Lifecycle Metrics
# 3. Verification Performance
# 4. AML Compliance Events
# 5. System Resource Usage
```

### Centralized Logging (Loki)

```bash
# Query logs in Grafana
# Loki queries:
{service="veramo-agent"}
{namespace="kyc-vault"} | json
{level="error"}
```

## Troubleshooting

### Services won't start

```bash
# Check Docker
docker ps
docker-compose logs

# Check ports availability
lsof -i :3001
lsof -i :5432

# Reset and restart
docker-compose down -v
docker-compose up
```

### Database connection issues

```bash
# Test connection
psql -U kyc-admin -h localhost -d kyc-vault -c "SELECT 1"

# Reset database
docker-compose exec postgres dropdb -U kyc-admin kyc-vault
docker-compose exec postgres createdb -U kyc-admin kyc-vault
docker-compose exec postgres psql -U kyc-admin kyc-vault < init-db.sql
```

### High memory usage

```bash
# Check container memory
docker stats

# Increase memory limits in docker-compose.yml
# Or Kubernetes resource limits

# Check for memory leaks
kubectl top pod -n kyc-vault
```

### Network issues

```bash
# Test connectivity between services
kubectl exec -it pod/veramo-agent-xxx -n kyc-vault -- curl http://issuer-service:3002/health

# Check network policies
kubectl get networkpolicies -n kyc-vault
kubectl describe networkpolicy -n kyc-vault

# DNS issues
nslookup issuer-service.kyc-vault.svc.cluster.local
```

### Certificate issues

```bash
# Check certificate validity
openssl s_client -connect example.com:443 -showcerts

# Verify TLS handshake
curl -vI https://example.com

# Certificate expiration
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Support & Resources

- 📖 [Full Documentation](https://docs.kyc-vault.io)
- 🐛 [Report Issues](https://github.com/kyc-vault/kyc-vault/issues)
- 💬 [Discord Community](https://discord.gg/kyc-vault)
- 📧 [Email Support](support@kyc-vault.io)
