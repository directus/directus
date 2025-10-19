# DirectApp Production Deployment Checklist

**IMPORTANT: Complete ALL items before deploying to production.**

This checklist ensures your DirectApp deployment is secure, reliable, and production-ready.

---

## Phase 0: Pre-Deployment Setup

### Environment Setup

- [ ] **Copy environment template**
  ```bash
  cp .env.production.example .env
  ```

- [ ] **Generate secure keys**
  ```bash
  # Generate KEY (32+ characters)
  openssl rand -base64 32

  # Generate SECRET (64+ characters)
  openssl rand -base64 64
  ```

- [ ] **Set all required environment variables**
  - [ ] `DIRECTUS_KEY` - Random 32+ char string
  - [ ] `DIRECTUS_SECRET` - Random 64+ char string
  - [ ] `DOMAIN` - Your production domain
  - [ ] `PUBLIC_URL` - Full https:// URL
  - [ ] `COOKIE_DOMAIN` - Your domain with leading dot
  - [ ] `ADMIN_EMAIL` - Your email
  - [ ] `ADMIN_PASSWORD` - Strong password (12+ chars, mixed case, numbers, symbols)
  - [ ] `DB_DATABASE` - Database name
  - [ ] `DB_USER` - Database user
  - [ ] `DB_PASSWORD` - Strong database password (20+ chars)

### Storage Configuration

- [ ] **Choose storage option and configure:**

  **Option 1: AWS S3**
  - [ ] Create S3 bucket: `directapp-uploads`
  - [ ] Set bucket region: `S3_REGION=eu-north-1`
  - [ ] Create IAM user with S3 access
  - [ ] Set `S3_ACCESS_KEY` and `S3_SECRET_KEY`
  - [ ] Verify bucket is accessible

  **Option 2: Cloudflare R2**
  - [ ] Create R2 bucket: `directapp-uploads`
  - [ ] Get API tokens from Cloudflare dashboard
  - [ ] Set `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `S3_REGION=auto`
  - [ ] Verify bucket is accessible

  **Option 3: MinIO (self-hosted)**
  - [ ] Uncomment MinIO service in docker-compose.production.yml
  - [ ] Set `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
  - [ ] Set `S3_ENDPOINT=http://minio:9000`
  - [ ] Create bucket after deployment

### Email Configuration

- [ ] **Sign up for Resend** (https://resend.com)
  - [ ] Create account (free tier: 3,000 emails/month)
  - [ ] Verify your domain
  - [ ] Get API key from dashboard
  - [ ] Set `RESEND_API_KEY` in environment
  - [ ] Set `EMAIL_FROM` with verified domain
  - [ ] Send test email to verify setup

### API Integrations

- [ ] **Statens Vegvesen API** (Norwegian Vehicle Registry)
  - [ ] Register at https://www.vegvesen.no/fag/teknologi/apne-data/
  - [ ] Get test environment token (free)
  - [ ] Set `STATENS_VEGVESEN_TOKEN` in environment
  - [ ] For production: Register with Maskinporten for OAuth2
  - [ ] Test API access

### Monitoring (Optional but Recommended)

- [ ] **Sentry Error Tracking**
  - [ ] Sign up at https://sentry.io (free tier: 5K errors/month)
  - [ ] Create new project for DirectApp
  - [ ] Get DSN from project settings
  - [ ] Set `SENTRY_DSN` in environment
  - [ ] Test error reporting

### DNS Configuration

- [ ] **Configure DNS records**
  - [ ] Point `directapp.yourdomain.com` to server IP
  - [ ] Verify DNS propagation (can take up to 48h)
  - [ ] Test domain resolves correctly: `dig directapp.yourdomain.com`

---

## Phase 1: Schema Preparation

### Export Current Schema

- [ ] **Export schema from development/staging**
  ```bash
  # From dev environment
  ./schema/scripts/export.sh dev

  # From staging
  ./schema/scripts/export.sh staging
  ```

- [ ] **Review exported schema**
  ```bash
  # Check what's in the snapshot
  jq '.collections[].collection' schema/snapshots/prod.json | sort
  ```

### Fix Critical Security Issues

Based on the schema analysis, fix these CRITICAL issues before deployment:

- [ ] **Fix #1: Add unique constraints**
  ```sql
  ALTER TABLE cars ADD CONSTRAINT cars_vin_unique UNIQUE (vin);
  ALTER TABLE cars ADD CONSTRAINT cars_order_number_unique UNIQUE (order_number);
  ```

- [ ] **Fix #2: Remove unscoped DELETE permissions**
  - Open Directus → Settings → Access Control → Roles
  - Find "Booking" role → Cars collection → Delete permission
  - Add filter: `{"_and": [{"dealership_id": {"_eq": "$CURRENT_USER.dealership_id"}}]}`

- [ ] **Fix #3: Fix user update permissions**
  - Settings → Access Control → Roles
  - For non-admin roles:
    - Password field: Only allow if `{"id": {"_eq": "$CURRENT_USER.id"}}`
    - Email field: Only allow if `{"id": {"_eq": "$CURRENT_USER.id"}}`

- [ ] **Fix #4: Add dealership_id filters**
  - For ALL non-admin roles
  - On cars collection (read/update/create):
    - Add filter: `{"dealership_id": {"_eq": "$CURRENT_USER.dealership_id"}}`

- [ ] **Fix #5: Enable TFA on admin policies**
  - Settings → Access Control → Policies
  - For each admin policy:
    - Enable "Enforce Two-Factor Authentication"

- [ ] **Export fixed schema**
  ```bash
  ./schema/scripts/export.sh prod
  ```

### Validate Schema

- [ ] **Run permission linter**
  ```bash
  ./schema/scripts/lint-permissions.sh prod
  ```
  - Should show 0 errors, 0 warnings
  - Fix any issues found

- [ ] **Test schema in staging**
  ```bash
  # Apply to staging first
  ./schema/scripts/apply.sh staging

  # Test all features in staging
  # Verify permissions work correctly
  ```

---

## Phase 2: Extensions Preparation

### Build Extensions

- [ ] **Install extension dependencies**
  ```bash
  cd extensions
  pnpm install
  ```

- [ ] **Build all extensions**
  ```bash
  pnpm build
  ```

- [ ] **Verify build output**
  ```bash
  # Check that dist directories exist
  ls -la endpoints/vehicle-lookup/dist/
  ls -la operations/send-email/dist/
  ls -la hooks/workflow-guard/dist/
  ls -la interfaces/vehicle-lookup-button/dist/
  ```

### Test Extensions Locally

- [ ] **Start development environment**
  ```bash
  docker compose -f docker-compose.development.yml up
  ```

- [ ] **Test vehicle lookup endpoint**
  ```bash
  # Health check
  curl http://localhost:8055/vehicle-lookup/health

  # Test lookup (requires STATENS_VEGVESEN_TOKEN)
  curl http://localhost:8055/vehicle-lookup/regnr/AB12345
  ```

- [ ] **Test send email operation**
  - Create a Flow in Directus
  - Add "Send Email" operation
  - Configure email details
  - Trigger flow and verify email sent

- [ ] **Test workflow guard hook**
  - Create car with status "registered"
  - Try updating to "ready_for_sale" (should fail)
  - Update to "booking" (should succeed)
  - Verify audit logging in Directus logs

- [ ] **Test vehicle lookup button interface**
  - Open car edit form
  - Enter registration number
  - Click "Fetch Vehicle Data"
  - Verify fields populated correctly

---

## Phase 3: CI/CD Setup

### GitHub Repository

- [ ] **Push code to GitHub**
  ```bash
  git add .
  git commit -m "Production-ready setup"
  git push origin main
  ```

- [ ] **Set GitHub secrets**
  - Go to Settings → Secrets and variables → Actions
  - Add secrets:
    - `DOKPLOY_WEBHOOK_URL` - Deployment webhook
    - `DIRECTUS_URL` - Production URL for health checks

### Verify CI/CD Pipeline

- [ ] **Check GitHub Actions**
  - Go to Actions tab
  - Verify all jobs passed:
    - ✅ Lint & Type Check
    - ✅ Build Extensions
    - ✅ Validate Schema
    - ✅ Integration Tests
    - ✅ Security Scan

- [ ] **Fix any CI/CD issues**
  - Review failed job logs
  - Fix issues and re-push

---

## Phase 4: Dokploy Deployment

### Dokploy Setup

- [ ] **Access Dokploy dashboard**
  - Open your Dokploy instance
  - Login with admin credentials

- [ ] **Create new service**
  - Type: Docker Compose
  - Name: directapp
  - Git Repository: `https://github.com/gumpen-app/directapp`
  - Branch: main
  - Compose File: `docker-compose.production.yml`

- [ ] **Set environment variables in Dokploy**
  - Copy all values from your .env file
  - **DO NOT** commit .env to Git
  - Set each variable in Dokploy secrets:
    - DIRECTUS_KEY
    - DIRECTUS_SECRET
    - ADMIN_EMAIL
    - ADMIN_PASSWORD
    - DB_DATABASE
    - DB_USER
    - DB_PASSWORD
    - S3_ACCESS_KEY
    - S3_SECRET_KEY
    - S3_BUCKET
    - S3_REGION
    - EMAIL_FROM
    - RESEND_API_KEY
    - STATENS_VEGVESEN_TOKEN
    - SENTRY_DSN (optional)
    - DOMAIN
    - PUBLIC_URL
    - COOKIE_DOMAIN
    - CORS_ORIGIN

- [ ] **Configure volumes**
  - Verify Dokploy creates directories in `../files/`:
    - postgres-data
    - redis-data
    - backups
    - extensions (copy built extensions here)

### Copy Extensions to Dokploy

- [ ] **Upload built extensions**
  ```bash
  # On your local machine
  cd extensions
  pnpm build

  # Upload to server (adjust path for your setup)
  scp -r endpoints/vehicle-lookup/dist/ user@server:/path/to/dokploy/files/extensions/endpoints/vehicle-lookup/
  scp -r operations/send-email/dist/ user@server:/path/to/dokploy/files/extensions/operations/send-email/
  scp -r hooks/workflow-guard/dist/ user@server:/path/to/dokploy/files/extensions/hooks/workflow-guard/
  scp -r interfaces/vehicle-lookup-button/dist/ user@server:/path/to/dokploy/files/extensions/interfaces/vehicle-lookup-button/
  ```

### Deploy

- [ ] **Deploy via Dokploy**
  - Click "Deploy" in Dokploy UI
  - Monitor deployment logs
  - Wait for all containers to be healthy

- [ ] **Verify containers are running**
  ```bash
  docker ps | grep directapp
  ```
  Should show:
  - directapp (Directus)
  - directapp-postgres
  - directapp-redis
  - directapp-backup

- [ ] **Check container health**
  ```bash
  docker compose -f docker-compose.production.yml ps
  ```
  All services should show "healthy"

---

## Phase 5: Post-Deployment Configuration

### Initial Login

- [ ] **Access Directus admin panel**
  - Open `https://directapp.yourdomain.com/admin`
  - Verify HTTPS is working (Let's Encrypt certificate)
  - Login with `ADMIN_EMAIL` and `ADMIN_PASSWORD`

- [ ] **Change admin password**
  - Settings → Profile → Change Password
  - Use strong password (20+ chars, mixed case, numbers, symbols)

- [ ] **Enable Two-Factor Authentication**
  - Settings → Profile → Two-Factor Authentication
  - Scan QR code with authenticator app
  - Save backup codes in secure location

- [ ] **Remove bootstrap credentials**
  - Edit .env on server (or Dokploy secrets)
  - Remove `ADMIN_EMAIL` and `ADMIN_PASSWORD`
  - Redeploy to apply changes

### Apply Schema

- [ ] **Import production schema**
  ```bash
  # On server or via SSH
  ./schema/scripts/apply.sh prod
  ```

- [ ] **Verify schema applied**
  - Check collections in Directus admin
  - Verify all fields exist
  - Check relationships are correct

- [ ] **Verify permissions**
  - Settings → Access Control → Roles
  - Test each role:
    - Create test users for each role
    - Verify they can only see their dealership's data
    - Verify workflow transitions work
    - Test DELETE is properly scoped

### Create Dealerships

- [ ] **Create dealership records**
  - Content → Dealership
  - Create at least one dealership
  - Note the dealership ID

### Create Users

- [ ] **Create test users**
  - Settings → Access Control → Users
  - Create users for each role:
    - Booking user
    - Workshop user (tech)
    - Workshop user (cosmetic)
    - Sales user
    - Admin user
  - Assign each user to dealership
  - Invite users via email

- [ ] **Test user access**
  - Login as each user
  - Verify they see only their dealership's data
  - Test workflow permissions

---

## Phase 6: Integration Testing

### Vehicle Lookup

- [ ] **Test vehicle lookup endpoint**
  ```bash
  curl https://directapp.yourdomain.com/vehicle-lookup/health
  ```
  Should return: `{"status": "healthy", "configured": true}`

- [ ] **Test vehicle data fetch**
  - Login to Directus
  - Go to Cars → Create New
  - Enter registration number
  - Click "Fetch Vehicle Data" button
  - Verify fields populated from Norwegian registry

- [ ] **Test with invalid regnr**
  - Should show error message
  - Should not crash

### Email Notifications

- [ ] **Test email sending**
  - Create a Flow: Flows → Create Flow
  - Trigger: Manual
  - Operation: Send Email
  - Configure:
    - To: your email
    - Subject: Test Email
    - Text: This is a test
  - Run flow manually
  - Check your inbox
  - Verify email received

- [ ] **Test notification templates**
  - Test each template type:
    - Car status change notification
    - Assignment notification
    - Deadline reminder
  - Verify emails are formatted correctly
  - Check sender address is correct

### Workflow Testing

- [ ] **Test workflow transitions**
  - Create car (status: registered)
  - Update to booking ✓ (should succeed)
  - Try jumping to ready_for_sale ✗ (should fail)
  - Complete each workflow step in order
  - Verify validation at each step

- [ ] **Test workflow guard**
  - Try deleting a car with status != "registered" ✗ (should fail)
  - Try updating sold car ✗ (should fail)
  - Test rework transitions (quality_check → tech_completed) ✓ (should succeed)

### Dealership Isolation

- [ ] **Test multi-tenancy**
  - Create 2 dealerships
  - Create users in each dealership
  - Create cars in each dealership
  - Login as User A (Dealership 1)
    - Should only see Dealership 1 cars
  - Login as User B (Dealership 2)
    - Should only see Dealership 2 cars
  - Verify cross-dealership access is blocked

---

## Phase 7: Backup & Recovery

### Test Backup System

- [ ] **Verify backup container is running**
  ```bash
  docker ps | grep backup
  ```

- [ ] **Check backup files are created**
  ```bash
  ls -lh ../files/backups/
  ```
  Should show daily backups

- [ ] **Test manual backup**
  ```bash
  docker exec directapp-backup /backup.sh
  ```

### Test Restore

- [ ] **Test backup restore (in staging first!)**
  ```bash
  # Get latest backup
  LATEST_BACKUP=$(ls -t ../files/backups/daily/*.sql.gz | head -1)

  # Restore to staging database
  gunzip < "$LATEST_BACKUP" | docker exec -i directapp-staging-postgres psql -U directus -d directapp_staging
  ```

- [ ] **Verify restore worked**
  - Login to staging Directus
  - Check data is present
  - Verify counts match production

- [ ] **Document restore procedure**
  - Save restore command in runbook
  - Test quarterly

---

## Phase 8: Performance & Monitoring

### Performance Testing

- [ ] **Test page load times**
  - Admin panel: < 2 seconds
  - API responses: < 500ms
  - GraphQL queries: < 1 second

- [ ] **Test under load**
  - Use Apache Bench or similar:
    ```bash
    ab -n 1000 -c 10 https://directapp.yourdomain.com/server/health
    ```
  - Verify no errors
  - Check response times are acceptable

### Monitoring Setup

- [ ] **Configure Sentry alerts**
  - Set up email alerts for errors
  - Set alert threshold (e.g., > 10 errors/hour)
  - Test alert delivery

- [ ] **Set up uptime monitoring**
  - Use service like UptimeRobot (free)
  - Monitor: https://directapp.yourdomain.com/server/health
  - Set check interval: 5 minutes
  - Configure alerts (email, SMS)

- [ ] **Monitor database size**
  ```bash
  docker exec directapp-postgres psql -U directus -d directapp -c "SELECT pg_size_pretty(pg_database_size('directapp'));"
  ```

- [ ] **Monitor S3 usage**
  - Check S3 bucket size in AWS/Cloudflare dashboard
  - Set billing alerts

### Security Hardening

- [ ] **Verify HTTPS is enforced**
  - Try accessing http://directapp.yourdomain.com
  - Should redirect to https://

- [ ] **Check security headers**
  ```bash
  curl -I https://directapp.yourdomain.com/admin
  ```
  Should include:
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options

- [ ] **Test rate limiting**
  - Make 100+ requests rapidly
  - Should get rate limited (HTTP 429)

- [ ] **Review firewall rules**
  - Only ports 80, 443 should be open
  - PostgreSQL (5432) should NOT be exposed
  - Redis (6379) should NOT be exposed

---

## Phase 9: Documentation & Training

### User Documentation

- [ ] **Create user guides**
  - [ ] Booking workflow guide
  - [ ] Workshop workflow guide
  - [ ] Sales workflow guide
  - [ ] Admin guide

- [ ] **Record video tutorials** (optional)
  - How to book a car
  - How to complete tech work
  - How to mark car as ready for sale

### Admin Documentation

- [ ] **Document backup/restore procedures**
- [ ] **Document deployment procedures**
- [ ] **Document troubleshooting steps**
- [ ] **Create runbook for common issues**

### Training

- [ ] **Train admin users**
  - User management
  - Role configuration
  - Backup management
  - Extension configuration

- [ ] **Train end users**
  - Each role's workflow
  - How to use vehicle lookup
  - How to interpret notifications

---

## Phase 10: Go-Live

### Final Pre-Launch Checks

- [ ] **Review all previous checklist items**
  - All checkboxes ticked ✓
  - No outstanding issues
  - All tests passed

- [ ] **Staging final test**
  - Run complete end-to-end workflow in staging
  - Verify all features work
  - Check performance is acceptable

- [ ] **Create rollback plan**
  - Document how to rollback if issues occur
  - Have backup ready to restore
  - Know how to switch DNS back

### Launch

- [ ] **Announce maintenance window**
  - Notify users
  - Schedule for off-hours
  - Set expected duration

- [ ] **Deploy to production**
  - Follow deployment procedure
  - Monitor logs for errors
  - Check all services are healthy

- [ ] **Post-launch monitoring**
  - Monitor for 1 hour after launch
  - Check error rates in Sentry
  - Verify backup runs successfully
  - Watch server resources (CPU, RAM, disk)

### Post-Launch

- [ ] **Send launch announcement**
  - Email users
  - Provide login instructions
  - Link to user guides

- [ ] **Monitor closely for 48 hours**
  - Check logs daily
  - Review error reports
  - Respond to user feedback

- [ ] **Schedule 1-week review**
  - Review metrics
  - Gather user feedback
  - Plan improvements

---

## Security Maintenance

### Monthly Tasks

- [ ] **Review access logs**
- [ ] **Check for failed login attempts**
- [ ] **Review Sentry errors**
- [ ] **Update dependencies** (if security patches available)

### Quarterly Tasks

- [ ] **Test backup restore**
- [ ] **Review user permissions**
- [ ] **Security audit**
- [ ] **Performance review**

### Annual Tasks

- [ ] **Rotate security keys**
  - Generate new DIRECTUS_KEY and DIRECTUS_SECRET
  - Update in Dokploy
  - Redeploy
- [ ] **Review and update disaster recovery plan**
- [ ] **Renew SSL certificates** (automatic via Let's Encrypt)
- [ ] **Review and optimize database**

---

## Troubleshooting

### Common Issues

**Can't access admin panel**
- Check DNS: `dig directapp.yourdomain.com`
- Check containers: `docker ps`
- Check Traefik: `docker logs dokploy-traefik`
- Check Directus logs: `docker logs directapp`

**Vehicle lookup not working**
- Verify STATENS_VEGVESEN_TOKEN is set
- Check endpoint health: `/vehicle-lookup/health`
- Check Directus logs for errors
- Verify API token is valid

**Emails not sending**
- Verify RESEND_API_KEY is set
- Check domain is verified in Resend
- Check Resend dashboard for errors
- Test with manual flow trigger

**Database connection errors**
- Check PostgreSQL is running: `docker ps | grep postgres`
- Check credentials in environment
- Check database logs: `docker logs directapp-postgres`

**High CPU/memory usage**
- Check slow queries in PostgreSQL
- Review Redis cache hit rate
- Check for infinite loops in hooks
- Review Sentry performance issues

---

## Emergency Contacts

**Support Resources:**
- Directus Docs: https://docs.directus.io
- Directus Discord: https://directus.chat
- Dokploy Docs: https://docs.dokploy.com
- Resend Support: https://resend.com/support
- Sentry Support: https://sentry.io/support

**Infrastructure:**
- Hosting Provider: _________________
- DNS Provider: _________________
- Backup Location: _________________

**Team Contacts:**
- Primary Admin: _________________
- Secondary Admin: _________________
- Developer: _________________

---

## Changelog

Keep track of major changes:

| Date | Version | Change | Who |
|------|---------|--------|-----|
| YYYY-MM-DD | 1.0.0 | Initial production deployment | _______ |
| YYYY-MM-DD | 1.1.0 | Added X feature | _______ |

---

**Last Updated:** 2025-10-18
**Document Version:** 1.0.0
**Maintained By:** DirectApp Team

---

## ✅ Final Sign-Off

Before going live, ensure:

- [ ] All checklist items completed
- [ ] All tests passed in staging
- [ ] Backup/restore tested
- [ ] Team trained
- [ ] Documentation complete
- [ ] Rollback plan ready

**Deployment Approved By:**

Name: ____________________
Date: ____________________
Signature: ____________________
