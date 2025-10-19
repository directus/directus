# DirectApp Production Roadmap - Complete System

**Project:** Car Dealership Management System for Norwegian Market
**Target:** Production-ready, multi-dealership, role-optimized workflow system
**Timeline:** 8-12 weeks
**Last Updated:** 2025-10-18

---

## Executive Summary

Transform the current "testy and dangerous" Directus instance into a **production-grade car dealership management platform** with:

- ✅ Secure, role-based workflow (each role edits only their part)
- ✅ Norwegian vehicle registry integration (auto-populate from VIN/regnr)
- ✅ Smart notifications (email + in-app via Resend)
- ✅ Multi-dealership support (prep centers + self-sustained)
- ✅ Scheduling system (technical/cosmetic booking with resources)
- ✅ MCP integration (AI assistant access)
- ✅ Production deployment (Docker, monitoring, backups)

**Philosophy:** Simplest solution that works, security first, iterate fast.

---

## Phase 0: Critical Foundation (Week 1-2)

**Goal:** Make current system production-safe
**Status:** 🔴 BLOCKER - Must complete before building new features

### Sprint 0.1: Database Integrity (Week 1)

**Critical fixes from schema analysis:**

1. **Add unique constraints** (4 hours)
   ```sql
   ALTER TABLE cars ADD CONSTRAINT cars_vin_unique UNIQUE (vin);
   ALTER TABLE cars ADD CONSTRAINT cars_order_number_unique UNIQUE (order_number);
   ALTER TABLE dealership ADD CONSTRAINT dealership_code_unique UNIQUE (dealership_code);
   ```

2. **Fix foreign key cascades** (3 hours)
   ```sql
   -- Allow user deletion without blocking
   ALTER TABLE cars DROP CONSTRAINT cars_user_created_foreign;
   ALTER TABLE cars ADD CONSTRAINT cars_user_created_foreign
     FOREIGN KEY (user_created) REFERENCES directus_users(id) ON DELETE SET NULL;

   -- Fix junction table orphans
   ALTER TABLE cars_files DROP CONSTRAINT cars_files_cars_id_foreign;
   ALTER TABLE cars_files ADD CONSTRAINT cars_files_cars_id_foreign
     FOREIGN KEY (cars_id) REFERENCES cars(id) ON DELETE CASCADE;
   ```

3. **Add VIN validation** (4 hours)
   - Regex: `^[A-HJ-NPR-Z0-9]{17}$`
   - ISO 3779 standard
   - Directus field validation + custom hook

4. **Add license plate validation** (3 hours)
   - Norwegian format: `AA 12345` or `AA 12345 EL`
   - Regex validation
   - Auto-uppercase, trim

**Deliverable:** Database integrity guaranteed, no duplicate/invalid data possible

### Sprint 0.2: Security Lockdown (Week 2)

**Critical security fixes:**

1. **Remove dangerous DELETE permission** (2 hours)
   - Remove from Booking role
   - Implement soft delete (archive) instead
   - Add `status="archived"` option

2. **Implement dealership data isolation** (8 hours)
   ```sql
   -- Add dealership_id to users
   ALTER TABLE directus_users ADD COLUMN dealership_id UUID
     REFERENCES dealership(id) ON DELETE SET NULL;
   ```

   Update ALL permissions:
   ```json
   {
     "permissions": {
       "dealership_id": { "_eq": "$CURRENT_USER.dealership_id" }
     },
     "presets": {
       "dealership_id": "$CURRENT_USER.dealership_id"
     }
   }
   ```

3. **Remove password/email update from non-admins** (2 hours)
   - Restrict to self-only
   - Remove password/email fields from update permissions
   - Document password reset flow

4. **Add audit logging** (6 hours)
   - Enable Directus Revisions
   - Log all status changes
   - Log all deletions/archives
   - Track who made changes

**Deliverable:** Multi-tenant security, audit trail, no privilege escalation

**Phase 0 Total:** ~32 hours (1.5-2 weeks with testing)

---

## Phase 1: Smart Vehicle Data (Week 3-4)

**Goal:** Auto-populate vehicle data from Norwegian registry
**Priority:** HIGH - Eliminates manual data entry errors

### Feature 1.1: Statens Vegvesen API Integration

**Research findings:**
- **API:** Statens Vegvesen Kjøretøyregister
- **Endpoint:** `https://autosys-kjoretoy-api.atlas.vegvesen.no`
- **Auth:** Maskinporten (OAuth2)
- **Free tier:** 5,000 lookups/day
- **Data returned:** Make, model, year, color, technical specs, registration status

**Implementation:**

1. **Create Directus extension** (12 hours)
   ```javascript
   // extensions/endpoints/vehicle-lookup/index.js
   export default (router, { services, exceptions }) => {
     router.post('/vehicle-lookup', async (req, res) => {
       const { vin, regnr } = req.body;

       // Call Statens Vegvesen API
       const vehicleData = await fetchVehicleData(vin || regnr);

       // Return formatted data for auto-population
       return res.json({
         make: vehicleData.merke,
         model: vehicleData.modell,
         year: vehicleData.arsmodell,
         color: vehicleData.farge,
         technical_specs: vehicleData.tekniske_data
       });
     });
   };
   ```

2. **Custom Directus interface** (8 hours)
   - "Lookup Vehicle" button in car create/edit form
   - Input: VIN or registration number
   - Click → Call API → Auto-fill fields
   - Show preview before applying
   - Handle errors gracefully

3. **Maskinporten authentication setup** (6 hours)
   - Register organization with Maskinporten
   - Get test credentials (free)
   - Implement OAuth2 flow
   - Token caching/refresh
   - Error handling

4. **Add vehicle data fields** (4 hours)
   ```javascript
   // New fields in cars collection
   {
     year: 'integer',
     color: 'string',
     fuel_type: 'dropdown', // Bensin, Diesel, El, Hybrid
     engine_size: 'string',
     horsepower: 'integer',
     co2_emissions: 'integer',
     registration_date: 'date',
     last_inspection: 'date'
   }
   ```

**Testing:**
- [ ] Test with valid VIN (should populate all fields)
- [ ] Test with invalid VIN (show error message)
- [ ] Test with registration number
- [ ] Test API rate limiting
- [ ] Test offline/error scenarios
- [ ] Verify data accuracy against manual lookup

**Deliverable:** One-click vehicle data lookup, zero manual entry

**Estimated:** 30 hours

---

## Phase 2: Role-Optimized Workflow (Week 4-5)

**Goal:** Each role sees only their part, edits only their fields
**Priority:** HIGH - Core UX improvement

### Feature 2.1: Role-Based Form Layouts

**Current problem:** Everyone sees all 40+ fields, most irrelevant to their role

**Solution:** Custom layouts per role using Directus field conditions

**Role breakdown:**

#### 1. Nybilselger (New Car Sales) - Create & Initial Data
**Can see/edit:**
- Customer: `customer_name`, `customer_phone`, `delivery_date`
- Vehicle ID: `vin`, `order_number`, `make`, `model`
- Sales: `selgernummer`, `eta`
- Services: `dekhotell`, `folie`, `behanding`
- Dealership: `dealership_id` (auto-set)
- Type: `biltype` = "Nybil"

**Cannot see:** Workshop fields, technical prep, parts inventory

**Implementation:**
```json
{
  "field": "mottakskontroll",
  "meta": {
    "hidden": true,
    "conditions": [
      {
        "rule": {
          "_and": [
            {
              "user_role": {
                "_in": ["Mottakskontroll", "Administrator"]
              }
            }
          ]
        },
        "hidden": false
      }
    ]
  }
}
```

#### 2. Mottakskontroll (Reception Check) - Quality Gate
**Can see/edit:**
- Vehicle data (read-only)
- `mottakskontroll`: Godkjent / Ikke godkjent
- `comment` (inspection notes)
- Photos (add to cars_files)

**Cannot edit:** Customer data, sales data, workshop schedule

#### 3. Booking (Workshop Planner) - Scheduling
**Can see/edit:**
- All cars with status="Planlagt"
- `mekaniker` (assign mechanic)
- Schedule fields (new - see Feature 2.3)
- `teknisk_klargjoring` (planned date)
- `kosmetisk_klargjoring` (planned date)

**Cannot edit:** Customer data, sales data, mottakskontroll

#### 4. Klargjoring (Workshop Mechanic) - Execution
**Can see/edit:**
- Cars assigned to them (`mekaniker = $CURRENT_USER`)
- `teknisk_klargjoring` (mark complete)
- `kosmetisk_klargjoring` (mark complete)
- `deler_bestilt`, `deler_ankommet`
- `comment` (work notes)

**Cannot edit:** Customer data, sales data, scheduling

### Feature 2.2: Custom Dashboards Per Role

**Implementation using Directus Insights:**

#### Dashboard: Nybilselger
- **My Active Sales** - Cars I created, not yet delivered
- **Delivery This Week** - `delivery_date` in next 7 days
- **Waiting for Approval** - `mottakskontroll` IS NULL
- **Ready for Pickup** - `klar_for_henting` = true

#### Dashboard: Mottakskontroll
- **Pending Inspection** - `ankommet_forhandler` IS NOT NULL, `mottakskontroll` IS NULL
- **Failed Inspections** - `mottakskontroll` = "Ikke godkjent"
- **Inspections This Week** - Count by date

#### Dashboard: Booking
- **Awaiting Schedule** - `status` = "Klar for planlegging"
- **This Week's Work** - `teknisk_klargjoring` or `kosmetisk_klargjoring` in next 7 days
- **Resource Utilization** - Mechanics workload chart
- **Overdue** - Planned dates in past, not completed

#### Dashboard: Klargjoring (Mechanic)
- **My Tasks Today** - `mekaniker` = me, dates = today
- **My Queue** - All cars assigned to me
- **Completed This Week** - My completed work
- **Parts Needed** - `deler_bestilt` IS NULL but work scheduled

### Feature 2.3: Status-Based Field Availability

**Workflow gates:**

```javascript
// Custom hook: Enforce workflow progression
export default ({ filter }) => {
  filter('cars.items.update', async (input, meta, context) => {
    const current = await getCar(meta.keys[0]);

    // Cannot mark ready for pickup without tech prep
    if (input.klar_for_henting === true && !current.teknisk_klargjoring) {
      throw new Error('Teknisk klargjøring må være fullført først');
    }

    // Cannot complete tech prep without parts arrival
    if (input.teknisk_klargjoring && current.deler_bestilt && !current.deler_ankommet) {
      throw new Error('Deler må være ankommet før teknisk klargjøring');
    }

    // Cannot set status=Ferdig without mottakskontroll
    if (input.status === 'Ferdig' && current.mottakskontroll !== 'Godkjent') {
      throw new Error('Mottakskontroll må være godkjent');
    }

    return input;
  });
};
```

**Deliverable:** Clean, focused UI per role, guided workflow, no confusion

**Estimated:** 24 hours

---

## Phase 3: Notification System (Week 5-6)

**Goal:** Automated email + in-app notifications using Resend API
**Priority:** MEDIUM - Improves communication

### Feature 3.1: Resend API Integration

**Setup:**

1. **Resend account setup** (1 hour)
   - Sign up at resend.com
   - Verify domain for sender email
   - Get API key
   - Configure environment variable

2. **Directus extension for email** (8 hours)
   ```javascript
   // extensions/operations/send-email/index.js
   import { Resend } from 'resend';

   export default {
     id: 'send-email',
     handler: async ({ data }, { env }) => {
       const resend = new Resend(env.RESEND_API_KEY);

       await resend.emails.send({
         from: 'DirectApp <noreply@yourdomain.no>',
         to: data.recipient,
         subject: data.subject,
         html: data.html_body
       });
     }
   };
   ```

3. **Email templates** (6 hours)
   - Car arrived at dealer
   - Inspection failed (needs correction)
   - Ready for pickup notification
   - Delivery reminder (1 day before)
   - Parts arrived notification
   - Work completed notification

### Feature 3.2: Directus Flows (Automation)

**Flow 1: Car Arrival Notification**
```yaml
Trigger: cars.items.update
Condition: ankommet_forhandler changed from NULL to date
Operations:
  1. Read car data
  2. Get salesperson email
  3. Send email: "Bil {{vin}} har ankommet forhandler"
  4. Create in-app notification
```

**Flow 2: Inspection Result**
```yaml
Trigger: cars.items.update
Condition: mottakskontroll changed
Operations:
  1. Read car data
  2. Get salesperson and mechanic emails
  3. If Godkjent:
       Send email: "Bil klar for planlegging"
     Else:
       Send email: "Mottakskontroll ikke godkjent - se kommentarer"
  4. Update status to "Klar for planlegging" or "Ubehandlet"
```

**Flow 3: Ready for Pickup**
```yaml
Trigger: cars.items.update
Condition: klar_for_henting = true
Operations:
  1. Read car and customer data
  2. Send email to customer:
       "Din {{make}} {{model}} er klar for henting!"
  3. Send SMS (optional, via Twilio)
  4. Notify salesperson
```

**Flow 4: Delivery Reminder**
```yaml
Trigger: Scheduled (daily at 09:00)
Condition: delivery_date = tomorrow
Operations:
  1. Query cars with delivery tomorrow
  2. For each car:
       - Send email to customer
       - Send email to salesperson
       - Create in-app notification
```

### Feature 3.3: In-App Notifications

**Implementation:**

1. **Create notifications collection** (3 hours)
   ```javascript
   {
     collection: 'notifications',
     fields: [
       { field: 'id', type: 'uuid' },
       { field: 'user', type: 'uuid' }, // M2O to directus_users
       { field: 'title', type: 'string' },
       { field: 'message', type: 'text' },
       { field: 'type', type: 'string' }, // info, success, warning, error
       { field: 'link', type: 'string' }, // URL to related car
       { field: 'read', type: 'boolean', default: false },
       { field: 'date_created', type: 'timestamp' }
     ]
   }
   ```

2. **Notification panel in UI** (6 hours)
   - Bell icon in header
   - Unread count badge
   - Click → dropdown with recent notifications
   - Mark as read
   - Click notification → go to car

3. **Add to flows** (2 hours)
   - Every email sent → also create notification
   - Notification recipients based on role

**Deliverable:** Real-time communication, no missed updates

**Estimated:** 26 hours

---

## Phase 4: Multi-Dealership Architecture (Week 6-7)

**Goal:** Support multiple dealerships with cross-relations
**Priority:** HIGH - Core business requirement

### Feature 4.1: Dealership Types & Relationships

**Dealership types:**

1. **Self-sustained** - Does own prep work
2. **Prep center** - Prepares cars for multiple dealers
3. **Sales-only** - Sends cars to prep center

**New fields for dealership collection:**

```javascript
{
  dealership_type: 'dropdown', // Values: self_sustained, prep_center, sales_only
  prep_center_id: 'uuid', // M2O to dealership (their prep center)
  serves_dealerships: 'M2M', // Junction: dealership_prep_relations
}
```

### Feature 4.2: Cross-Dealership Workflows

**Scenario 1: Sales dealer sends to prep center**

```yaml
1. Sales dealer creates car (dealership_A)
2. Car arrives at dealership_A
3. Mottakskontroll at dealership_A
4. If prep_center_id set:
     - Transfer car to prep center (change dealership_id)
     - Notify prep center
     - Track original_dealership_id
5. Prep center does work
6. Car marked complete
7. Return to original dealership
8. Notify sales dealer
```

**Implementation:**

1. **Add transfer functionality** (8 hours)
   ```javascript
   // New fields
   {
     original_dealership_id: 'uuid', // Where car came from
     current_location: 'dropdown', // At sales dealer, At prep center, In transit
     transfer_history: 'O2M' // Junction: car_transfers
   }

   // Collection: car_transfers
   {
     car_id: 'uuid',
     from_dealership: 'uuid',
     to_dealership: 'uuid',
     transferred_date: 'timestamp',
     transferred_by: 'uuid',
     reason: 'string',
     status: 'dropdown' // pending, in_transit, received
   }
   ```

2. **Transfer flow** (6 hours)
   ```yaml
   Trigger: Manual button "Transfer to prep center"
   Operations:
     1. Create transfer record
     2. Update car.dealership_id
     3. Update car.current_location = "In transit"
     4. Send notifications to both dealers
     5. Create task in prep center dashboard
   ```

3. **Permissions update** (4 hours)
   ```json
   {
     "permissions": {
       "_or": [
         {
           "dealership_id": { "_eq": "$CURRENT_USER.dealership_id" }
         },
         {
           "original_dealership_id": { "_eq": "$CURRENT_USER.dealership_id" }
         }
       ]
     }
   }
   ```

### Feature 4.3: Prep Center Dashboard

**Special views for prep centers:**

- **Incoming Transfers** - Cars being sent to us
- **Work Queue** - Cars at our location, not completed
- **Ready to Return** - Completed, notify original dealer
- **Capacity Planning** - How many cars from each dealer

**Deliverable:** Flexible multi-dealership support, prep center model

**Estimated:** 18 hours

---

## Phase 5: Scheduling & Resource Management (Week 7-9)

**Goal:** Book technical/cosmetic prep with time/resource management
**Priority:** HIGH - Core operational feature

### Feature 5.1: Resource Management

**New collections:**

1. **Resources** (mechanics, tools, bays)
   ```javascript
   {
     collection: 'resources',
     fields: [
       { field: 'id', type: 'uuid' },
       { field: 'name', type: 'string' },
       { field: 'type', type: 'dropdown' }, // mechanic, bay, equipment
       { field: 'dealership_id', type: 'uuid' },
       { field: 'capacity', type: 'integer' }, // How many tasks simultaneously
       { field: 'specialization', type: 'array' }, // technical, cosmetic, both
       { field: 'available', type: 'boolean' },
       { field: 'calendar_id', type: 'string' } // Google Calendar integration
     ]
   }
   ```

2. **Bookings/Appointments**
   ```javascript
   {
     collection: 'bookings',
     fields: [
       { field: 'id', type: 'uuid' },
       { field: 'car_id', type: 'uuid' }, // M2O to cars
       { field: 'type', type: 'dropdown' }, // technical, cosmetic
       { field: 'resource_id', type: 'uuid' }, // M2O to resources
       { field: 'scheduled_start', type: 'timestamp' },
       { field: 'scheduled_end', type: 'timestamp' },
       { field: 'actual_start', type: 'timestamp' },
       { field: 'actual_end', type: 'timestamp' },
       { field: 'status', type: 'dropdown' }, // scheduled, in_progress, completed, cancelled
       { field: 'estimated_hours', type: 'decimal' },
       { field: 'actual_hours', type: 'decimal' },
       { field: 'notes', type: 'text' }
     ]
   }
   ```

### Feature 5.2: Booking Interface

**Calendar view using Directus Insights or custom interface:**

1. **Week view calendar** (12 hours)
   - Show all resources as rows
   - Time slots as columns
   - Drag-and-drop booking
   - Color-coded by status
   - Conflict detection

2. **Booking wizard** (8 hours)
   ```yaml
   Step 1: Select car (from "Klar for planlegging")
   Step 2: Select service type (technical/cosmetic/both)
   Step 3: Estimate hours (from historical data)
   Step 4: Find available slot
         - Show resource availability
         - Suggest optimal time
         - Show conflicts
   Step 5: Confirm booking
         - Create booking record
         - Link to car
         - Send notifications
         - Update car status to "Planlagt"
   ```

3. **Availability algorithm** (6 hours)
   ```javascript
   function findAvailableSlots(serviceType, estimatedHours, dealershipId) {
     // Get resources by type and dealership
     const resources = getResources({ type: serviceType, dealership: dealershipId });

     // For each resource, check existing bookings
     // Find gaps >= estimatedHours
     // Return array of { resource, start_time, end_time }

     // Sort by:
     // 1. Earliest available
     // 2. Resource with least utilization
     // 3. Resource specialization match
   }
   ```

### Feature 5.3: Resource Utilization Reports

**Dashboard for Booking role:**

- **Today's Schedule** - All bookings today
- **This Week** - Calendar view
- **Resource Utilization** - Chart: % booked vs. available
- **Bottlenecks** - Resources with >90% utilization
- **Average Time** - Actual vs. estimated (improve estimates)
- **Delay Tracking** - Bookings running over time

**Deliverable:** Full scheduling system, resource optimization

**Estimated:** 40 hours

---

## Phase 6: MCP Integration (Week 9-10)

**Goal:** AI assistant access to Directus for smart features
**Priority:** MEDIUM - Future-proofing, smart features

### Feature 6.1: Official Directus MCP Server

**Setup:**

1. **Install official MCP server** (2 hours)
   ```bash
   # Clone official Directus MCP
   git clone https://github.com/directus/mcp.git

   # Configure
   cp .env.example .env
   # Set DIRECTUS_URL and DIRECTUS_TOKEN

   # Run
   npm install
   npm run build
   npm start
   ```

2. **Configure in Claude Desktop** (1 hour)
   ```json
   // ~/Library/Application Support/Claude/claude_desktop_config.json
   {
     "mcpServers": {
       "directapp": {
         "command": "node",
         "args": ["/path/to/directapp-mcp/dist/index.js"],
         "env": {
           "DIRECTUS_URL": "https://your-directus.com",
           "DIRECTUS_TOKEN": "your-admin-token"
         }
       }
     }
   }
   ```

### Feature 6.2: Smart Features via MCP

**Use cases:**

1. **Natural language queries**
   - "Show me all cars ready for pickup this week"
   - "Which mechanic has the lightest workload tomorrow?"
   - "Find cars stuck in mottakskontroll for > 3 days"

2. **Automated data entry**
   - "Create new car from VIN WBA1234567890ABCD"
   - AI calls vehicle lookup API
   - Auto-fills all fields
   - Asks for missing customer info

3. **Smart scheduling**
   - "Schedule this car for technical prep"
   - AI finds best available slot
   - Considers mechanic specialization
   - Proposes time, user approves

4. **Report generation**
   - "Generate weekly summary report"
   - AI queries data, formats report
   - Sends via email

5. **Data quality checks**
   - "Find cars with missing customer phone numbers"
   - "Check for invalid VINs"
   - "Show duplicate order numbers"

### Feature 6.3: Custom MCP Tools

**Extend official server with custom tools:**

```typescript
// mcp-server/src/tools/smart-schedule.ts
{
  name: "smart_schedule",
  description: "Find optimal scheduling slot for car prep",
  inputSchema: {
    type: "object",
    properties: {
      car_id: { type: "string" },
      service_type: { type: "string" },
      estimated_hours: { type: "number" }
    }
  },
  handler: async ({ car_id, service_type, estimated_hours }) => {
    // Call booking availability algorithm
    // Return best slots
  }
}
```

**Deliverable:** AI-powered workflow assistance, natural language interface

**Estimated:** 16 hours

---

## Phase 7: Production Deployment (Week 10-11)

**Goal:** Reliable, monitored, backed-up production system
**Priority:** CRITICAL - Must be production-grade

### Feature 7.1: Docker Deployment from This Repo

**Setup:**

1. **Update docker-compose.yml** (4 hours)
   ```yaml
   version: '3.8'

   services:
     directus:
       image: directus/directus:latest
       ports:
         - "8055:8055"
       environment:
         KEY: 'replace-with-random-value'
         SECRET: 'replace-with-random-value'

         DB_CLIENT: 'pg'
         DB_HOST: 'postgres'
         DB_PORT: '5432'
         DB_DATABASE: 'directapp'
         DB_USER: 'directus'
         DB_PASSWORD: 'strong-password'

         ADMIN_EMAIL: 'admin@yourdomain.no'
         ADMIN_PASSWORD: 'initial-password'

         # Extensions
         EXTENSIONS_PATH: './extensions'

         # APIs
         RESEND_API_KEY: 'your-resend-key'
         STATENS_VEGVESEN_TOKEN: 'your-maskinporten-token'

         # Email
         EMAIL_FROM: 'noreply@yourdomain.no'
         EMAIL_TRANSPORT: 'smtp'
         EMAIL_SMTP_HOST: 'smtp.resend.com'
         EMAIL_SMTP_PORT: '587'
         EMAIL_SMTP_USER: 'resend'
         EMAIL_SMTP_PASSWORD: 'your-resend-key'

         # Cache
         CACHE_ENABLED: 'true'
         CACHE_STORE: 'redis'
         REDIS: 'redis://redis:6379'

         # Monitoring
         TELEMETRY: 'false'
       volumes:
         - ./uploads:/directus/uploads
         - ./extensions:/directus/extensions
         - ./database:/directus/database
       depends_on:
         - postgres
         - redis
       restart: unless-stopped

     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: 'directapp'
         POSTGRES_USER: 'directus'
         POSTGRES_PASSWORD: 'strong-password'
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

     redis:
       image: redis:7-alpine
       restart: unless-stopped

     # Backup service
     backup:
       image: prodrigestivill/postgres-backup-local
       environment:
         POSTGRES_HOST: 'postgres'
         POSTGRES_DB: 'directapp'
         POSTGRES_USER: 'directus'
         POSTGRES_PASSWORD: 'strong-password'
         SCHEDULE: '@daily'
         BACKUP_KEEP_DAYS: 30
       volumes:
         - ./backups:/backups
       depends_on:
         - postgres
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

2. **Environment variable management** (2 hours)
   ```bash
   # .env.production (not committed)
   KEY=random-32-char-string
   SECRET=random-64-char-string
   DB_PASSWORD=strong-random-password
   ADMIN_PASSWORD=initial-admin-password
   RESEND_API_KEY=re_xxxxx
   STATENS_VEGVESEN_TOKEN=ey...
   ```

3. **Deployment script** (3 hours)
   ```bash
   # scripts/deploy.sh
   #!/bin/bash

   echo "🚀 Deploying DirectApp to production..."

   # Pull latest code
   git pull origin main

   # Build extensions
   cd extensions
   npm install
   npm run build
   cd ..

   # Database migrations
   docker-compose exec directus npx directus database migrate:latest

   # Restart services
   docker-compose down
   docker-compose up -d

   # Health check
   sleep 10
   curl -f http://localhost:8055/server/health || exit 1

   echo "✅ Deployment complete!"
   ```

### Feature 7.2: Monitoring & Error Tracking

**Integrate Sentry (you already have MCP access!):**

1. **Add Sentry SDK** (3 hours)
   ```javascript
   // extensions/hooks/sentry/index.js
   import * as Sentry from "@sentry/node";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });

   export default ({ init }) => {
     init('error', ({ error }) => {
       Sentry.captureException(error);
     });
   };
   ```

2. **Dashboard alerts** (2 hours)
   - Email alerts for critical errors
   - Slack integration
   - Performance monitoring

3. **Health check endpoint** (2 hours)
   ```javascript
   // extensions/endpoints/health/index.js
   export default (router) => {
     router.get('/health', async (req, res) => {
       // Check database
       // Check Redis
       // Check external APIs (Statens Vegvesen, Resend)
       // Return status

       res.json({
         status: 'healthy',
         timestamp: new Date(),
         services: {
           database: 'ok',
           redis: 'ok',
           vehicle_api: 'ok',
           email: 'ok'
         }
       });
     });
   };
   ```

### Feature 7.3: Backup & Recovery

**Automated backups:**

1. **Database backups** (included in docker-compose)
   - Daily at midnight
   - Keep 30 days
   - Stored in `./backups`

2. **File storage backups** (2 hours)
   ```bash
   # scripts/backup-files.sh
   #!/bin/bash

   DATE=$(date +%Y-%m-%d)
   tar -czf backups/uploads-$DATE.tar.gz uploads/

   # Upload to cloud storage (optional)
   # aws s3 cp backups/uploads-$DATE.tar.gz s3://bucket/
   ```

3. **Restore procedure documentation** (3 hours)
   ```markdown
   # Disaster Recovery Plan

   ## Database Restore
   1. Stop Directus: `docker-compose down`
   2. Restore backup: `docker exec postgres psql -U directus -d directapp < backups/latest.sql`
   3. Start Directus: `docker-compose up -d`

   ## Files Restore
   1. Extract backup: `tar -xzf backups/uploads-YYYY-MM-DD.tar.gz`
   2. Copy to volume: `cp -r uploads/* /var/lib/docker/volumes/directapp_uploads/`

   ## Test Restore
   - Monthly restore test to staging environment
   - Document in runbook
   ```

### Feature 7.4: Security Hardening

**Production security checklist:**

1. **Disable non-essential features** (2 hours)
   ```env
   # Disable unused profile fields
   USERS_FIELDS_BLACKLIST=location,title,description,tags

   # Disable GraphQL if not used
   GRAPHQL_ENABLED=false

   # Rate limiting
   RATE_LIMITER_ENABLED=true
   RATE_LIMITER_POINTS=100
   RATE_LIMITER_DURATION=60
   ```

2. **HTTPS/SSL setup** (3 hours)
   - Let's Encrypt certificates
   - Nginx reverse proxy
   - Auto-renewal

3. **2FA enforcement** (2 hours)
   - Require for Admin and Sales roles
   - Document setup process

4. **IP whitelisting** (optional, 2 hours)
   - Restrict admin panel to office IPs
   - Allow API access from anywhere

**Deliverable:** Production-ready deployment, automated backups, monitoring

**Estimated:** 30 hours

---

## Phase 8: Documentation & Training (Week 11-12)

**Goal:** Complete documentation and user training
**Priority:** HIGH - Ensures adoption

### Deliverables

1. **User Manual** (Norwegian)
   - Per-role guides
   - Screenshots
   - Common workflows
   - Troubleshooting

2. **Admin Manual**
   - System configuration
   - User management
   - Backup/restore procedures
   - Incident response

3. **Developer Documentation**
   - API documentation
   - Extension development
   - Deployment guide
   - Contributing guidelines

4. **Video Tutorials**
   - 5-minute quick start per role
   - Advanced features
   - Admin tasks

5. **Training Sessions**
   - Live demo for each dealership
   - Q&A sessions
   - Feedback collection

**Estimated:** 24 hours

---

## Timeline & Milestones

### Overview (12 weeks total)

```
Week 1-2:   Phase 0 - Critical Foundation
Week 3-4:   Phase 1 - Vehicle Data Integration
Week 4-5:   Phase 2 - Role-Optimized Workflow
Week 5-6:   Phase 3 - Notification System
Week 6-7:   Phase 4 - Multi-Dealership
Week 7-9:   Phase 5 - Scheduling & Resources
Week 9-10:  Phase 6 - MCP Integration
Week 10-11: Phase 7 - Production Deployment
Week 11-12: Phase 8 - Documentation & Training
```

### Milestones

- **M1 (Week 2):** System is secure, data integrity guaranteed
- **M2 (Week 4):** Vehicle lookup works, auto-population
- **M3 (Week 5):** Role-based workflows deployed
- **M4 (Week 6):** Notifications sending automatically
- **M5 (Week 7):** Multi-dealership support live
- **M6 (Week 9):** Scheduling system operational
- **M7 (Week 10):** MCP integration working
- **M8 (Week 11):** Production deployment complete
- **M9 (Week 12):** Documentation complete, training done

---

## Effort Estimation

| Phase | Hours | Weeks |
|-------|-------|-------|
| Phase 0: Critical Foundation | 32 | 2 |
| Phase 1: Vehicle Data | 30 | 1.5 |
| Phase 2: Role Workflow | 24 | 1 |
| Phase 3: Notifications | 26 | 1 |
| Phase 4: Multi-Dealership | 18 | 1 |
| Phase 5: Scheduling | 40 | 2 |
| Phase 6: MCP Integration | 16 | 1 |
| Phase 7: Production Deploy | 30 | 1 |
| Phase 8: Documentation | 24 | 1 |
| **TOTAL** | **240 hours** | **~12 weeks** |

**Assumptions:**
- 20 hours/week development time
- Some parallelization possible
- Testing included in estimates
- 1 developer

**Faster timeline possible with:**
- 2 developers → 6-8 weeks
- Skip some nice-to-have features → 8-10 weeks
- Focus on MVP first → 6 weeks

---

## Recommended MVP (6 weeks)

If you need faster delivery, start with:

**Week 1-2:** Phase 0 (Critical - must do)
**Week 3:** Phase 1 (Vehicle lookup - high value)
**Week 4:** Phase 2 (Role workflow - core UX)
**Week 5:** Phase 4 (Multi-dealership - core business)
**Week 6:** Phase 7 (Production deployment)

**Defer to v2:**
- Notifications (can do manual for now)
- Scheduling (can use spreadsheet temporarily)
- MCP integration (nice-to-have)

---

## Risk Assessment

### High Risk
- **Maskinporten OAuth** - May be complex, budget 2x time
- **Multi-dealership testing** - Need real dealership data
- **Data migration** - Existing production data needs careful handling

### Medium Risk
- **Resend deliverability** - Test thoroughly, may need SPF/DKIM setup
- **Scheduling conflicts** - Algorithm complexity
- **Performance** - May need optimization with large datasets

### Low Risk
- **Role permissions** - Well-defined Directus feature
- **Docker deployment** - Standard process
- **MCP integration** - Official support exists

---

## Next Steps

### Immediate (This Week)

1. **Review this roadmap** - Any questions or changes?
2. **Prioritize features** - MVP or full roadmap?
3. **Set up test environment** - Duplicate current Directus to test
4. **Get API access**:
   - Register for Maskinporten test environment
   - Sign up for Resend
   - Set up Sentry

### Week 1

1. **Start Phase 0** - Fix critical security issues
2. **Create GitHub Project** - Add all issues from roadmap
3. **Set up development workflow** - Use `/work`, `/status`, `/done`
4. **Test data migration** - Plan how to fix production database

---

## Success Criteria

**Technical:**
- [ ] Zero critical security issues
- [ ] 99.9% uptime
- [ ] < 500ms page load time
- [ ] Automated backups working
- [ ] All tests passing

**Business:**
- [ ] Each role has focused, clean UI
- [ ] Vehicle data auto-populated (>90% fields)
- [ ] Notifications sent within 5 minutes
- [ ] Multi-dealership workflows working
- [ ] Scheduling reduces conflicts by 80%

**User:**
- [ ] Users can complete tasks in <50% current time
- [ ] <5% error rate in data entry
- [ ] Positive feedback from all roles
- [ ] Training completed for all users
- [ ] Adoption >90% within 2 weeks

---

## Questions to Answer

Before starting, let's clarify:

1. **Timeline:** MVP (6 weeks) or full roadmap (12 weeks)?
2. **Resources:** Solo developer or team?
3. **Data:** How to handle existing production data?
4. **Dealerships:** How many dealerships to support initially?
5. **APIs:** Have access to Maskinporten (or can get test access)?
6. **Domain:** Have a domain for emails (needed for Resend)?
7. **Hosting:** Where to deploy? (Coolify again, or different?)

---

**Ready to start?** I can:
1. Create all GitHub Project issues from this roadmap
2. Help set up test environment
3. Start Phase 0 fixes immediately
4. Research any specific technical questions

Let me know which approach you prefer! 🚀

---

**Document Status:** Draft - Ready for review
**Next Update:** After roadmap approval and timeline decision
