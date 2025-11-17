Manage automation flows that enable event-driven data processing and task automation. Flows consist of a trigger and a
series of operations forming a data chain.

<flow_concepts>

## Key Concepts

**Flow** = Trigger + Operations + Data Chain

- Each flow has ONE trigger that starts execution
- Operations execute sequentially, passing data through the chain
- Data chain accumulates results from each step

After creating a flow, use the `operations` tool to add individual operations with detailed operation syntax,
positioning, and data chain usage. </flow_concepts>

<core_fields>

## Flow Data Structure

All flows share these core fields for creation:

- `name` (required) - Flow display name
- `trigger` (required) - Trigger type: `event`, `webhook`, `schedule`, `operation`, `manual`
- `status` - `active` or `inactive` (default: `active`)
- `accountability` - `all`, `activity`, or `null` (default: `all`)
- `icon` - Icon identifier (optional)
- `color` - Hex color code (optional)
- `description` - Flow description (optional)
- `options` - Trigger-specific configuration object (optional)
- `operation` - UUID of first operation (optional, set after creating operations) </core_fields>

<crud_actions>

## Actions

- ALWAYS show the flow URL if it is present in the result

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

</crud_actions>

<trigger_types>

## Trigger Types & Options

### Event Hook Trigger

Responds to data changes and system events

```json
{
	"trigger": "event",
	"options": {
		"type": "filter", // filter (blocking) | action (non-blocking)
		"scope": ["items.create", "items.update"],
		"collections": ["orders", "products"],
		"return": "process_data" // For filter only: <operationKey>|$all|$last (avoid $last)
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
		"return": "transform_result", // Response body: <operationKey>|$all|$last (avoid $last)
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
		"collections": ["posts", "products"],
		"location": "item", // item|collection|both
		"requireSelection": false, // Default true - requires item selection
		"requireConfirmation": true,
		"confirmationDescription": "AI Ghostwriter",
		"async": true, // Run in background
		"fields": [
			{
				"field": "prompt",
				"type": "text",
				"name": "Prompt",
				"meta": {
					"interface": "input-multiline",
					"note": "Describe what you want to create.",
					"width": "full",
					"required": true
				}
			},
			{
				"field": "voice",
				"type": "json",
				"name": "Tone Of Voice",
				"meta": {
					"interface": "tags",
					"options": {
						"presets": ["friendly", "professional", "casual"]
					}
				}
			},
			{
				"field": "colors",
				"type": "json",
				"name": "Color Palette",
				"meta": {
					"interface": "list",
					"options": {
						"fields": [
							{
								"field": "color",
								"type": "string",
								"meta": { "interface": "select-color" }
							},
							{
								"field": "name",
								"type": "string",
								"meta": { "interface": "input" }
							}
						]
					}
				}
			}
		]
	}
}
// Access confirmation inputs: {{ $trigger.body.prompt }}, {{ $trigger.body.voice }}
```

**Field Options**: Supports non-relational Directus interfaces - `input`, `input-multiline`, `input-rich-text-md`,
`tags`, `list`, `select-color`, `select-radio`, `collection-item-dropdown`, etc.

### Operation Trigger (Another Flow)

```json
{
	"trigger": "operation",
	"options": {
		"return": "final_result" // Data to return to calling flow: <operationKey>|$all|$last (avoid $last)
	}
}
```

</trigger_types>

<operations_integration>

## Working with Operations

**Use the `operations` tool for complete details on:**

- Creating and linking operations
- 14x14 grid positioning system
- Data chain variable syntax
- Operation-specific configuration

**Critical Workflow - Follow This Order:**

1. Create flow first (using `flows` tool)
2. Create all operations with null resolve/reject initially (using `operations` tool)
3. Link operations together using UUIDs from step 2
4. Update flow to set first operation as entry point

**Why This Order:** Operations must exist before they can be referenced. UUIDs only available after creation.

**Complete Example:**

```json
// Step 1: Create flow
{"action": "create", "data": {
  "name": "Email on Post Published",
  "trigger": "event",
  "options": {"type": "action", "scope": ["items.create"], "collections": ["posts"]}
}}
// Returns: {"id": "flow-uuid-123"}

// Step 2: Create operations with null connections
{"action": "create", "data": {
  "flow": "flow-uuid-123", "key": "check_status", "type": "condition",
  "position_x": 19, "position_y": 1,
  "options": {"filter": {"$trigger": {"payload": {"status": {"_eq": "published"}}}}},
  "resolve": null, "reject": null
}}
// Returns: {"id": "condition-uuid-456"}

{"action": "create", "data": {
  "flow": "flow-uuid-123", "key": "send_email", "type": "mail",
  "position_x": 37, "position_y": 1,
  "options": {"to": ["admin@example.com"], "subject": "New post", "body": "{{$trigger.payload.title}}"},
  "resolve": null, "reject": null
}}
// Returns: {"id": "email-uuid-789"}

// Step 3: Link operations via UUIDs
{"action": "update", "key": "condition-uuid-456", "data": {
  "resolve": "email-uuid-789"
}}

// Step 4: Set flow entry point
{"action": "update", "key": "flow-uuid-123", "data": {
  "operation": "condition-uuid-456"
}}
```

</operations_integration>

<flow_chaining>

## 🔗 Flow Chaining

**When to Chain**: Reusable utilities, complex multi-step workflows, conditional branching

**How to Chain**:

1. Child flow: `"trigger": "operation"`, `"return": "final_key"` or `"$last"`
2. Parent flow: Use `trigger` operation with child flow UUID and payload
3. Access child results: `{{ trigger_operation_key }}`

**Common Utility Patterns**:

```json
// Utils → Get Globals (called by multiple flows)
{
  "name": "Utils → Get Globals",
  "trigger": "operation",
  "options": { "return": "$last" }
}

// Utils → Send Email (reusable email sender)
{
  "name": "Utils → Send Email",
  "trigger": "operation",
  "options": { "return": "$last" }
}

// Main flow calls utility
{
  "type": "trigger",
  "key": "globals",
  "options": {
    "flow": "utils-globals-uuid"
  }
}
// Access: {{ globals.openai_api_key }}
```

**Multi-Chain Example** (Form Notifications):

```json
// Chains: Read Form → Format → Render Template → Send Email
{
	"type": "trigger",
	"key": "render",
	"options": {
		"flow": "utils-render-template-uuid",
		"payload": "{{ format }}"
	}
}
```

**Best Practices**:

- Name utilities with "Utils →" prefix for clarity
- Use `$last` return for simple utilities, specific keys for complex ones
- Chain utilities together for modular, reusable workflows
- Keep each utility focused on single responsibility </flow_chaining>

<data_chain_warning>

## Data Chain Access

Operations can access data using `{{ variable }}` syntax:

- `{{ $trigger.payload }}` - Trigger data
- `{{ $accountability.user }}` - User context
- `{{ $env.VARIABLE_NAME }}` - Environment variables
- `{{ operation_key }}` - Result from specific operation (recommended)
- `{{ operation_key.field }}` - Specific field from operation result
- `{{ $last }}` - Previous operation result (⚠️ avoid - breaks when reordered)

**Always use operation keys** for reliable flows. If you reorder operations, `$last` will reference a different operation. </data_chain_warning>

<real_world_examples>

## Real-World Examples

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
      "return": "global_data"  // Returns data to calling flow: <operationKey>|$all|$last
    }
  }
}
// Called by other flows using trigger operation
```
</real_world_examples>

<important_notes>
## Important Notes

- **Admin Required**: This tool requires admin permissions
- **Data Format**: Pass `data` as native objects, NOT stringified JSON
- **Flow Execution**: Flows with `operations` array will include their operations
- **Webhook URL**: After creating webhook trigger, URL is `/flows/trigger/<flow-id>`
- **Event Blocking**: Filter events pause transaction until flow completes
- **Logs**: Flow executions are logged (check `accountability` setting)
</important_notes>

<common_mistakes>
## Common Mistakes to Avoid

1. **DO NOT** create operations here - use the `operations` tool
2. **DO NOT** trigger flows here - use the `trigger-flow` tool
3. **DO NOT** pass stringified JSON in data parameter
4. **DO NOT** forget required fields: `name` and `trigger` for creation
5. **DO NOT** put options outside of data - it goes inside the flow object:
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
   ```
</common_mistakes>
````
