# DirectApp Master Implementation Plan

**Norwegian Car Dealership Management System**

**Version:** 2.0 (Updated with Production Engineering)
**Last Updated:** 2025-10-18
**Timeline:** 12-14 weeks to production
**Status:** Ready to begin Phase 0

---

## Table of Contents

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Implementation Phases](#implementation-phases)
4. [Dependencies & Timeline](#dependencies--timeline)
5. [Risk Management](#risk-management)
6. [Success Metrics](#success-metrics)

---

## Overview

### Vision

Transform DirectApp from a "testy and dangerous" prototype into a **production-grade, multi-tenant car dealership management platform** for the Norwegian market.

### Core Features

| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| **Role-Optimized Workflows** | Each user role sees only relevant fields/actions | 🔴 Critical | 2 |
| **Vehicle Registry Integration** | Auto-populate data from Statens Vegvesen API | 🔴 Critical | 1 |
| **Smart Notifications** | Email + in-app via Resend API | 🟡 High | 3 |
| **Multi-Dealership** | Full tenant isolation with cross-dealership prep | 🟡 High | 4 |
| **Scheduling System** | Resource-aware booking for tech/cosmetic work | 🟢 Medium | 5 |
| **MCP Integration** | AI assistant with official Directus MCP server | 🟢 Medium | 6 |
| **Production Infrastructure** | Secure deployment with monitoring | 🔴 Critical | 0 |

### Technical Stack

```
Frontend:         Directus 11.3.2 Admin UI + Custom Extensions
Backend:          Directus API (REST + GraphQL)
Database:         PostgreSQL 15.6 with PostGIS
Cache:            Redis 7.2.4
Storage:          S3-compatible (AWS S3 / R2 / MinIO)
Email:            Resend API
Vehicle Data:     Statens Vegvesen Kjøretøyregisteret
Deployment:       Docker + Dokploy + Traefik
Monitoring:       Sentry
CI/CD:            GitHub Actions
```

---

## Current Status

### ✅ Completed (Phase 0.5 - Production Engineering Setup)

**Week -1 to 0: Infrastructure & DevOps Foundation**

All production engineering infrastructure is now ready:

- ✅ **Docker Compose Configurations**
  - Production (`docker-compose.production.yml`)
  - Staging (`docker-compose.staging.yml`)
  - Development (`docker-compose.development.yml`)
  - All with Codex's security fixes applied

- ✅ **Environment Templates**
  - `.env.production.example` (no defaults, all required)
  - `.env.staging.example` (separate from prod)
  - `.env.development.example` (safe defaults for dev)

- ✅ **Schema-as-Code Workflow**
  - `schema/scripts/export.sh` - Export schema snapshots
  - `schema/scripts/apply.sh` - Apply schema to environments
  - `schema/scripts/diff.sh` - Compare schemas
  - `schema/scripts/lint-permissions.sh` - Security linter

- ✅ **Extensions Workspace**
  - `extensions/endpoints/vehicle-lookup/` - Norwegian registry integration
  - `extensions/operations/send-email/` - Resend email notifications
  - `extensions/hooks/workflow-guard/` - Workflow validation
  - `extensions/interfaces/vehicle-lookup-button/` - UI component
  - Full TypeScript build system with pnpm

- ✅ **CI/CD Pipeline**
  - `.github/workflows/directus-ci.yml`
  - Automated testing with ephemeral Directus instances
  - Extension builds
  - Schema validation
  - Permission linting
  - Security scanning
  - Docker image building
  - Dokploy deployment automation

- ✅ **Documentation**
  - `PRODUCTION_CHECKLIST.md` - Complete deployment guide
  - `extensions/README.md` - Extension development guide
  - Schema analysis in `.claude/SCHEMA_ANALYSIS.md`

### 🔴 Critical Issues Identified (Must Fix in Phase 0)

From schema analysis - **15 critical security/data integrity issues:**

1. No unique constraints on VIN/order_number (duplicate data possible)
2. Unscoped DELETE permissions (users can delete ANY car)
3. No dealership data isolation (users see all dealerships)
4. Password/email update allowed by non-admins
5. Wrong foreign key cascades (deletion issues)
6. No validation rules (invalid data accepted)
7. No audit logging (no accountability)
8. TFA not enforced on admin policies
9. Weak status workflow (no state validation)
10. Missing required field validation
11. No index optimization (slow queries)
12. Overly permissive field access
13. No soft delete (data loss risk)
14. Duplicate permission rules (confusion)
15. Missing backup verification

**These MUST be fixed before building new features.**

---

## Implementation Phases

### Phase 0: Critical Foundation (Weeks 1-2) 🔴 BLOCKER

**Goal:** Make current system production-safe

**Depends on:** Phase 0.5 (completed)

#### Sprint 0.1: Database Integrity (Week 1)

**Tasks:**
1. Add unique constraints (4h)
   - VIN: `UNIQUE (vin)`
   - Order number: `UNIQUE (order_number)`
   - Dealership code: `UNIQUE (dealership_code)`

2. Fix foreign key cascades (3h)
   - User deletion: `ON DELETE SET NULL`
   - File junction: `ON DELETE CASCADE`
   - Dealership: `ON DELETE RESTRICT`

3. Add validation rules (7h)
   - VIN: ISO 3779 format (`^[A-HJ-NPR-Z0-9]{17}$`)
   - License plate: Norwegian format (`AA 12345`)
   - Email: Standard RFC 5322
   - Phone: Norwegian format

4. Create database indexes (3h)
   - `cars(vin)`, `cars(regnr)`, `cars(status)`
   - `cars(dealership_id, status)`
   - `directus_users(dealership_id)`

**Deliverable:** Schema with integrity guaranteed
**Testing:** Run `./schema/scripts/lint-permissions.sh prod` - 0 errors

#### Sprint 0.2: Security Lockdown (Week 2)

**Tasks:**
1. Remove dangerous DELETE permission (2h)
   - Implement soft delete (status="archived")
   - Update all policies

2. Implement dealership isolation (8h)
   - Add `dealership_id` to users table
   - Update ALL permissions with filters:
     ```json
     {
       "permissions": {
         "dealership_id": {"_eq": "$CURRENT_USER.dealership_id"}
       }
     }
     ```

3. Fix user update permissions (2h)
   - Password: only self (`{"id": {"_eq": "$CURRENT_USER.id"}}`)
   - Email: only self

4. Add audit logging (6h)
   - Log all car status changes
   - Log permission changes
   - Log admin actions

5. Enable TFA on all admin policies (1h)

**Deliverable:** System passes security audit
**Testing:**
- Permission linter: 0 errors, 0 warnings
- Penetration test: No cross-tenant data access
- Audit log: All actions tracked

---

### Phase 1: Vehicle Registry Integration (Weeks 3-4)

**Goal:** Auto-populate vehicle data from Norwegian registry

**Depends on:** Phase 0

**Already built:** `extensions/endpoints/vehicle-lookup/` ✅

#### Sprint 1.1: API Integration (Week 3)

**Tasks:**
1. Get Statens Vegvesen API access (1 day)
   - Register at vegvesen.no
   - Get test environment token
   - Test API connectivity

2. Deploy vehicle lookup endpoint (2h)
   - Already built in `extensions/endpoints/vehicle-lookup/`
   - Configure `STATENS_VEGVESEN_TOKEN`
   - Deploy to staging

3. Add lookup button to car form (4h)
   - Already built in `extensions/interfaces/vehicle-lookup-button/`
   - Configure field mappings
   - Test in staging

4. Add validation for fetched data (6h)
   - Verify VIN format
   - Check make/model against known values
   - Validate year (1900-current)

**Deliverable:** Working vehicle lookup in staging
**Testing:**
- Lookup 100 test vehicles
- Verify 95%+ success rate
- Error handling for invalid regnr

#### Sprint 1.2: Production Deployment (Week 4)

**Tasks:**
1. Register with Maskinporten (3 days)
   - OAuth2 for production access
   - Production API credentials

2. Deploy to production (1 day)
   - Apply to production via Dokploy
   - Configure production token
   - Monitor API quota

3. User training (1 day)
   - Create tutorial video
   - Document in user guide

**Deliverable:** Production vehicle lookup
**Success Metric:** 500+ successful lookups in first week

---

### Phase 2: Role-Optimized Workflows (Weeks 4-5)

**Goal:** Each role sees only relevant fields

**Depends on:** Phase 0 (dealership isolation)

**Already built:** `extensions/hooks/workflow-guard/` ✅

#### Sprint 2.1: Role Definition (Week 4-5, overlaps with 1.2)

**Tasks:**
1. Map workflow to roles (8h)
   ```
   Booking → Workshop (Tech) → Workshop (Cosmetic) →
   Quality → Sales → Admin
   ```

2. Create role-specific field layouts (12h)
   - Booking: regnr, vin, customer_info, booking_date
   - Workshop Tech: tech_*, parts_used, hours_spent
   - Workshop Cosmetic: cosmetic_*, materials_used
   - Quality: quality_*, approval_status
   - Sales: price, sold_*, customer_delivery
   - Admin: ALL fields

3. Configure conditional field visibility (8h)
   - Use Directus field conditions
   - Hide fields based on role
   - Test all role combinations

4. Deploy workflow guard hook (2h)
   - Already built in `extensions/hooks/workflow-guard/`
   - Validates state transitions
   - Prevents workflow violations

**Deliverable:** Role-specific UIs
**Testing:** Login as each role, verify field visibility

#### Sprint 2.2: Workflow Refinement (Week 5)

**Tasks:**
1. Add workflow status indicators (4h)
   - Progress bar in car detail view
   - Color coding by status

2. Add role-specific dashboards (8h)
   - Booking: cars awaiting booking
   - Workshop: cars in queue
   - Sales: cars ready for sale

3. Add notification triggers (4h)
   - Status change → notify next role
   - Deadline approaching → notify assignee

**Deliverable:** Complete workflow system
**Success Metric:** Average time from booking to ready_for_sale < 7 days

---

### Phase 3: Smart Notifications (Weeks 5-6)

**Goal:** Email + in-app notifications via Resend

**Depends on:** Phase 2 (workflow)

**Already built:** `extensions/operations/send-email/` ✅

#### Sprint 3.1: Email Templates (Week 5-6, overlaps with 2.2)

**Tasks:**
1. Set up Resend account (1h)
   - Sign up, verify domain
   - Get API key
   - Test email sending

2. Create email templates (12h)
   - Car status changed (e.g., "ready for tech work")
   - Assignment notification (e.g., "car assigned to you")
   - Deadline reminder (e.g., "car overdue in workshop")
   - Daily summary (e.g., "5 cars ready for quality check")

3. Design templates (8h)
   - Branded HTML emails
   - Mobile-responsive
   - Plain text fallback

**Deliverable:** Email templates in Resend

#### Sprint 3.2: Notification Flows (Week 6)

**Tasks:**
1. Create Flows for each trigger (8h)
   - Car status change → send email
   - Assignment → send email
   - Daily cron → send summary

2. Add in-app notifications (12h)
   - Use Directus notifications module
   - Badge count in admin panel
   - Mark as read functionality

3. User notification preferences (6h)
   - Enable/disable email notifications
   - Set notification frequency

**Deliverable:** Full notification system
**Testing:**
- Trigger each notification type
- Verify delivery within 1 minute
- Check 95%+ delivery rate

---

### Phase 4: Multi-Dealership Architecture (Weeks 6-7)

**Goal:** Support multiple dealerships with prep centers

**Depends on:** Phase 0 (data isolation)

#### Sprint 4.1: Dealership Hierarchy (Week 6-7)

**Tasks:**
1. Design dealership schema (4h)
   ```sql
   dealership:
     - id
     - name
     - type: enum(self_sustained, prep_center, main_dealership)
     - parent_dealership_id (nullable)
   ```

2. Add prep center logic (12h)
   - Prep centers can work on cars from any dealership
   - Main dealerships can send cars to prep centers
   - Track car movement between dealerships

3. Add cross-dealership permissions (8h)
   - Prep center users see cars from all linked dealerships
   - Main dealership users see only their cars
   - Admin sees all

4. Add dealership transfer workflow (8h)
   - Transfer car to prep center
   - Track transfer history
   - Return car to original dealership

**Deliverable:** Multi-dealership support
**Testing:**
- Create 3 dealerships (2 main, 1 prep center)
- Transfer car between dealerships
- Verify permissions

---

### Phase 5: Scheduling & Resource Management (Weeks 7-9)

**Goal:** Resource-aware booking for workshop tasks

**Depends on:** Phase 2 (workflow), Phase 4 (multi-dealership)

#### Sprint 5.1: Resource Definition (Week 7)

**Tasks:**
1. Create resource collections (8h)
   ```
   workshop_resources:
     - id
     - name (e.g., "Lift 1", "Paint Booth")
     - type: enum(lift, paint_booth, tech_station)
     - dealership_id
     - available: boolean

   resource_schedules:
     - id
     - resource_id
     - car_id
     - start_time
     - end_time
     - status: enum(booked, in_progress, completed)
   ```

2. Add resource availability logic (12h)
   - Check resource availability before booking
   - Prevent double-booking
   - Calendar view of resource usage

**Deliverable:** Resource management schema

#### Sprint 5.2: Booking Interface (Week 8)

**Tasks:**
1. Create calendar interface (16h)
   - Week/day view
   - Drag-and-drop booking
   - Resource filtering

2. Add booking validation (8h)
   - Resource must be available
   - Car must be in correct status
   - Estimated duration required

3. Add automatic scheduling (12h)
   - Suggest next available slot
   - Consider car priority
   - Balance resource utilization

**Deliverable:** Working scheduling system

#### Sprint 5.3: Time Tracking (Week 9)

**Tasks:**
1. Add time tracking fields (4h)
   - Actual vs estimated time
   - Resource usage logs

2. Add reporting (12h)
   - Resource utilization %
   - Average time per car
   - Bottleneck identification

**Deliverable:** Complete scheduling + reporting
**Success Metric:** Resource utilization 60-80% (healthy range)

---

### Phase 6: MCP Integration (Weeks 9-10)

**Goal:** AI assistant access via Directus MCP server

**Depends on:** Phase 0-5 complete

#### Sprint 6.1: MCP Server Setup (Week 9-10)

**Tasks:**
1. Research official Directus MCP server (4h)
   - Review documentation
   - Test connectivity

2. Deploy MCP server (8h)
   - Install dependencies
   - Configure authentication
   - Connect to Directus API

3. Create custom tools (12h)
   - Car search by VIN/regnr
   - Workflow status queries
   - Generate reports

4. Test AI assistant integration (8h)
   - Test with Claude
   - Document capabilities
   - Create example queries

**Deliverable:** Working MCP integration
**Testing:** AI can query cars, trigger workflows

---

### Phase 7: Production Deployment (Weeks 10-11)

**Goal:** Deploy to production with monitoring

**Depends on:** All previous phases, Phase 0.5 infrastructure

**Already completed:**
- ✅ Docker configurations
- ✅ CI/CD pipeline
- ✅ Deployment scripts
- ✅ Production checklist

#### Sprint 7.1: Staging Validation (Week 10)

**Tasks:**
1. Deploy to staging (1 day)
   - Use `docker-compose.staging.yml`
   - Apply all schema changes
   - Deploy all extensions

2. Load testing (2 days)
   - Simulate 50 concurrent users
   - Test 1000+ cars in database
   - Verify performance < 2s page loads

3. Security testing (2 days)
   - Run OWASP ZAP scan
   - Penetration test
   - Fix any vulnerabilities

**Deliverable:** Staging passes all tests

#### Sprint 7.2: Production Deployment (Week 11)

**Tasks:**
1. Follow `PRODUCTION_CHECKLIST.md` (3 days)
   - Complete all 10 phases
   - Verify all checkboxes
   - Get final approval

2. Deploy to production (1 day)
   - Use Dokploy
   - Monitor during deployment
   - Verify health checks

3. Post-deployment monitoring (1 day)
   - Watch logs for 24 hours
   - Check error rates
   - Verify backups running

**Deliverable:** Production system live
**Success Metric:** 99.9% uptime in first week

---

### Phase 8: Documentation & Training (Weeks 11-12)

**Goal:** User adoption and knowledge transfer

**Depends on:** Phase 7

#### Sprint 8.1: Documentation (Week 11-12)

**Tasks:**
1. User documentation (16h)
   - Role-specific guides
   - Video tutorials
   - FAQ

2. Admin documentation (12h)
   - Deployment procedures
   - Troubleshooting guide
   - Backup/restore procedures

3. Developer documentation (8h)
   - Extension development guide
   - API documentation
   - Contributing guide

**Deliverable:** Complete documentation

#### Sprint 8.2: Training (Week 12)

**Tasks:**
1. Train admin users (1 day)
   - System administration
   - User management
   - Backup procedures

2. Train end users (2 days)
   - Role-specific training
   - Hands-on practice
   - Q&A sessions

3. Create support materials (1 day)
   - Quick reference cards
   - Video library
   - Support ticketing system

**Deliverable:** Trained team ready to use system
**Success Metric:** 90%+ user satisfaction

---

## Dependencies & Timeline

### Gantt Chart

```
Phase 0.5 (Infrastructure)     [===============] Week -1 to 0  ✅ DONE
Phase 0 (Critical Foundation)  [=======]       Week 1-2       🔴 START HERE
Phase 1 (Vehicle Registry)     [=======]       Week 3-4       ⬜ Pending
Phase 2 (Role Workflows)       [=======]       Week 4-5       ⬜ Pending
Phase 3 (Notifications)        [=======]       Week 5-6       ⬜ Pending
Phase 4 (Multi-Dealership)     [=======]       Week 6-7       ⬜ Pending
Phase 5 (Scheduling)           [===========]   Week 7-9       ⬜ Pending
Phase 6 (MCP Integration)      [=======]       Week 9-10      ⬜ Pending
Phase 7 (Production Deploy)    [=======]       Week 10-11     ⬜ Pending
Phase 8 (Docs & Training)      [=======]       Week 11-12     ⬜ Pending
```

### Critical Path

```
0.5 → 0 → 1 → 7 (Minimum viable production)
0 → 2 → 3 → 7 (Workflow + notifications)
0 → 4 → 5 → 7 (Multi-dealership + scheduling)
7 → 8 (Post-deployment)
6 (Optional, can be added later)
```

### Milestone Dependencies

| Phase | Depends On | Blocks | Can Run Parallel With |
|-------|-----------|--------|----------------------|
| 0.5 | - | 0 | - |
| 0 | 0.5 | 1,2,4 | - |
| 1 | 0 | 7 | - |
| 2 | 0 | 3,7 | 1 (week 4-5 overlap) |
| 3 | 2 | 7 | 4 |
| 4 | 0 | 5,7 | 3 |
| 5 | 2,4 | 7 | 6 |
| 6 | - | - | 1,2,3,4,5 |
| 7 | 0,1,2,3,4,5 | 8 | - |
| 8 | 7 | - | - |

---

## Risk Management

### High-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Phase 0 takes longer than 2 weeks** | High | Critical | Start immediately, allocate best developer |
| **Statens Vegvesen API unreliable** | Medium | High | Cache responses, implement fallback |
| **Resend email deliverability issues** | Low | Medium | Test thoroughly in staging, have backup SMTP |
| **Multi-tenancy data leaks** | Low | Critical | Extensive testing, security audit |
| **Performance issues at scale** | Medium | High | Load testing, database optimization |
| **User adoption low** | Medium | Medium | Comprehensive training, gradual rollout |

### Risk Response Plan

**If Phase 0 takes > 2 weeks:**
- Extend timeline, don't compromise on security
- Consider hiring additional developer
- De-scope non-critical fixes

**If vehicle API is unreliable:**
- Implement retry logic (3 attempts)
- Cache successful lookups
- Allow manual entry as fallback

**If email deliverability < 90%:**
- Check Resend domain verification
- Implement delivery status tracking
- Switch to backup SMTP (Postmark/SendGrid)

---

## Success Metrics

### Phase 0 (Foundation)
- ✅ Permission linter: 0 errors, 0 warnings
- ✅ Security audit: No vulnerabilities
- ✅ Data integrity: 100% (no orphaned records)

### Phase 1 (Vehicle Registry)
- ✅ 500+ successful lookups in first week
- ✅ 95%+ API success rate
- ✅ < 3s average lookup time

### Phase 2 (Workflows)
- ✅ Average time booking → ready_for_sale: < 7 days
- ✅ 90%+ user satisfaction with role UIs
- ✅ < 5 workflow violations per week

### Phase 3 (Notifications)
- ✅ 95%+ email delivery rate
- ✅ < 1 minute notification latency
- ✅ 80%+ users enable notifications

### Phase 4 (Multi-Dealership)
- ✅ 100% data isolation (zero cross-tenant leaks)
- ✅ 10+ successful car transfers in first month

### Phase 5 (Scheduling)
- ✅ 60-80% resource utilization
- ✅ < 10% double-booking incidents
- ✅ 50%+ reduction in workflow bottlenecks

### Phase 6 (MCP)
- ✅ AI can answer 90%+ queries accurately
- ✅ 100+ AI interactions in first month

### Phase 7 (Production)
- ✅ 99.9% uptime in first month
- ✅ < 2s average page load time
- ✅ Backups verified and tested

### Phase 8 (Training)
- ✅ 90%+ user satisfaction
- ✅ < 5 support tickets per week after training
- ✅ 100% team members trained

---

## Next Steps

### Immediate Actions (This Week)

1. **Start Phase 0.1** - Database Integrity
   ```bash
   # Review current schema
   cat schema/snapshots/prod.json

   # Apply to development
   ./schema/scripts/apply.sh dev

   # Start fixing constraints
   ```

2. **Set up development environment**
   ```bash
   cp .env.development.example .env
   docker compose -f docker-compose.development.yml up
   ```

3. **Create GitHub issues from GITHUB_ISSUES_TEMPLATE.md**
   ```bash
   # Create issues for Phase 0 tasks
   # Assign to team members
   # Set milestones
   ```

4. **Schedule team kickoff meeting**
   - Review master plan
   - Assign Phase 0 tasks
   - Set expectations

### Month 1 Goals

- ✅ Phase 0 complete (database + security)
- ✅ Phase 1 complete (vehicle lookup working)
- ✅ Phase 2 started (role workflows)

### Month 2 Goals

- ✅ Phase 2-4 complete (workflows, notifications, multi-dealership)
- ✅ Phase 5 started (scheduling)

### Month 3 Goals

- ✅ Phase 5-6 complete
- ✅ Phase 7 complete (production deployment)
- ✅ Phase 8 started (documentation)

---

## Appendix

### Key Documents

- `.claude/SCHEMA_ANALYSIS.md` - Complete schema analysis with 15 critical issues
- `.claude/PRODUCTION_ROADMAP.md` - Detailed phase breakdown
- `.claude/GITHUB_ISSUES_TEMPLATE.md` - Ready-to-create GitHub issues
- `PRODUCTION_CHECKLIST.md` - 200+ item deployment checklist
- `extensions/README.md` - Extension development guide
- `DOKPLOY_DEPLOYMENT_GUIDE.md` - Deployment procedures

### External Resources

- Directus Docs: https://docs.directus.io
- Statens Vegvesen API: https://www.vegvesen.no/fag/teknologi/apne-data/
- Resend Docs: https://resend.com/docs
- Maskinporten Guide: https://docs.digdir.no/maskinporten_guide_apikonsument.html
- Dokploy Docs: https://docs.dokploy.com

---

**Status:** Ready to begin Phase 0
**Updated:** 2025-10-18
**Version:** 2.0
**Maintained by:** DirectApp Team

**BEGIN DEVELOPMENT ▶️**
