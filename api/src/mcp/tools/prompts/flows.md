# Directus Flows Tool

Manage automation flows that enable event-driven data processing and task automation. Flows consist of a trigger and a
series of operations forming a data chain.

## 🔑 Key Concepts

**Flow** = Trigger + Operations + Data Chain

- Each flow has ONE trigger that starts execution
- Operations execute sequentially, passing data through the chain
- Data chain accumulates results from each step

## 📋 Flow Data Structure

All flows share these core fields for creation:

- **name** (required) - Flow display name
- **trigger** (required) - Trigger type: `event`, `webhook`, `schedule`, `operation`, `manual`
- **status** - `active` or `inactive` (default: `active`)
- **accountability** - `all`, `activity`, or `null` (default: `all`)
- **icon** - Icon identifier (optional)
- **color** - Hex color code (optional)
- **description** - Flow description (optional)
- **options** - Trigger-specific configuration object (optional)
- **operation** - UUID of first operation (optional, set after creating operations)

## Actions

### `read` - List/Query Flows

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "name", "status", "trigger", "operations"],
		"filter": { "status": { "_eq": "active" } },
		"limit": 10
	}
}
```

### `create` - Create New Flow

**Required**: `name`, `trigger`

```json
{
	"action": "create",
	"data": {
		"name": "Send email when new post is published",
		"icon": "bolt", // Optional icon
		"color": "#FFA439", // Optional hex color
		"description": "checks if new post is published and emails admin",
		"status": "active", // active|inactive
		"accountability": "all", // all|activity|null
		"trigger": "event", // event|webhook|schedule|operation|manual
		"options": {
			// Trigger-specific configuration
			"type": "action",
			"scope": ["items.create"],
			"collections": ["posts"]
		}
	}
}
```

### `update` - Modify Existing Flow

```json
{
	"action": "update",
	"key": "flow-uuid",
	"data": {
		"status": "inactive",
		"description": "Updated description"
	}
}
```

### `delete` - Remove Flow

```json
{
	"action": "delete",
	"key": "flow-uuid"
}
```

## 🎯 Trigger Types & Options

### Event Hook Trigger

Responds to data changes and system events

```json
{
	"trigger": "event",
	"options": {
		"type": "filter", // filter (blocking) | action (non-blocking)
		"scope": ["items.create", "items.update"],
		"collections": ["orders", "products"],
		"return": "$last" // For filter only: $last|$all|<operationKey>
	}
}
```

**Common Scopes**:

- `items.create`, `items.update`, `items.delete` - Data operations
- `auth.login` - User authentication
- **Note**: Multiple scopes trigger flow for ANY matching event

### Webhook Trigger

```json
{
	"trigger": "webhook",
	"options": {
		"method": "POST", // GET|POST
		"async": false, // true = immediate response, false = wait for completion
		"return": "$last", // Response body: $last|$all|<operationKey>
		"cache": false // Cache GET responses
	}
}
```

### Schedule Trigger (CRON)

```json
{
	"trigger": "schedule",
	"options": {
		"cron": "0 */15 * * * *" // Every 15 minutes
	}
}
```

**CRON Format**: `second minute hour day month weekday` **Examples**:

- `"0 0 9 * * *"` - Daily at 9 AM
- `"0 30 * * * *"` - Every 30 minutes (note: runs at :30 of each hour)
- `"0 */15 * * * *"` - Every 15 minutes

### Manual Trigger

UI button that users click to start flows

```json
{
	"trigger": "manual",
	"options": {
		"collections": ["products"],
		"location": "item", // item|collection|both
		"requireSelection": true, // Default true - requires item selection
		"requireConfirmation": false,
		"confirmationDescription": "Create a New Project 🚀",
		"fields": [
			// Input fields for confirmation dialog
			{
				"field": "reason",
				"name": "Reason for Action",
				"type": "string",
				"meta": {
					"interface": "input",
					"required": true,
					"note": "Why are you performing this action?"
				}
			}
		]
	}
}
```

### Operation Trigger (Another Flow)

```json
{
	"trigger": "operation",
	"options": {
		"return": "$last" // Data to return to calling flow
	}
}
```

## 🔄 Working with Operations

After creating a flow, add operations using the `operations` tool:

1. Create flow first to get flow ID
2. Use `operations` tool to add/manage operations
3. Operations execute in sequence based on resolve/reject paths

## 📊 Data Chain Access

Operations can access:

- `$trigger` - Initial trigger data
- `$accountability` - User/permission context
- `$env` - Environment variables
- `$last` - Result of previous operation
- `<operationKey>` - Result of specific operation

## ⚡ Real-World Examples

### Post Approval Email (Event-Driven)

```json
{
	"action": "create",
	"data": {
		"name": "[Website] Post Approval",
		"icon": "mark_email_read",
		"color": "#18222F",
		"description": "Send email when posts are ready for review",
		"status": "active",
		"trigger": "event",
		"accountability": "all",
		"options": {
			"type": "action", // Non-blocking
			"scope": ["items.update"],
			"collections": ["posts"]
		}
	}
}
// Then add operations: Check Status → Send Email
```

### Auto-Generate Slugs (Event-Driven)

```json
{
	"action": "create",
	"data": {
		"name": "[Website] Slugify",
		"icon": "link",
		"color": "#18222F",
		"description": "Generate slugs for pages, posts, and categories",
		"status": "active",
		"trigger": "event",
		"accountability": "all",
		"options": {
			"type": "action",
			"scope": ["items.create"],
			"collections": ["pages", "posts", "categories"]
		}
	}
}
```

### Create Scheduled Task

```json
{
	"action": "create",
	"data": {
		"name": "Daily Report",
		"trigger": "schedule",
		"status": "active",
		"options": {
			"cron": "0 0 9 * * *" // 9 AM daily
		}
	}
}
```

### Project Creator with Template (Manual + Confirmation)

```json
{
	"action": "create",
	"data": {
		"name": "[Projects] Create Project",
		"trigger": "manual",
		"status": "active",
		"options": {
			"collections": ["os_projects", "organizations"],
			"requireSelection": false, // Can trigger without selection
			"requireConfirmation": true,
			"confirmationDescription": "Create a New Project 🚀",
			"fields": [
				{
					"field": "name",
					"type": "string",
					"name": "Project Name",
					"meta": {
						"interface": "input",
						"required": true
					}
				},
				{
					"field": "organization",
					"type": "json",
					"name": "Organization",
					"meta": {
						"interface": "collection-item-dropdown",
						"required": true,
						"options": {
							"selectedCollection": "organizations"
						}
					}
				}
			]
		}
	}
}
```

### Utility Flow (Operation Trigger)

````json
{
  "action": "create",
  "data": {
    "name": "[Util] Get Globals",
    "trigger": "operation",
    "accountability": "all",
    "options": {
      "return": "$last"  // Returns data to calling flow
    }
  }
}
// Called by other flows using trigger operation

## ⚠️ Important Notes

- **Admin Required**: This tool requires admin permissions
- **Data Format**: Pass `data` as native objects, NOT stringified JSON
- **Flow Execution**: Flows with `operations` array will include their operations
- **Webhook URL**: After creating webhook trigger, URL is `/flows/trigger/<flow-id>`
- **Event Blocking**: Filter events pause transaction until flow completes
- **Logs**: Flow executions are logged (check `accountability` setting)

## 🚨 Common Mistakes to Avoid

1. **Don't** create operations here - use the `operations` tool
2. **Don't** trigger flows here - use the `trigger-flow` tool
3. **Don't** pass stringified JSON in data parameter
4. **Don't** forget required fields: `name` and `trigger` for creation
5. **Don't** put options outside of data - it goes inside the flow object:
   ```json
   // ✅ CORRECT
   {
     "action": "create",
     "data": {
       "name": "My Flow",
       "trigger": "event",
       "options": { "type": "action" }
     }
   }

   // ❌ WRONG
   {
     "action": "create",
     "data": { "name": "My Flow", "trigger": "event" },
     "options": { "type": "action" }
   }
````
