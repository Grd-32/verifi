# KYC Vault - Decentralized SSI Ecosystem

[![CI/CD Pipeline](https://github.com/kyc-vault/kyc-vault/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/kyc-vault/kyc-vault/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade, decentralized Know Your Customer (KYC) system built on Self-Sovereign Identity (SSI) principles. Supports W3C Verifiable Credentials (VC), Decentralized Identifiers (DIDs), selective disclosure, AML/compliance checks, and institutional issuer/verifier portals.

## Features

✅ **W3C Verifiable Credentials** - Issue and verify credentials in JSON-LD or JWT format  
✅ **Multi-Method DIDs** - Support for DID:ION, DID:key, DID:ethr, and DID:Cheqd  
✅ **Selective Disclosure** - Users present only necessary credential fields  
✅ **Revocation Support** - Ledger-anchored revocation registries  
✅ **AML/KYC Compliance** - Integrated compliance checks and sanction list screening  
✅ **Push Notifications** - DIDComm v2 + Firebase Cloud Messaging  
✅ **Mobile Wallet** - React Native app with Secure Enclave/Keystore support  
✅ **Enterprise Issuers** - Portal for credential template management  
✅ **Enterprise Verifiers** - Bank/fintech integration for verification requests  
✅ **Observable & Secure** - Prometheus, Grafana, ELK, TLS, mTLS, HSM-ready  
✅ **Kubernetes Ready** - Production-grade K8s manifests and Helm charts  
✅ **GitHub Actions CI/CD** - Automated lint, test, build, and deploy pipelines  

## Quick Start

### Prerequisites

- **Node.js** 18+ & **pnpm** 8+
- **Docker Desktop**
- **kubectl** (for Kubernetes)

### Docker Compose (Local Dev)

```bash
git clone https://github.com/kyc-vault/kyc-vault.git
cd kyc-vault

pnpm install
cd infra && docker-compose up

# Services available at:
# - Wallet: http://localhost:8081
# - Veramo Agent: http://localhost:3001/docs
# - Issuer Service: http://localhost:3002/docs
# - Verifier Service: http://localhost:3003/docs
# - Notification: http://localhost:3004/docs
# - Revocation: http://localhost:3005/docs
# - Grafana: http://localhost:3000 (admin/admin)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     🔐 Wallet Frontend                       │
│              React Native + Expo (Web/Mobile)              │
│          Secure Storage (Secure Enclave/Keystore)          │
└────────────────┬────────────────────────────────────────────┘
                 │ DIDComm + REST
┌────────────────▼────────────────────────────────────────────┐
│                   🔐 Veramo Agent                            │
│          DID Management & VC Operations (Node.js)          │
│                     Port 3001                              │
└──┬──────────────┬──────────────┬───────────────┬───────────┘
   │              │              │               │
   │ REST         │ REST         │ REST          │ REST
   ▼              ▼              ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────┐
│   Issuer     │ │  Verifier    │ │Notification│ │Revocation │
│  Service     │ │  Service     │ │ Service    │ │ Service   │
│   (3002)     │ │   (3003)     │ │  (3004)    │ │  (3005)   │
└──┬───────────┘ └──┬───────────┘ └────────────┘ └──┬────────┘
   │                │                               │
   └────────────────┼───────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   PostgreSQL DB     │
         │   Redis Cache       │
         └─────────────────────┘
```

## Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| **Veramo Agent** | 3001 | Core DID & VC operations |
| **Issuer Service** | 3002 | Credential template management & issuance |
| **Verifier Service** | 3003 | Presentation requests & compliance checks |
| **Notification Service** | 3004 | DIDComm messaging & push notifications |
| **Revocation Service** | 3005 | Revocation registry & ledger anchoring |
| **Wallet Frontend** | 8081 | Mobile wallet UI (Expo web) |
| **Grafana** | 3000 | Monitoring dashboards |
| **Prometheus** | 9090 | Metrics collection |

## Setup & Development

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Update with your values
DB_USER=kyc-admin
DB_PASSWORD=your-secure-password
VERAMO_AGENT_URL=http://localhost:3001
```

### Run Locally

```bash
# Option 1: Docker Compose (easiest)
cd infra
docker-compose up

# Option 2: Individual services (requires postgres running)
pnpm dev    # Runs all services in watch mode

# Option 3: Specific service
cd services/veramo-agent && pnpm dev
```

## Example Workflows

### 1. Create a DID

```bash
curl -X POST http://localhost:3001/api/did \
  -H "Content-Type: application/json" \
  -d '{"didMethod":"did:ion"}'
```

### 2. Issue a Credential

```bash
curl -X POST http://localhost:3001/api/vc/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuerDid":"did:ion:issuer",
    "subjectDid":"did:ion:holder",
    "claims":{"name":"John Doe","country":"KE"}
  }'
```

### 3. Request Presentation

```bash
curl -X POST http://localhost:3003/api/verifier/request \
  -H "Content-Type: application/json" \
  -d '{
    "verifierDid":"did:ion:bank",
    "requestedCredentials":[{"type":"NationalIDCredential","fields":["name"]}],
    "purpose":"KYC"
  }'
```

### 4. Send AML Refresh Notification

```bash
curl -X POST http://localhost:3004/api/notify/aml-refresh \
  -H "Content-Type: application/json" \
  -d '{
    "holderDid":"did:ion:holder",
    "credentialIds":["cred-1"],
    "reason":"routine_update"
  }'
```

## API Documentation

All services expose OpenAPI/Swagger docs:

- http://localhost:3001/docs - Veramo Agent
- http://localhost:3002/docs - Issuer Service
- http://localhost:3003/docs - Verifier Service
- http://localhost:3004/docs - Notification Service
- http://localhost:3005/docs - Revocation Service

**Import Postman Collection**: `postman-collection.json`

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires services running)
pnpm test:e2e

# Integration tests
pnpm test:integration

# Lint
pnpm lint
```

## Deployment

### Kubernetes

```bash
# Deploy to K8s cluster
kubectl apply -f infra/k8s/

# Verify
kubectl get pods -n kyc-vault
kubectl logs -n kyc-vault deployment/veramo-agent
```

### GitHub Actions CI/CD

Push to `develop` → Stages deployment  
Push to `main` → Production deployment

Required secrets:
- `DOCKER_USERNAME` & `DOCKER_PASSWORD`
- `KUBE_CONFIG_STAGING` & `KUBE_CONFIG_PRODUCTION`

## Security

- 🔒 **TLS/mTLS** everywhere
- 🔒 **HSM integration** for production signing
- 🔒 **Vault/AWS Secrets Manager** for secrets
- 🔒 **OWASP best practices**
- 🔒 **Audit logging** (no PII)
- 🔒 **GDPR compliant**

## Troubleshooting

### Services won't start

```bash
# Check Docker
docker ps
docker logs kyc-vault-postgres

# Check ports
lsof -i :3001
```

### Database connection issues

```bash
# Reset DB
cd infra
docker-compose down -v
docker-compose up postgres
psql -U kyc-admin -h localhost -d kyc-vault < init-db.sql
```

## Project Structure

```
kyc-vault/
├── apps/
│   ├── wallet-frontend/          # React Native wallet
│   └── web/ (legacy)
├── services/
│   ├── veramo-agent/             # Identity operations
│   ├── issuer-service/           # Issuance management
│   ├── verifier-service/         # Verification & compliance
│   ├── notification-service/     # DIDComm & push
│   └── revocation-service/       # Revocation registry
├── packages/
│   └── common-types/             # Shared types
├── infra/
│   ├── docker-compose.yml        # Local dev
│   ├── k8s/                      # K8s manifests
│   └── terraform/ (scaffold)     # AWS IaC
├── tests/
│   └── e2e/                      # Playwright tests
├── .github/workflows/            # CI/CD
└── openapi.json / postman-collection.json
```

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/name`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE)

## Support

- 📖 **Docs**: https://docs.kyc-vault.io
- 💬 **Discord**: https://discord.gg/kyc-vault
- 🐛 **Issues**: https://github.com/kyc-vault/kyc-vault/issues

---

**Building decentralized KYC for a frictionless future** 🚀
   docker-compose up
   ```

2. Access the API at `http://localhost:5000` and the web application at `http://localhost:3000`.

### Usage Guidelines

- Users can upload their KYC documents through the web application.
- The API handles document uploads, storage, and retrieval.
- Admins can view uploaded documents and manage user submissions through the dashboard.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.