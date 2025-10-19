# Dokploy Setup - DirectApp

**Platform:** https://deploy.onecom.ai/  
**Main Domain:** `gapp.coms.no`  
**Project:** gapp

---

## 🌐 Domener

| Environment | URL | Compose ID |
|-------------|-----|------------|
| **Staging** | https://staging.gapp.coms.no | `25M8QUdsDQ97nW5YqPYLZ` |
| **Production** | https://gapp.coms.no | `YKhjz62y5ikBunLd6G2BS` |
| **Development** | ❌ Ikke i bruk (kun lokal) | `DrhFdgWpc_R6d5vUYRjf4` |

---

## 🚀 Quick Deploy

### Metode 1: Automatisk (via script)

```bash
# Deploy staging
/tmp/deploy-to-dokploy.sh staging

# Deploy production (etter staging er testet)
/tmp/deploy-to-dokploy.sh production
```

Script genererer secrets automatisk og oppdaterer Dokploy.

---

### Metode 2: Manuelt (via Dokploy UI)

**Staging:**
1. Logg inn: https://deploy.onecom.ai/
2. Gå til "gapp" prosjektet
3. Klikk på "staging" compose service
4. General → Compose File → Paste `docker-compose.staging.yml`
5. Environment → Add variables:

```env
DIRECTUS_KEY=<generer med: openssl rand -base64 32>
DIRECTUS_SECRET=<generer med: openssl rand -base64 64>
ADMIN_EMAIL=admin@gumpen.no
ADMIN_PASSWORD=<generer med: openssl rand -base64 24>
DB_DATABASE=directapp_staging
DB_USER=directus
DB_PASSWORD=<generer med: openssl rand -base64 24>
PUBLIC_URL=https://staging.gapp.coms.no
DOMAIN=gapp.coms.no
COOKIE_DOMAIN=.gapp.coms.no
CORS_ORIGIN=https://staging.gapp.coms.no
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=directapp-staging
S3_REGION=eu-north-1
EMAIL_FROM=DirectApp Staging <staging@gumpen.no>
RESEND_API_KEY=
STATENS_VEGVESEN_TOKEN=
SENTRY_DSN=
LOG_LEVEL=info
```

6. Domains → Add domain: `staging.gapp.coms.no`
7. Deploy → Klikk "Deploy"

**Production:**
Samme prosess, men bruk:
- `docker-compose.production.yml`
- **ANDRE secrets** (ikke gjenbruk fra staging!)
- Domene: `gapp.coms.no`
- `PUBLIC_URL=https://gapp.coms.no`
- `LOG_LEVEL=warn`

---

## 📋 DNS Setup

Legg til følgende DNS records hos din DNS-leverandør:

```
staging.gapp.coms.no  A  <DOKPLOY_SERVER_IP>
gapp.coms.no         A  <DOKPLOY_SERVER_IP>
```

Dokploy/Traefik håndterer automatisk HTTPS via Let's Encrypt.

---

## 🔑 Secrets Management

**⚠️ VIKTIG:** Staging og Production MÅ ha FORSKJELLIGE secrets!

**Generer secrets:**
```bash
# Staging
echo "STAGING DIRECTUS_KEY: $(openssl rand -base64 32)"
echo "STAGING DIRECTUS_SECRET: $(openssl rand -base64 64)"
echo "STAGING DB_PASSWORD: $(openssl rand -base64 24)"

# Production (ANDRE nøkler!)
echo "PRODUCTION DIRECTUS_KEY: $(openssl rand -base64 32)"
echo "PRODUCTION DIRECTUS_SECRET: $(openssl rand -base64 64)"
echo "PRODUCTION DB_PASSWORD: $(openssl rand -base64 24)"
```

**Lagre disse sikkert!** Du trenger dem senere.

---

## 🧪 Testing Etter Deploy

**Staging:**
```bash
# Health check
curl https://staging.gapp.coms.no/server/health

# Admin login
open https://staging.gapp.coms.no/admin
```

**Production:**
```bash
curl https://gapp.coms.no/server/health
open https://gapp.coms.no/admin
```

---

## 📊 Next Steps

1. ✅ Deploy staging
2. ✅ Test admin login på staging
3. ✅ Kjør **Issue #20** (database migrations) på staging
4. ✅ Test hele flowet på staging
5. ✅ Deploy production (med ANDRE secrets)
6. ✅ Kjør migrations på production
7. ✅ Fjern ADMIN_EMAIL og ADMIN_PASSWORD fra env vars
8. ✅ Redeploy uten admin credentials

---

## 🔧 API Commands (for automation)

```bash
API_KEY="g_appBRUNDztIKIeJvKztXhjQFkUGbsySYCrjpMlHVWUryjEJvsLmaDwbmKigsYLDUJqG"
DOKPLOY_URL="https://deploy.onecom.ai"

# Deploy staging
curl -X POST "$DOKPLOY_URL/api/compose.deploy" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"composeId": "25M8QUdsDQ97nW5YqPYLZ"}'

# Get staging logs
curl -X GET "$DOKPLOY_URL/api/compose.logs?composeId=25M8QUdsDQ97nW5YqPYLZ" \
  -H "x-api-key: $API_KEY"

# Check deployment status
curl -X GET "$DOKPLOY_URL/api/project.all" \
  -H "x-api-key: $API_KEY" | jq '.[] | select(.name=="gapp")'
```

---

**Last Updated:** 2025-10-19  
**Contact:** DirectApp Team
