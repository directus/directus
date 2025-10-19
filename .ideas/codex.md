I reviewed the Directus schema exports and your roadmap docs. Here’s a tight validation with concrete production-focused adjustments.

Validation Summary

Your roadmap is strong and covers the right domains: security, data integrity, role UX, automation, multi-dealership, deploy/ops.
The Phase 0 security/data-integrity work is spot-on and should be prioritized before any features.
Biggest gap: formalize schema-as-code + CI drift checks and pin production images/versions. Avoid “latest”.
Critical Fixes (from exports)

Unscoped delete on cars (Booking): directapp/schema-exported/roles.json:137
Non-admin can update directus_users including password: directapp/schema-exported/roles.json:170
Overlapping/duplicated user update rules (self-only vs broad): directapp/schema-exported/roles.json:441
TFA off on policies (enable for admin at minimum): directapp/schema-exported/roles.json:88
Adjustments To Your Roadmap

Replace “latest” image with pinned version
Use directus/directus:<stable-tag> and postgres:15-alpine. Avoid latest in production.
Prefer Directus schema config over raw SQL when possible
Unique constraints: set field meta.unique = true and apply via CLI; only use SQL where Directus can’t express it.
Relation on_delete = CASCADE on junctions (e.g., cars_files) through relation config rather than ad‑hoc SQL.
Enforce multi-tenant scoping everywhere
Add permissions + presets with dealership_id = $CURRENT_USER.dealership_id on all non-admin read/write. Document this as a single shared condition block to avoid drift.
Lock down user management
Remove password, email, and dealership_id from all non-admin update fields; keep the self‑only update rule (id = $CURRENT_USER) for benign profile fields.
TFA and IP controls
Set enforce_tfa = true for Admin (and optionally Booking/Sales).
Add ip_access allowlists for Admin policies for office/VPN subnets.
Remove demo/noisy roles
Archive or remove demo role and any dealership-specific role variants that should be groups/policies instead of roles.
Storage and uploads
Switch uploads to S3-compatible storage (MinIO in dev, S3 in prod) and lock file permissions to role policy; avoid local ./uploads in prod.
Schema-As-Code Workflow

Files and layout
Keep exports under directapp/schema-exported/ as the source of truth.
Add directapp/schema/ with:
snapshots/dev.json, snapshots/staging.json, snapshots/prod.json
scripts/export.sh, scripts/apply.sh, scripts/diff.sh
Commands (examples)
npx directus schema snapshot ./schema/snapshots/dev.json
npx directus schema diff ./schema/snapshots/prod.json ./schema/snapshots/dev.json
npx directus schema apply ./schema/snapshots/prod.json
Policy linting
Add a small script to assert no permissions: null for delete and that dealership_id filters exist on all non-admin policies.
CI/CD Outline

PR checks
Start ephemeral Directus (docker compose), apply schema snapshot, run drift check, run permission smoke tests (Directus SDK tries to perform forbidden actions and expects 403).
Validate permissions matrix (read/write/update per role).
Build/deploy
Build any extensions, run database migrations (if any SQL), apply schema snapshot, warm cache, health check /server/health.
Backups and monitoring
Daily Postgres backups with retention, restore test job weekly.
Sentry for error tracking; structured JSON logs; alert on 5xx rate.
Targeted Fixes Mapped To Files

Remove booking delete or scope it:
directapp/schema-exported/roles.json:137 → remove or add validation filter; prefer archive via status.
Lock user updates
directapp/schema-exported/roles.json:170 → remove password, email, dealership_id from non-admin; keep self-only rule at directapp/schema-exported/roles.json:441.
Enforce TFA
Policies: set enforce_tfa: true for Admin and other sensitive policies: directapp/schema-exported/roles.json:88, 101, 114, 127.
Deployment Notes

Compose
Pin images; use S3 for storage; enable Redis cache; add healthchecks; read-only filesystem for Directus container when possible.
Security env
Set CORS_ENABLED=true, CORS_ORIGIN to your domains; set RATE_LIMITER=true and sane defaults; set PUBLIC_URL.
Indexes
Ensure DB indexes on vin, order_number, dealership_id, status, date_created.
Open Questions

Do you intend to deploy the whole monorepo here, or use official Directus + this repo for schema and extensions only? I recommend the latter.
Is “Booking delete” truly needed for any exception workflow? If so, scope tightly and require admin-gated flow.
Which cloud/storage target (S3, R2, MinIO) should we standardize for prod?
Next Steps

I can:
Patch roles.json to remove dangerous permissions and enable TFA.
Add schema/ + scripts for snapshot/diff/apply.
Provide a minimal GitHub Action that spins up Directus, applies schema, and runs permission smoke tests.
Tell me if you want me to proceed with the above now, and whether to pin Directus to a specific version tag.
How can github action spin up directus?


Here’s a minimal, reliable way to spin up Directus in GitHub Actions using service containers.

Recommended Workflow

Spins up Postgres, Redis, and a pinned Directus image.
Waits for health, logs in, and does a simple API sanity check.
Ready to extend with schema apply/diff when you add snapshots.
.github/workflows/directus-ci.yml:1

name: Directus CI

on:
  push:
    paths:
      - "directapp/**"
      - ".github/workflows/directus-ci.yml"
  pull_request:
    paths:
      - "directapp/**"
      - ".github/workflows/directus-ci.yml"

jobs:
  spin-up-directus:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: directapp
          POSTGRES_USER: directus
          POSTGRES_PASSWORD: strong-password
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U directus -d directapp"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 10

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

      directus:
        image: directus/directus:10.12.4
        env:
          KEY: "0123456789abcdef0123456789abcdef"          # 32+ chars
          SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"  # 64+ chars
          DB_CLIENT: pg
          DB_HOST: postgres
          DB_PORT: 5432
          DB_DATABASE: directapp
          DB_USER: directus
          DB_PASSWORD: strong-password
          ADMIN_EMAIL: admin@example.com
          ADMIN_PASSWORD: password123
          CACHE_ENABLED: "true"
          CACHE_STORE: redis
          REDIS: redis://redis:6379
          PUBLIC_URL: http://localhost:8055
        ports:
          - 8055:8055

    steps:
      - uses: actions/checkout@v4

      - name: Wait for Directus to be healthy
        run: |
          for i in $(seq 1 90); do
            if curl -sf http://localhost:8055/server/health > /dev/null; then
              echo "Directus is up"; exit 0
            fi
            echo "Waiting for Directus... ($i)"
            sleep 2
          done
          echo "Directus failed to start" >&2
          docker ps -a
          exit 1

      - name: Get admin token
        run: |
          TOKEN=$(curl -sS -X POST http://localhost:8055/auth/login \
            -H 'Content-Type: application/json' \
            -d '{"email":"admin@example.com","password":"password123"}' | jq -r '.data.access_token')
          echo "DIRECTUS_TOKEN=$TOKEN" >> $GITHUB_ENV
          test -n "$TOKEN" -a "$TOKEN" != "null"

      - name: Sanity check API
        run: |
          curl -sf -H "Authorization: Bearer $DIRECTUS_TOKEN" \
            http://localhost:8055/users/me | jq .

      # Optional: Apply schema snapshot when you add one under directapp/schema/snapshots
      - name: (Optional) Apply schema snapshot
        if: false # set to true once you have a snapshot file
        env:
          DIRECTUS_URL: http://localhost:8055
        run: |
          npm -g i directus@10.12.4
          directus schema apply directapp/schema/snapshots/prod.json
Notes

Pin the Directus version; don’t use latest.
The admin is bootstrapped via ADMIN_EMAIL/ADMIN_PASSWORD for CI only.
When you add schema snapshots, flip the apply step to true. If you want, I can scaffold directapp/schema/snapshots/ and a diff/apply script next.
So this just runs on my selfhosted runner, and is production safe?


Short answer: It will run on a self‑hosted runner if Docker is available, but this workflow is for CI only, not a production deployment. It’s “production‑safe” in the sense that it’s isolated, ephemeral, and shouldn’t touch prod resources if configured as below.

Self‑Hosted Runner Requirements

Linux runner with Docker Engine installed and available to the runner user.
Network egress allowed (to pull images).
No privileged ports collisions if you bind host ports (or use containerized job to avoid binding).
Safer CI Pattern (no host port exposure)
Use a containerized job so steps and services share a Docker network; no host bind needed. Access Directus by service name.

.github/workflows/directus-ci.yml:1

name: Directus CI

on:
  push:
    paths: ["directapp/**", ".github/workflows/directus-ci.yml"]
  pull_request:
    paths: ["directapp/**", ".github/workflows/directus-ci.yml"]

jobs:
  spin-up-directus:
    runs-on: self-hosted
    container: node:20-alpine
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: directapp
          POSTGRES_USER: directus
          POSTGRES_PASSWORD: ${{ secrets.CI_DB_PASSWORD }}
        options: >-
          --health-cmd "pg_isready -U directus -d directapp"
          --health-interval 10s --health-timeout 5s --health-retries 10

      redis:
        image: redis:7-alpine

      directus:
        image: directus/directus:10.12.4
        env:
          KEY: ${{ secrets.CI_DIRECTUS_KEY }}
          SECRET: ${{ secrets.CI_DIRECTUS_SECRET }}
          DB_CLIENT: pg
          DB_HOST: postgres
          DB_PORT: 5432
          DB_DATABASE: directapp
          DB_USER: directus
          DB_PASSWORD: ${{ secrets.CI_DB_PASSWORD }}
          ADMIN_EMAIL: ci-admin@example.com
          ADMIN_PASSWORD: ${{ secrets.CI_ADMIN_PASSWORD }}
          CACHE_ENABLED: "true"
          CACHE_STORE: redis
          REDIS: redis://redis:6379
          PUBLIC_URL: http://directus:8055

    steps:
      - uses: actions/checkout@v4

      - name: Install tools
        run: apk add --no-cache curl jq

      - name: Wait for Directus
        run: |
          for i in $(seq 1 90); do
            if curl -sf http://directus:8055/server/health > /dev/null; then exit 0; fi
            echo "Waiting for Directus... ($i)"; sleep 2
          done
          exit 1

      - name: Get admin token
        run: |
          TOKEN=$(curl -sS -X POST http://directus:8055/auth/login \
            -H 'Content-Type: application/json' \
            -d '{"email":"ci-admin@example.com","password":"'"${CI_ADMIN_PASSWORD}"'"}' | jq -r '.data.access_token')
          test -n "$TOKEN" -a "$TOKEN" != "null"
          echo "DIRECTUS_TOKEN=$TOKEN" >> $GITHUB_ENV
        env:
          CI_ADMIN_PASSWORD: ${{ secrets.CI_ADMIN_PASSWORD }}

      - name: Sanity check
        run: curl -sf -H "Authorization: Bearer $DIRECTUS_TOKEN" http://directus:8055/users/me | jq .
If you prefer host job + services

Keep your original pattern but understand it binds ports on the runner host (8055, 5432, 6379). Ensure no conflicts and firewall blocks external access.
Production Safety Notes

CI stack is for tests only, not a prod deployment. Do not point it at production DB or reuse production values for KEY, SECRET, or admin credentials.
Pin images (done above). Avoid latest.
Use GitHub Secrets for all sensitive envs (as shown).
Don’t mount volumes in CI; let containers be ephemeral.
On self‑hosted, prefer the containerized job approach to avoid exposing ports on the host.
Runner hardening: isolate the runner on a private subnet, restrict inbound, rotate runners or run jobs in ephemeral VMs/containers if possible.
About docker-compose.dokploy.yml

I couldn’t find directapp/docker-compose.dokploy.yml in the repo. If you want, I can create a production‑safe Dokploy compose with pinned images, S3/Redis, healthchecks, backups, and environment templating.
its there now


Short answer:

GitHub Actions on your self-hosted runner is safe for CI (ephemeral stack for tests). It should not host production.
Your Dokploy compose is a solid start for production; make the changes below to harden it.
CI vs Production

CI: Run Directus as a job service (no host ports) and use secrets; destroy containers after tests.
Prod: Deploy via Dokploy using directapp/docker-compose.dokploy.yml, not from your runner.
Must Fix Before Prod

Pin Directus version
directapp/docker-compose.dokploy.yml:16 → use a specific 11.x.y tag or digest (avoid :11 floating).
Don’t expose port 8055 on host
directapp/docker-compose.dokploy.yml:25 → remove ports: and rely on Traefik only.
Require real secrets; remove unsafe defaults
directapp/docker-compose.dokploy.yml:36-37, 40-41 → set KEY, SECRET, ADMIN_* in Dokploy secrets; avoid :-fallback defaults. Use admin creds only on first bootstrap, then remove them and redeploy.
Healthcheck tool
directapp/docker-compose.dokploy.yml:114 → replace wget with curl to avoid missing binary:
test: ["CMD-SHELL","curl -fsS http://localhost:8055/server/health || exit 1"]
Postgres locales on Alpine
directapp/docker-compose.dokploy.yml:138 → --lc-collate=nb_NO.UTF-8 and --lc-ctype=nb_NO.UTF-8 likely fail on Alpine. Use only --encoding=UTF8 or switch to a Debian-based Postgres image with locales preinstalled.
Strongly Recommended

Object storage for uploads
Replace local storage with S3-compatible storage for resilience and scaling:
STORAGE_LOCATIONS: s3
STORAGE_S3_DRIVER: s3
STORAGE_S3_KEY/SECRET/BUCKET/REGION
Optional STORAGE_S3_ENDPOINT (MinIO/Cloudflare R2)
Proxy/cookie correctness
Add TRUST_PROXY: "true" for accurate IPs and secure cookies behind Traefik.
Add CORS_ENABLED: "true" and CORS_ORIGIN: https://your-domain (and any admin domain).
Add SESSION_COOKIE_SECURE: "true" and SESSION_COOKIE_SAME_SITE: lax.
Remove unnecessary volume
directapp/docker-compose.dokploy.yml:32 → drop ../files/database:/directus/database (used for SQLite; you’re on Postgres).
Traefik HTTP→HTTPS
Add an HTTP router with redirect middleware, or verify your Dokploy/Traefik stack enforces HTTPS for the domain.
Nice-to-Have

Redis persistence
directapp/docker-compose.dokploy.yml:156-159 → AOF is fine but not required; cache can be ephemeral in prod.
Backups
directapp/docker-compose.dokploy.yml:168-193 → keep; also schedule and test a restore job at least weekly.
Answers to your question

Yes, the GH Action runs fine on a self-hosted runner and is “production-safe” for CI because it’s ephemeral and isolated. Avoid host port mapping and use secrets.
No, you shouldn’t run your production stack on the runner. Use Dokploy with your compose file (after the changes above).
If you want, I can:

Patch the compose to remove the host port, pin versions, fix healthcheck, and strip defaults for secrets.
Add S3 storage envs (leaving bucket/keys blank) and CORS/proxy cookie settings.
I want a setup for building the plugins using cli /sdk - what setup do I need and what patterns should I get? Deep research and find patterns for me web search


I'm using the latest version with mcp suppport


Great — with latest Directus (v11+) and MCP support, here’s a clean, version‑aligned setup to build extensions via CLI/SDK plus proven patterns to follow.

Tooling

Node: 20 or 22 (match your prod; Directus 11 supports both)
Package manager: pnpm 9/10 or npm 10
Directus runtime: pin directus/directus:<11.x.y>
SDK: @directus/extensions-sdk@^16 (pairs with Directus 11)
Scaffolder: create-directus-extension@latest
Workspace Layout

Project-local extensions folder loaded by Directus:
directapp/extensions/ (mounted to /directus/extensions in prod)
Recommended structure for multiple extensions:
directapp/extensions/package.json (workspace root)
directapp/extensions/tsconfig.base.json
directapp/extensions/shared/ (common utils for all extensions)
directapp/extensions/endpoints/vehicle-lookup/
directapp/extensions/hooks/workflow-guard/
directapp/extensions/operations/send-email/
directapp/extensions/interfaces/vehicle-lookup-button/
Enable hot reload in dev: set EXTENSIONS_AUTO_RELOAD=true (already supported in your compose)
Scaffold Extensions (CLI)

Endpoint (Node):
npm create directus-extension@latest
Type: endpoint
Name: vehicle-lookup
Hook (Node):
npm create directus-extension@latest → hook → workflow-guard
Operation (Node, for Flows):
npm create directus-extension@latest → operation → send-email
Interface (App, Vue 3):
npm create directus-extension@latest → interface → vehicle-lookup-button
This scaffolder generates correct package.json fields and directus:extension metadata per type.

Build Scripts (Node extensions)

Use tsup for Node-only extensions:
package.json
"type": "module"
"main": "dist/index.js", "exports": "./dist/index.js"
"devDependencies": { "@directus/extensions-sdk": "^16.0.2", "typescript": "^5", "tsup": "^8" }
"scripts": { "dev": "tsup --watch src/index.ts --format esm --dts", "build": "tsup src/index.ts --format esm --dts" }
tsconfig:
Compiler options: module: "ESNext", target: "ES2022", moduleResolution: "Bundler", strict: true
Build Scripts (App extensions)

Use Vite + SDK helpers:
package.json
"dependencies": { "vue": "^3" }
"devDependencies": { "@directus/extensions-sdk": "^16", "vite": "^5", "typescript": "^5" }
"scripts": { "dev": "vite", "build": "vite build" }
vite.config.ts:
Use SDK Vite plugin (scaffold supplies this)
Output lands in dist/ and is loaded by Directus UI
Minimal Patterns To Start

Endpoint: extensions/endpoints/vehicle-lookup/src/index.ts
Export default (router, { services, exceptions, env, logger }) => { router.post('/', async (req, res) => { /* call registry, map fields */ }); }
Validate input (zod/valibot), raise InvalidPayloadException on bad VIN
Timeouts + retries; redact tokens in logs
Hook: extensions/hooks/workflow-guard/src/index.ts
Export default ({ filter }) => { filter('cars.items.update', async (input, meta, ctx) => { /* enforce gates */ return input; }); }
Enforce status transitions and required fields
Operation: extensions/operations/send-email/src/index.ts
Export default { id: 'send-email', handler: async (options, { env, logger }) => { /* Resend API */ } }
Use secrets via env; add retry/backoff and structured errors
Interface (Vue):
A button that calls your endpoint and writes to current item field(s)
Use SDK composables (provided in scaffold) and surface validation errors in UI
Dev Loop

Start Directus in dev with auto reload:
EXTENSIONS_AUTO_RELOAD=true
Run extension dev scripts (tsup watch / vite dev) alongside Directus
Access your endpoint at /extensions/vehicle-lookup and interface via field config
For local Docker dev, mount ./extensions and watch; avoid rebuilding the container for every change
MCP Support

Keep Directus extensions focused on business logic
MCP server lives outside /extensions (separate service/repo)
Use official Directus MCP server for tooling; configure with DIRECTUS_URL/DIRECTUS_TOKEN
Add custom MCP tools that call your endpoint/operations for NL interactions (smart schedule, data checks)
Pattern: move complex orchestration to MCP tools; keep Directus endpoints small and typed
CI/CD

CI:
npm ci && npm run build for each extension package
Lint/typecheck; run unit tests with Vitest for Node and Vite test for UI
Spin up Directus in GitHub Actions services; apply schema; install built extensions into a temp extensions/ and run smoke API/UI checks
CD:
Produce an artifact of extensions/ tree
Dokploy mounts ../files/extensions:/directus/extensions
On deploy: copy new dist, restart Directus, health check GET /server/health
Version pinning:
Pin @directus/extensions-sdk to the minor that matches your Directus 11 minor
Avoid latest in production builds
Security & Prod Notes

Never embed secrets in code; read via env
Validate all inputs (server-side) in endpoints/operations
Handle permission checks via services when mutating data
Log with structure; avoid leaking PII/secret values
Keep type: "module" consistent across Node extensions (ESM only)
If you want, I can scaffold an extensions/ workspace with one example of each (endpoint/hook/operation/interface), plus tsconfig and build scripts, and wire it into your Dokploy flow.

---

UPDATED LOG FROM CODEX:

Forget about the router we have patterns with openai in @SKILL.md - But we also need to update our github project with proper tasks to upgrade the workflow notification trigger logic, automatic status changes depending on where the car is in the process, adding more statuses for better visible tracking, adding better UX, better management, remove bloat etc... what do you think?


Love the direction. Here’s a crisp, production‑oriented backlog using your OpenAI patterns (see directapp/.claude/skills/directus-ai-assistant-integration/SKILL.md), focused on workflow, notifications, statuses, UX, management, and cleanup.

Status Taxonomy

Internal codes (localized labels shown in UI):
registered → booking → workshop_received → tech_completed → cosmetic_completed → quality_check → ready_for_delivery → delivered (terminal)
Branches: qc_failed, waiting_parts
Enforce transitions in hook; let Flows handle notifications. Add color + ordering in cars.status and hide raw booleans where redundant.
Backlog (GitHub Issues)

Epic: Workflow Model Overhaul

feat: Add enriched statuses to cars with color/order
DoD: statuses visible with translations; old values migrated; dashboards filter by new values
feat: Automatic status transitions in hook
When workshop_received_at set → workshop_received
Both tech/cosmetic completed → quality_check
quality_approved=true → ready_for_delivery
delivered_at set → delivered (lock edits)
DoD: covered by unit tests; manual flow tested end‑to‑end
refactor: Normalize date/actor fields (received_by, completed_by) and default assignment
Epic: Notification & Automation

feat: Flows for key events (use OpenAI op only where needed; emails via Resend)
Arrival, QC result, Ready for delivery, Overdue reminder (delivery_date tomorrow), Parts arrived
DoD: flows created, templates added, emails + in‑app notifications logged
feat: In‑app notifications collection + panel (bell with unread count)
DoD: role‑scoped list, mark‑as‑read, deep links to cars
Epic: UX & Dashboards

feat: Role‑based forms (conditions per role)
Nybil/Bruktbil/Booking/Klargjøring show only relevant fields
DoD: per‑role conditions configured; “Other dealership” fields hidden
feat: Dashboards per role (Insights)
Tiles: Ready this week, Pending QC, Overdue, My tasks
DoD: counts match queries; filters scoped to dealership
feat: “Ask Cars” module (OpenAI) for natural‑language queries
Module + endpoint; JSON‑schema to Directus filters; dealership scoping
DoD: returns list/summary/chart; limits + rate‑limit; no raw SQL; logs sanitized
Epic: RBAC Hardening & Data Isolation

fix: Remove unscoped delete on cars
directapp/schema-exported/roles.json:132 shows delete with permissions: null
DoD: either archive via status or scoped delete with dealership filter + terminal‑state guard
fix: Restrict directus_users updates (password/email self‑only)
directapp/schema-exported/roles.json:170, 432
DoD: only self can update benign fields; password/email via dedicated flow/reset; admins exempt
feat: Enforce TFA for admin policies
directapp/schema-exported/roles.json:88,101,114,127
DoD: enforce_tfa=true; guidance doc for TOTP
feat: Dealership scoping across all non‑admin policies
DoD: read/update/create filters + presets with $CURRENT_USER.dealership_id; linter passes 0 errors
Epic: Extensions & CI

chore: Align extensions SDK/host with Directus 11.12.x
Bump @directus/extensions-sdk to ^16; set "host": "^11.12.0" in each package
DoD: build passes; hot reload in dev; prod loads from mounted extensions/
build: Add GitHub Action to spin up Directus + run schema/permission lints
DoD: containerized job, no host ports, schema apply (when ready), permission linter green
Epic: Cleanup & Bloat Removal

chore: Remove demo role(s) and dealership‑specific role variants (migrate to policies)
refactor: Remove unused fields/groups from cars; document deprecations
ops: Remove host port exposure in prod/staging compose; pin images; fix healthchecks
ops: Switch prod uploads to S3 (staging already prepared)
docs: Update PRODUCTION_CHECKLIST and DOKPLOY guide with final envs
Acceptance Criteria Patterns

Every feature issue includes:
What/Why
Schema or Flow changes
Security (RBAC scoping, PII)
Tests (manual checklist + automated if applicable)
Rollback plan
Quick GH CLI Seed (examples)

gh issue create --title "fix: remove unscoped delete on cars" --body "Scope delete or replace with archive. Ref: directapp/schema-exported/roles.json:132" --label "security,backend"
gh issue create --title "feat: automatic status transitions in hook" --body "Implement transitions and invariants; add unit tests." --label "backend,workflow"
gh issue create --title "feat: flows for notifications (arrival, QC, delivery, overdue)" --label "flows,notifications"
gh issue create --title "feat: Ask Cars module (OpenAI)" --label "ai,ui,endpoint"
gh issue create --title "chore: align extensions sdk/host to Directus 11.12.x" --label "build,extensions"
gh issue create --title "ops: harden dokploy compose (pin, no host ports, S3, healthchecks)" --label "ops,security"
Notes

Keep invariants in hook (authoritative); use Flows only for side‑effects.
Prefer status as a single‑select with controlled values; add translations via collection translations.
Run directapp/schema/scripts/lint-permissions.sh prod in CI to block regressions.
If you want, I can generate the full set of gh issue create commands (with labels and acceptance criteria) and patch roles.json to remove the dangerous permissions in one pass.

View control and archivign rules logic must be in place too, id like to have presets for each dealership and have audi dealer have the audi colors, skoda theirs, nissan, gumpen etc etc > All cars that are delivered or the final completion should be automatically archived. The usedcar and newcars should be stored in a common vehicle bank and once a day a cron checks if there is new data on the car if there is missing a regnr or vin field or any other empty fields that can be populated with statens vegvesen data. For example.


Here’s a concrete plan to add view control, branding presets, auto‑archiving, and daily enrichment using what you already have.

View Control

RBAC scoping: Ensure all non‑admin policies filter cars by dealership_id = $CURRENT_USER.dealership_id and set presets.dealership_id = $CURRENT_USER.dealership_id (policies).
Role UI conditions: Hide/show fields per role using field conditions (keep forms focused for Nybil/Bruktbil/Booking/Klargjøring).
Visibility across dealerships: If you need a shared view, add a boolean in_vehicle_bank and let specific roles read in_vehicle_bank = true in addition to their own dealership filter.
Brand Presets

Dealership branding: Add fields to dealership (e.g., brand, primary_color, secondary_color, logo).
Create presets per dealership: In policies, set presets so new cars auto‑set dealership_id, and optionally a default brand or biltype.
Apply branding in UI: In a small module or global style helper, read current user’s dealership_id → dealership and set CSS vars (colors/logo) so Audi/Skoda/Nissan/Gumpen get their own look.
Auto‑Archiving

Recommended field model: Keep status strictly for workflow; don’t mix archive with workflow. Use Directus’ archive mechanism only if archive_field is separate.
If you must keep archive_field = status: Add a terminal state “delivered” and then set status = 'archived' automatically.
Hook snippet (add to directapp/extensions/hooks/workflow-guard/src/index.ts or a new hook):
On cars.items.update (action) when delivered_at is set or status enters final completion state:
Update the item with { status: 'archived' } using ItemsService and emitEvents: false to avoid loops.
Block edits on archived: In the same hook, throw ForbiddenException if status === 'archived'.
Common Vehicle Bank

Use a single cars collection with biltype = Nybil/Bruktbil and a boolean in_vehicle_bank.
Add optional sharing fields:
visibility: 'private' | 'brand' | 'global'
For 'brand': allow read where car.visibility = 'brand' AND car.dealership.brand = $CURRENT_USER.dealership.brand.
Dashboards: Add “Vehicle Bank” dashboards filtered by in_vehicle_bank = true.
Daily Enrichment (Cron)

Use Directus Flows “Schedule” trigger (daily ~03:00).
Query: Cars where any of [vin, kjennemerke, make, model, year] is null/empty.
For each item (cap batch size to avoid rate limits):
Call your endpoint extensions/endpoints/vehicle-lookup by VIN or regnr.
Update only missing fields (preserve user‑entered data).
Log successes/failures in a small enrichment_logs collection.
Rate limiting/retries: Backoff on 429/5xx; stop after N failures.
Optional: Create an operation ai-enrich-vehicle that wraps this logic to keep Flows simple.
UX Enhancements

Per‑role dashboards: “Ready this week”, “Pending QC”, “Overdue”, “My queue”.
“Ask Cars” module: Natural‑language queries → structured filters → dealership‑scoped results (you already have OpenAI patterns in directapp/.claude/skills/directus-ai-assistant-integration/SKILL.md).
Archive view: Add an “Archived” list (read‑only) with restore action for admins.
Security/Integrity Notes

Enforce dealership scoping in policies and in hooks where critical (defense in depth).
Validate transitions in the workflow guard (you already do) and add the terminal “delivered” rule + archive.
Keep enrichment idempotent; never overwrite non‑empty user fields.
Log all auto‑archive and enrichment actions with user/time/item.
Suggested Issues To Add

feat: Presets per dealership (RBAC presets + UI conditions)
feat: Dealership branding (colors/logo) with CSS vars in a module
feat: Auto‑archive delivered cars; block edits on archived
feat: Add in_vehicle_bank + visibility model and dashboards
feat: Daily enrichment Flow using vehicle‑lookup endpoint
fix: Separate archive vs workflow (or implement safe “archived” terminal logic)
chore: Add enrichment_logs collection and Flow configs
docs: Guide for branding, archiving, and enrichment ops
If you want, I can:

Add the auto‑archive logic to your existing workflow hook.
Scaffold the scheduled enrichment Flow as a small operation + Flow recipe.
Add dealership branding fields and a minimal module to apply CSS variables.