# DirectApp - Dokploy Deployment Guide

Complete guide to deploy DirectApp (Directus fork) on Dokploy.

**Last Updated:** 2025-10-18
**Dokploy Version:** Latest
**DirectApp Version:** Based on Directus 11

---

## Table of Contents

- [What is Dokploy?](#what-is-dokploy)
- [Prerequisites](#prerequisites)
- [Option 1: Quick Deploy (Existing Dokploy)](#option-1-quick-deploy-existing-dokploy)
- [Option 2: Install Dokploy First](#option-2-install-dokploy-first)
- [Post-Deployment Setup](#post-deployment-setup)
- [Environment Variables](#environment-variables)
- [Custom Domain Setup](#custom-domain-setup)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Updating DirectApp](#updating-directapp)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)

---

## What is Dokploy?

**Dokploy** is a free, open-source, self-hosted Platform-as-a-Service (PaaS) that simplifies application deployment using Docker and Traefik.

**Think of it as:** Your own Heroku/Vercel/Netlify running on your server

**Key Features:**
- 🐳 Docker-based deployments
- 🔒 Automatic HTTPS (Let's Encrypt)
- 📊 Built-in monitoring
- 🔄 Zero-downtime deployments
- 🌐 Traefik reverse proxy
- 📦 Database support (PostgreSQL, MySQL, Redis, MongoDB)

**Official Docs:** https://docs.dokploy.com

---

## Prerequisites

### Server Requirements

**Minimum:**
- 2 GB RAM
- 30 GB Disk space
- 1 CPU core
- Ubuntu 20.04+ or Debian 11+

**Recommended (for production):**
- 4 GB RAM
- 50 GB SSD
- 2 CPU cores
- Ubuntu 22.04 LTS

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Git (if deploying from repo)

### Domain & DNS

- A domain name pointing to your server
- DNS A record configured

### Accounts (for full features)

- [ ] **Resend** - Email notifications (https://resend.com) - Free tier
- [ ] **Maskinporten** - Norwegian vehicle API (https://www.vegvesen.no) - Test access
- [ ] **Sentry** (optional) - Error monitoring (https://sentry.io) - Free tier

---

## Option 1: Quick Deploy (Existing Dokploy)

If you already have Dokploy running, follow these steps:

### Step 1: Clone DirectApp Repository

```bash
# On your local machine or server
git clone https://github.com/gumpen-app/directapp.git
cd directapp
```

### Step 2: Prepare Environment Variables

```bash
# Copy the example environment file
cp .env.dokploy.example .env

# Generate secure keys
openssl rand -base64 32  # Use this for DIRECTUS_KEY
openssl rand -base64 64  # Use this for DIRECTUS_SECRET

# Edit the .env file
nano .env
```

**Required variables to change:**
```env
DOMAIN=directapp.yourdomain.com
PUBLIC_URL=https://directapp.yourdomain.com
DIRECTUS_KEY=<generated-32-char-key>
DIRECTUS_SECRET=<generated-64-char-secret>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
DB_PASSWORD=<strong-password>
EMAIL_FROM=DirectApp <noreply@yourdomain.com>
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Step 3: Deploy via Dokploy UI

1. **Login to Dokploy** dashboard (usually at https://dokploy.yourdomain.com)

2. **Create New Project**
   - Click "Create Project"
   - Name: `directapp`
   - Description: Car Dealership Management System

3. **Create New Service**
   - Click "Add Service"
   - Select "Docker Compose"
   - Name: `directapp`

4. **Configure Service**
   - **Source:** Choose one:
     - **From Git:** Enter `https://github.com/gumpen-app/directapp.git`
     - **Manual:** Paste contents of `docker-compose.dokploy.yml`

5. **Set Environment Variables**
   - Go to "Environment" tab
   - Paste your `.env` contents
   - Or add variables one by one

6. **Configure Domain**
   - Go to "Domains" tab
   - Add domain: `directapp.yourdomain.com`
   - Enable "Auto SSL" (Let's Encrypt)

7. **Deploy**
   - Click "Deploy" button
   - Wait for build to complete (~5-10 minutes)

8. **Check Logs**
   - Go to "Logs" tab
   - Verify Directus started successfully
   - Look for: `Server started at port 8055`

### Step 4: Access Your DirectApp

```
https://directapp.yourdomain.com/admin
```

**Default login:**
- Email: (from ADMIN_EMAIL in .env)
- Password: (from ADMIN_PASSWORD in .env)

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

---

## Option 2: Install Dokploy First

If you don't have Dokploy installed yet:

### Step 1: Install Dokploy on Your Server

```bash
# SSH into your server
ssh user@your-server-ip

# Run Dokploy installer (one command!)
curl -sSL https://dokploy.com/install.sh | sh

# The installer will:
# - Install Docker
# - Install Docker Compose
# - Set up Traefik
# - Create Dokploy admin panel
# - Configure firewall rules
```

**Installation takes ~5-10 minutes**

### Step 2: Access Dokploy UI

```
http://your-server-ip:3000
```

**First-time setup:**
1. Create admin account
2. Set up your organization
3. Configure domain (optional but recommended)

### Step 3: Configure Domain for Dokploy

**DNS Setup:**
```
A Record: dokploy.yourdomain.com → your-server-ip
A Record: directapp.yourdomain.com → your-server-ip
```

**In Dokploy UI:**
1. Go to Settings
2. Add domain: `dokploy.yourdomain.com`
3. Enable SSL
4. Save

Now Dokploy is accessible at: `https://dokploy.yourdomain.com`

### Step 4: Deploy DirectApp

Follow [Option 1: Quick Deploy](#option-1-quick-deploy-existing-dokploy) above

---

## Post-Deployment Setup

### 1. First Login & Security

```bash
# Access admin panel
https://directapp.yourdomain.com/admin

# Login with credentials from .env
# Email: ADMIN_EMAIL
# Password: ADMIN_PASSWORD

# Immediately:
1. Click your profile (top right)
2. Change password
3. Enable 2FA (Settings → Two-Factor Authentication)
```

### 2. Import Schema

Upload your exported schema to restore data model:

```bash
# Via Directus UI
Settings → Data Model → Import Schema → Upload schema-exported/*.json

# Or via CLI (from server)
docker exec directapp npx directus schema apply /directus/uploads/schema.json
```

### 3. Configure Dealerships

```bash
# Via Directus admin
Content → Dealership → Create new

# Add your dealerships:
- Name, Code, Location
- Set dealership type (self-sustained, prep center, sales-only)
```

### 4. Create Users

```bash
# Via Directus admin
User Directory → Invite User

# Assign to:
- Role (Nybilselger, Bruktbilselger, Booking, etc.)
- Dealership
```

### 5. Test Vehicle Lookup API

Once Maskinporten token is configured:

```bash
# Test the vehicle lookup endpoint
curl -X POST https://directapp.yourdomain.com/vehicle-lookup \
  -H "Content-Type: application/json" \
  -d '{"vin": "YV1CZ59H621234567"}'

# Should return vehicle data
```

### 6. Test Email Notifications

```bash
# Via Directus Flows
Settings → Flows → Create new flow

# Trigger: Manual
# Operation: Send Email
# Test with your email

# Verify Resend dashboard shows delivery
```

---

## Environment Variables

### Critical Variables (MUST SET)

```env
DIRECTUS_KEY=             # 32+ characters
DIRECTUS_SECRET=          # 64+ characters
ADMIN_PASSWORD=           # Strong password
DB_PASSWORD=              # Strong password
DOMAIN=                   # Your domain
PUBLIC_URL=               # https://your-domain
```

### Email Configuration

```env
EMAIL_FROM=DirectApp <noreply@yourdomain.com>
RESEND_API_KEY=re_xxxx   # From resend.com
```

### API Integrations

```env
STATENS_VEGVESEN_TOKEN=  # Norwegian vehicle registry
SENTRY_DSN=              # Error monitoring (optional)
```

### Security & Performance

```env
RATE_LIMITER_ENABLED=true
RATE_LIMITER_POINTS=100
RATE_LIMITER_DURATION=60
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
LOG_LEVEL=warn
```

### Updating Variables

**Via Dokploy UI:**
1. Go to your service
2. Click "Environment" tab
3. Edit variables
4. Click "Redeploy"

**Changes require redeployment!**

---

## Custom Domain Setup

### DNS Configuration

Add these DNS records:

```dns
Type    Name        Value           TTL
A       @           <server-ip>     3600
A       directapp   <server-ip>     3600
CNAME   www         directapp       3600
```

### In Dokploy

1. Go to Service → Domains
2. Add domain: `directapp.yourdomain.com`
3. Enable "Auto SSL"
4. Wait ~2-5 minutes for Let's Encrypt

### Verify

```bash
# Check DNS propagation
nslookup directapp.yourdomain.com

# Test HTTPS
curl -I https://directapp.yourdomain.com
```

---

## SSL/HTTPS Configuration

Dokploy uses **Let's Encrypt** automatically via Traefik.

### Automatic SSL (Recommended)

✅ **Already configured** in `docker-compose.dokploy.yml`

Traefik labels:
```yaml
- "traefik.http.routers.directapp.tls.certresolver=letsencrypt"
```

### Troubleshooting SSL

**Issue:** Certificate not issued

**Solutions:**
1. Verify DNS points to server: `nslookup yourdomain.com`
2. Check ports 80/443 are open: `sudo netstat -tulpn | grep :80`
3. Check Traefik logs: `docker logs traefik`
4. Verify domain in Dokploy UI matches DNS

**Issue:** Mixed content warnings

**Solution:**
```env
# In .env
PUBLIC_URL=https://directapp.yourdomain.com  # Must use https://
REFRESH_TOKEN_COOKIE_SECURE=true
```

### Certificate Renewal

Let's Encrypt certificates auto-renew via Traefik.
- Certificates valid for 90 days
- Auto-renewed at 60 days
- No manual intervention needed

---

## Updating DirectApp

### Update from Git (Recommended)

If deployed from GitHub:

**Via Dokploy UI:**
1. Go to your service
2. Click "Deployments" tab
3. Click "Redeploy"
4. Dokploy pulls latest code and rebuilds

**Manual Git Pull:**
```bash
# SSH to server
cd /path/to/directapp

# Pull latest
git pull origin main

# Redeploy via Dokploy UI
```

### Update Environment Variables

```bash
# Edit in Dokploy UI
Service → Environment → Edit → Save → Redeploy
```

### Update Directus Version

```yaml
# In docker-compose.dokploy.yml
services:
  directus:
    image: directus/directus:11  # ← Change version here
```

Then redeploy via Dokploy UI.

### Database Migrations

```bash
# Automatic on startup
# Directus runs migrations automatically

# Manual migration (if needed)
docker exec directapp npx directus database migrate:latest
```

---

## Backup & Restore

### Automated Backups

**Already configured** via `backup` service in docker-compose.

**Location:** `../files/backups/`

**Schedule:**
- Daily at midnight
- Keeps 30 days
- Keeps 4 weeks
- Keeps 6 months

### Manual Backup

**Database:**
```bash
# Create backup
docker exec directapp-postgres pg_dump -U directus directapp > backup-$(date +%Y%m%d).sql

# Download from Dokploy
# Files → backups → Download
```

**Uploads/Files:**
```bash
# Create archive
cd ../files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Download via Dokploy File Manager
```

### Restore from Backup

**Database:**
```bash
# Stop Directus
docker stop directapp

# Restore database
cat backup-20251018.sql | docker exec -i directapp-postgres psql -U directus -d directapp

# Start Directus
docker start directapp
```

**Files:**
```bash
# Extract backup
tar -xzf uploads-backup-20251018.tar.gz -C ../files/
```

### Disaster Recovery

**Full system restore:**
1. Install fresh Dokploy
2. Deploy DirectApp via Dokploy
3. Stop services
4. Restore database backup
5. Restore uploads backup
6. Start services
7. Verify data

**Test restore monthly!**

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
# Via Dokploy UI
Service → Logs → View

# Or via Docker
docker logs directapp
docker logs directapp-postgres
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Ports already in use

**Solution:**
```bash
# Verify environment
docker exec directapp env | grep DIRECTUS

# Check database connectivity
docker exec directapp-postgres pg_isready

# Restart service
docker restart directapp
```

### Can't Access Admin Panel

**Check:**
1. Domain DNS points to server
2. SSL certificate issued (Traefik logs)
3. Directus service running: `docker ps | grep directapp`
4. Firewall allows 80/443

**Test locally:**
```bash
# SSH to server
curl http://localhost:8055/server/health

# Should return: {"status":"ok"}
```

### Vehicle Lookup Not Working

**Check:**
1. STATENS_VEGVESEN_TOKEN set in environment
2. Extension installed: `ls ../files/extensions/`
3. API reachable from server

**Test:**
```bash
# Test API directly
curl https://autosys-kjoretoy-api.atlas.vegvesen.no/api/...

# Check Directus logs for errors
docker logs directapp | grep vehicle
```

### Emails Not Sending

**Check:**
1. RESEND_API_KEY set correctly
2. EMAIL_FROM domain verified in Resend
3. Check Resend dashboard for errors

**Test:**
```bash
# Via Directus Flows
Settings → Flows → Create test flow → Send email

# Check Resend logs
https://resend.com/emails
```

### Upload Files Not Persisting

**Issue:** Files disappear after redeploy

**Cause:** Using `./uploads` instead of `../files/uploads`

**Solution:**
```yaml
# In docker-compose.dokploy.yml (already correct)
volumes:
  - ../files/uploads:/directus/uploads  # ✅ Correct
  # NOT: ./uploads:/directus/uploads    # ❌ Wrong
```

### Database Connection Errors

**Check:**
```bash
# Verify PostgreSQL running
docker exec directapp-postgres pg_isready

# Check environment variables
docker exec directapp env | grep DB_

# Test connection
docker exec directapp-postgres psql -U directus -d directapp -c "SELECT 1"
```

### High Memory Usage

**Check resource usage:**
```bash
# Via Dokploy
Monitoring → Resources

# Or via Docker
docker stats directapp
```

**Optimize:**
```env
# In .env
CACHE_ENABLED=true
CACHE_STORE=redis
```

### Slow Performance

**Solutions:**
1. Add database indexes (see PRODUCTION_ROADMAP.md)
2. Enable Redis caching
3. Optimize queries
4. Scale server resources

---

## Production Checklist

Before going live:

### Security
- [ ] Changed DIRECTUS_KEY and DIRECTUS_SECRET
- [ ] Changed ADMIN_PASSWORD (strong password)
- [ ] Changed DB_PASSWORD
- [ ] Enabled 2FA for admin
- [ ] Set REFRESH_TOKEN_COOKIE_SECURE=true
- [ ] Configured CORS if needed
- [ ] Enabled rate limiting
- [ ] Reviewed all user permissions

### Database
- [ ] Added unique constraints (VIN, order_number)
- [ ] Fixed foreign key cascades
- [ ] Added validation rules
- [ ] Configured automated backups
- [ ] Tested restore procedure

### Configuration
- [ ] Set correct PUBLIC_URL
- [ ] Configured custom domain
- [ ] SSL certificate issued
- [ ] Email sending works (Resend)
- [ ] Vehicle lookup works (Maskinporten)
- [ ] Error monitoring (Sentry)

### Data
- [ ] Imported schema
- [ ] Created dealerships
- [ ] Created user roles
- [ ] Tested workflows
- [ ] Verified permissions

### Monitoring
- [ ] Set up Sentry alerts
- [ ] Configure uptime monitoring
- [ ] Set up backup notifications
- [ ] Monitor disk space

### Documentation
- [ ] User training completed
- [ ] Admin procedures documented
- [ ] Incident response plan
- [ ] Backup/restore tested

---

## Support & Resources

### Official Documentation
- **Dokploy:** https://docs.dokploy.com
- **Directus:** https://docs.directus.io
- **DirectApp:** See `.claude/` directory

### Community
- **Dokploy GitHub:** https://github.com/Dokploy/dokploy
- **Directus Discord:** https://directus.chat

### Getting Help

**For DirectApp issues:**
1. Check `.claude/SCHEMA_ANALYSIS.md`
2. Review `.claude/PRODUCTION_ROADMAP.md`
3. Create issue: https://github.com/gumpen-app/directapp/issues

**For Dokploy issues:**
1. Check logs in Dokploy UI
2. Review Dokploy docs
3. Create issue: https://github.com/Dokploy/dokploy/issues

---

## Next Steps

After successful deployment:

1. **Complete Phase 0** - Fix critical security issues
   - See: `.claude/SCHEMA_ANALYSIS.md`
   - See: `.claude/GITHUB_ISSUES_TEMPLATE.md`

2. **Add vehicle lookup** - Integrate Statens Vegvesen API
   - See: `.claude/PRODUCTION_ROADMAP.md` Phase 1

3. **Configure workflows** - Role-based permissions
   - See: `.claude/PRODUCTION_ROADMAP.md` Phase 2

4. **Set up notifications** - Resend integration
   - See: `.claude/PRODUCTION_ROADMAP.md` Phase 3

5. **Add scheduling** - Workshop resource management
   - See: `.claude/PRODUCTION_ROADMAP.md` Phase 5

---

**Deployment Status:** ✅ Ready to deploy
**Last Updated:** 2025-10-18
**Maintainer:** gumpen-app

**Questions?** Create an issue or check the roadmap documents in `.claude/`

