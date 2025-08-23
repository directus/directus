Perform CRUD on Directus Operations within Flows. Operations are individual actions that execute sequentially in a flow, processing and transforming data through the data chain.

<key_concepts>
- **Operations** are the building blocks of flows
- Each operation has a unique `key` that identifies it in the data chain
- Operations connect via `resolve` (success) and `reject` (failure) paths
- Data from each operation is stored under its key in the data chain
</key_concepts>

<available_operations>
Core operations available in Directus:

- **condition** - Evaluate filter rules to determine execution path
- **exec** - Execute custom JavaScript/TypeScript code in sandboxed environment
- **item-create** - Create items in a collection
- **item-read** - Retrieve items from a collection
- **item-update** - Update existing items in a collection
- **item-delete** - Remove items from a collection
- **json-web-token** - Sign, verify, or decode JWT tokens
- **log** - Output debug messages to console
- **mail** - Send email notifications with templates
- **notification** - Send in-app notifications to users
- **request** - Make HTTP requests to external services
- **sleep** - Delay execution for specified time
- **throw-error** - Throw custom errors to stop flow execution
- **transform** - Create custom JSON payloads
- **trigger** - Execute another flow with iteration modes

If user has installed extensions from the Directus Marketplace, there may be more operations available than this. You can read existing operations to see if they are using extensions operations.
</available_operations>

<crud_actions>
### `read` - List Flow Operations

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "name", "key", "type", "flow", "resolve", "reject"],
		"filter": { "flow": { "_eq": "flow-uuid" } },
		"sort": ["position_x", "position_y"]
	}
}
```

### `create` - Add Operation to Flow

**Required**: `flow`, `key`, `type`, `resolve`, `reject`, `position_x`, `position_y`

```json
{
	"action": "create",
	"data": {
		"flow": "flow-uuid", // Required: Flow this operation belongs to
		"key": "notify_user", // Required: Unique key for this operation
		"type": "notification", // Required: Operation type
		"name": "Send Notification", // Optional: Display name
		"position_x": 19, // Required: Grid X position (use 19, 37, 55, 73...)
		"position_y": 1, // Required: Grid Y position (use 1, 19, 37...)
		"options": {
			// Optional: Type-specific configuration (default: {})
			// Configuration based on operation type
		},
		"resolve": null, // Required: UUID of next operation on success (null initially)
		"reject": null // Required: UUID of next operation on failure (null initially)
	}
}
```

### `update` - Modify Operation

```json
{
	"action": "update",
	"key": "operation-uuid",
	"data": {
		"options": {
			// Updated configuration
		},
		"resolve": "operation-uuid-here"
	}
}
```

### `delete` - Remove Operation

```json
{
	"action": "delete",
	"key": "operation-uuid"
}
```
</crud_actions>

<operation_examples>
<condition>
Evaluates filter rules to determine path

```json
{
	"type": "condition",
	"options": {
		"filter": {
			"$trigger": {
				"payload": {
					"status": {
						"_eq": "published"
					}
				}
			}
		}
	}
}
```

<critical_filter_syntax>
- Use **nested objects**, NOT dot notation
- `"$trigger.payload.status"` ❌ WRONG
- `{"$trigger": {"payload": {"status": {...}}}}` ✅ CORRECT
</critical_filter_syntax>

<filter_examples>

```json
// Check if field exists and has value
{
  "filter": {
    "$trigger": {
      "payload": {
        "website": {"_nnull": true}
      }
    }
  }
}

// Multiple conditions (AND)
{
  "filter": {
	"$trigger": {
		"payload": {
			"_and": [
				{ "status": {"_eq": "published"}},
				{ "featured": {"_eq": true}}
			]
		}
	}

  }
}
```

</filter_examples>
</condition>

<item_create>
Creates items in a collection

```json
{
	"type": "item-create",
	"options": {
		"collection": "notifications",
		"permissions": "$trigger",
		"emitEvents": true,
		"payload": {
			"title": "{{ $trigger.payload.title }}",
			"user": "{{ $accountability.user }}"
		}
	}
}
```
</item_create>

<item_read>
Retrieves items from a collection

```json
{
	"type": "item-read",
	"options": {
		"collection": "products",
		"permissions": "$full",
		"query": {
			"filter": {
				"status": { "_eq": "active" }
			},
			"limit": 10
		}
	}
}
```
</item_read>

<item_update>
Updates existing items

```json
{
	"type": "item-update",
	"options": {
		"collection": "orders",
		"permissions": "$trigger",
		"emitEvents": true,
		"key": "{{ $trigger.payload.id }}",
		"payload": {
			"status": "processed"
		}
	}
}
```
</item_update>

<item_delete>
Removes items from a collection

```json
{
	"type": "item-delete",
	"options": {
		"collection": "temp_data",
		"permissions": "$full",
		"key": ["{{ read_items[0].id }}"]
	}
}
```
</item_delete>

<exec>
Execute custom JavaScript/TypeScript in isolated sandbox

<security_warning>
**⚠️ SECURITY WARNING**:

- Scripts run in a sandboxed environment with NO file system or network access
- Always validate and sanitize data before processing
- Avoid exposing sensitive data or credentials
- Consider if the logic can be achieved with other operations first
</security_warning>

```json
{
	"type": "exec",
	"options": {
		"code": "module.exports = async function(data) {\n  // Validate input\n  if (!data.$trigger.payload.value) {\n    throw new Error('Missing required value');\n  }\n  \n  // Process data\n  const result = data.$trigger.payload.value * 2;\n  \n  // Return must be valid JSON\n  return {\n    result: result,\n    processed: true\n  };\n}"
	}
}
```

<exec_use_cases>
**Common Use Cases**:

- Data transformation and calculations
- Complex conditional logic
- Formatting and parsing
- Extracting values from nested data
</exec_use_cases>

<exec_example>
**Example - Extract Key from Trigger**:

```javascript
module.exports = async function (data) {
	// Handle different trigger formats
	if (data.$trigger.key) {
		return data.$trigger.key;
	} else if (data.$trigger.keys?.[0]) {
		return data.$trigger.keys[0];
	}
	throw new Error('No key found in trigger');
};
```
</exec_example>
</exec>

<mail>
Send email notifications with optional templates

```json
{
	"type": "mail",
	"options": {
		"to": ["user@example.com", "{{ $trigger.payload.email }}"],
		"subject": "Order Confirmation",
		"type": "markdown", // "markdown" (default), "wysiwyg", or "template"
		"body": "Your order {{ $trigger.payload.order_id }} has been confirmed.",
		"cc": ["cc@example.com"], // Optional
		"bcc": ["bcc@example.com"], // Optional
		"replyTo": ["reply@example.com"] // Optional
	}
}
```

<mail_template_mode>
**Template Mode**:

```json
{
	"type": "mail",
	"options": {
		"to": ["{{ $trigger.payload.email }}"],
		"subject": "Welcome!",
		"type": "template",
		"template": "welcome-email", // Template name (default: "base")
		"data": {
			"username": "{{ $trigger.payload.name }}",
			"activation_url": "https://example.com/activate/{{ $trigger.payload.token }}"
		}
	}
}
```
</mail_template_mode>
</mail>

<notification>
Send in-app notifications to users

```json
{
	"type": "notification",
	"options": {
		"recipient": ["{{ $accountability.user }}"], // User ID(s) to notify
		"subject": "Task Complete",
		"message": "Your export is ready for download",
		"permissions": "$trigger",
		"collection": "exports", // Optional: Related collection
		"item": "{{ create_export.id }}" // Optional: Related item ID
	}
}
```
</notification>

<request>
Make HTTP requests

```json
{
	"type": "request",
	"options": {
		"method": "POST",
		"url": "https://api.example.com/webhook",
		"headers": [
			{
				"header": "Authorization",
				"value": "Bearer {{ $env.API_TOKEN }}"
			},
			{
				"header": "Content-Type",
				"value": "application/json"
			}
		],
		"body": "{\"data\": \"{{ process_data }}\", \"timestamp\": \"{{ $trigger.timestamp }}\"}"
	}
}
```

<request_format_notes>
**Important Notes**:

- **headers**: Array of objects with `header` and `value` properties (NOT a simple object)
- **body**: Stringified JSON (NOT a native object)
- Use double quotes and escape them in the JSON string: `"{\"key\": \"value\"}"`
</request_format_notes>

<request_example>
**Real Example (Netlify Deploy Hook)**:

```json
{
	"type": "request",
	"options": {
		"method": "POST",
		"url": "https://api.netlify.com/build_hooks/your-hook-id",
		"headers": [
			{
				"header": "User-Agent",
				"value": "Directus-Flow/1.0"
			}
		],
		"body": "{\"trigger\": \"content_updated\", \"item_id\": \"{{ $trigger.payload.id }}\"}"
	}
}
```
</request_example>
</request>

<transform>
Create custom JSON payload

```json
{
	"type": "transform",
	"options": {
		"json": {
			"combined": {
				"user": "{{ $accountability.user }}",
				"items": "{{ read_items }}",
				"timestamp": "{{ $trigger.timestamp }}"
			}
		}
	}
}
```
</transform>

<trigger>
Execute another flow with optional iteration modes

```json
{
	"type": "trigger",
	"options": {
		"flow": "other-flow-uuid",
		"payload": {
			"data": "{{ transform_result }}"
		},
		"iterationMode": "parallel", // Optional: "parallel" (default), "serial", "batch"
		"batchSize": 10 // Optional: Only used when iterationMode is "batch" (default: 10)
	}
}
```

<trigger_iteration_modes>
**Iteration Modes** (when payload is an array):
- `parallel` - Process all items simultaneously (default)
- `serial` - Process items one at a time in order
- `batch` - Process in batches of specified size
</trigger_iteration_modes>
</trigger>

<sleep>
Delay execution

```json
{
	"type": "sleep",
	"options": {
		"milliseconds": 5000
	}
}
```
</sleep>

<log>
Debug logging

```json
{
	"type": "log",
	"options": {
		"message": "Processing item: {{ $trigger.payload.id }}"
	}
}
```
</log>

<throw_error>
Throw a custom error to stop flow execution

```json
{
	"type": "throw-error",
	"options": {
		"code": "CUSTOM_ERROR",
		"status": "400",
		"message": "Invalid data: {{ $trigger.payload.error_details }}"
	}
}
```
</throw_error>

<json_web_token>
Sign, verify, or decode JWT tokens

<jwt_sign>
**Sign a token**:

```json
{
	"type": "json-web-token",
	"options": {
		"operation": "sign",
		"payload": {
			"userId": "{{ $trigger.payload.user }}",
			"role": "{{ $trigger.payload.role }}"
		},
		"secret": "{{ $env.JWT_SECRET }}",
		"options": {
			"expiresIn": "1h",
			"algorithm": "HS256"
		}
	}
}
```
</jwt_sign>

<jwt_verify>
**Verify a token**:

```json
{
	"type": "json-web-token",
	"options": {
		"operation": "verify",
		"token": "{{ $trigger.payload.token }}",
		"secret": "{{ $env.JWT_SECRET }}",
		"options": {
			"algorithms": ["HS256"]
		}
	}
}
```
</jwt_verify>

<jwt_decode>
**Decode a token** (without verification):

```json
{
	"type": "json-web-token",
	"options": {
		"operation": "decode",
		"token": "{{ $trigger.payload.token }}",
		"options": {
			"complete": true
		}
	}
}
```
</jwt_decode>
</json_web_token>
</operation_examples>

<data_chain_variables>
Use `{{ variable }}` syntax to access data:

- `{{ $trigger.payload }}` - Trigger data
- `{{ $accountability.user }}` - User context
- `{{ operation_key }}` - Result from specific operation (recommended)
- `{{ operation_key.field }}` - Specific field from operation result

**Note on `$last`:** While `{{ $last }}` references the previous operation's result, avoid using it in production flows. If you reorder operations, `$last` will reference a different operation, potentially breaking your flow. Always use specific operation keys like `{{ operation_key }}` for reliable, maintainable flows.
</data_chain_variables>

<permission_options>
For operations that support permissions:

- `$trigger` - Use permissions from the triggering context (default)
- `$public` - Use public role permissions
- `$full` - Use full system permissions
- `role-uuid` - Use specific role's permissions
</permission_options>

<real_world_patterns>
<data_processing_pipeline>
### Data Processing Pipeline

Read → Transform → Update pattern (from invoice calculator):

```json
// 1. Read with relations
{
  "flow": "flow-uuid",
  "key": "invoice",
  "type": "item-read",
  "position_x": 19,
  "position_y": 1,
  "options": {
    "collection": "os_invoices",
    "key": ["{{$trigger.payload.invoice}}"],
    "query": {
      "fields": ["*", "line_items.*", "payments.*"]
    }
  },
  "resolve": "calc-operation-uuid"
}
// 2. Calculate totals
{
  "flow": "flow-uuid",
  "key": "calculations",
  "type": "exec",
  "position_x": 37,
  "position_y": 1,
  "options": {
    "code": "// Calculate invoice totals and payments"
  },
  "resolve": "update-operation-uuid"
}
// 3. Update with results
{
  "flow": "flow-uuid",
  "key": "update_invoice",
  "type": "item-update",
  "position_x": 55,
  "position_y": 1,
  "options": {
    "collection": "os_invoices",
    "payload": "{{calculations}}",
    "key": ["{{$trigger.payload.invoice}}"]
  }
}
```
</data_processing_pipeline>

<error_handling_branching>
### Error Handling with Branching

```json
// Main operation with error handling
{
  "flow": "flow-uuid",
  "key": "main_operation",
  "type": "request",
  "position_x": 19,
  "position_y": 1,
  "resolve": "success-operation-uuid",
  "reject": "error-operation-uuid"
}
// Success path
{
  "flow": "flow-uuid",
  "key": "success_notification",
  "type": "notification",
  "position_x": 37,
  "position_y": 1
}
// Error path (lower row)
{
  "flow": "flow-uuid",
  "key": "error_notification",
  "type": "log",
  "position_x": 37,
  "position_y": 19
}
```
</error_handling_branching>

<conditional_branching>
### Conditional Branching with Logging

```json
{
	"flow": "flow-uuid",
	"key": "check_status",
	"type": "condition",
	"position_x": 19,
	"position_y": 1,
	"options": {
		"filter": {
			"$trigger": {
				"payload": {
					"status": { "_eq": "published" }
				}
			}
		}
	},
	"resolve": "notification-operation-uuid", // Same row
	"reject": "log-operation-uuid" // Lower row
}
```
</conditional_branching>

<chaining_flows>
### Chaining Flows (Trigger Operation)

```json
// In main flow - trigger utility flow
{
	"key": "get_globals",
	"type": "trigger",
	"options": {
		"flow": "69e87d0b-df14-4779-bdc8-abc05f2f1e97" // [Util] Get Globals
	},
	"resolve": "globals-operation-uuid"
}
// Result available in {{get_globals}}
```
</chaining_flows>
</real_world_patterns>

<positioning_system>
Operations use a **grid-based positioning system** for the visual flow editor:

<grid_layout>
### Grid Layout:

- **Each operation** occupies a **14x14 grid unit**
- **Position coordinates** are grid units, NOT pixels
- **Standard spacing** between operations is typically **18 units** (19, 37, 55, 73, etc.)
- **Vertical positioning** usually starts at `position_y: 1`
</grid_layout>

<position_patterns>
### Common Position Patterns:

```json
// Linear flow (left to right)
{"position_x": 19, "position_y": 1}  // First operation
{"position_x": 37, "position_y": 1}  // Second operation
{"position_x": 55, "position_y": 1}  // Third operation
{"position_x": 73, "position_y": 1}  // Fourth operation

// Branching flow (success/error paths)
{"position_x": 19, "position_y": 1}   // Main operation
{"position_x": 37, "position_y": 1}   // Success path
{"position_x": 37, "position_y": 19}  // Error path (lower row)

// Complex multi-row flow
{"position_x": 19, "position_y": 1}   // Row 1, Col 1
{"position_x": 37, "position_y": 1}   // Row 1, Col 2
{"position_x": 55, "position_y": 19}  // Row 2, Col 3
{"position_x": 73, "position_y": 1}   // Row 1, Col 4
```
</position_patterns>

<positioning_tips>
### Positioning Tips:

- **ALWAYS SET POSITIONS**: Never use default (0,0) - operations will overlap
- **Start at 19**: First operation typically at `position_x: 19, position_y: 1`
- **Increment by 18**: Next positions: 37, 55, 73, 91, etc.
- **Row spacing**: Use `position_y: 1, 19, 37` for multiple rows
- **Visual clarity**: Leave space between branches and parallel paths
- **No Overlapping**: Each operation needs unique coordinates
</positioning_tips>
</positioning_system>

<important_notes>
- **Admin Required**: This tool requires admin permissions
- **Flow Required**: Operations must belong to an existing flow (use `flow` UUID)
- **Unique Keys**: Each operation needs a unique `key` within its flow
- **Data Chain**: Results stored under operation's `key`
- **Execution Order**: Determined by resolve/reject paths, NOT position
- **Permissions**: See <permission_options> above
- **First Operation**: Set as flow's `operation` field when creating
- **Position**: Grid-based layout for visual organization only
</important_notes>

<workflow_creation>
The standard workflow for creating flows with operations:

<workflow_steps>
### Step-by-Step Process:

1. **Create the flow** using the `flows` tool
2. **Create all operations** with null resolve/reject initially
3. **Link operations together** using the UUIDs returned from step 2
4. **Update the flow** to set the first operation as the entry point
</workflow_steps>

<workflow_rationale>
### Why This Order Matters:

- Operations must exist before they can be referenced in resolve/reject fields
- UUIDs are only available after operations are created
- The flow needs at least one operation created before setting its entry point
</workflow_rationale>

<workflow_example>
### Complete Workflow Example:

```json
// Step 1: Create the flow first (using flows tool)
{
  "action": "create",
  "data": {
    "name": "Email on Post Published",
    "trigger": "event",
    "options": {
      "type": "action",
      "scope": ["items.create"],
      "collections": ["posts"]
    }
  }
}
// Returns: {"id": "flow-uuid-123", ...}

// Step 2: Create operations with null connections initially
{"action": "create", "data": {
  "flow": "flow-uuid-123",
  "key": "check_status",
  "type": "condition",
  "position_x": 19,  // First operation position
  "position_y": 1,
  "options": {
    "filter": {
      "$trigger": {
        "payload": {
          "status": {"_eq": "published"}
        }
      }
    }
  },
  "resolve": null,  // Set to null initially
  "reject": null    // Set to null initially
}}
// Returns: {"id": "condition-uuid-456", ...}

{"action": "create", "data": {
  "flow": "flow-uuid-123",
  "key": "send_email",
  "type": "mail",
  "position_x": 37,  // Second operation position
  "position_y": 1,
  "options": {
    "to": ["admin@example.com"],
    "subject": "New post published",
    "body": "Post '{{$trigger.payload.title}}' was published"
  },
  "resolve": null,
  "reject": null
}}
// Returns: {"id": "email-uuid-789", ...}

// Step 3: Connect operations using UUIDs (NOT keys)
{"action": "update", "key": "condition-uuid-456", "data": {
  "resolve": "email-uuid-789",  // Use UUID from step 2
  "reject": null                // No error handling operation
}}

// Step 4: Update flow to set first operation (using flows tool)
{"action": "update", "key": "flow-uuid-123", "data": {
  "operation": "condition-uuid-456"  // First operation UUID
}}
```
</workflow_example>
</workflow_creation>

<common_mistakes>
1. **DO NOT** create operations without a flow - create flow first
2. **DO NOT** use operation keys in resolve/reject - use UUIDs (see <workflow_example> above)
3. **DO NOT** try to reference operations that do not exist yet
4. **DO NOT** use duplicate keys within the same flow
5. **DO NOT** create circular references in resolve/reject paths
6. **DO NOT** forget to handle both success and failure paths
7. **DO NOT** pass stringified JSON - use native objects
8. **DO NOT** leave operations at default position (0,0) - see <positioning_system> above
9. **DO NOT** use dot notation in condition filters - see <critical_filter_syntax> above
10. **DO NOT** use wrong format for request operations - see <request_format_notes> above
</common_mistakes>

<troubleshooting>
<invalid_foreign_key>
### "Invalid foreign key" Errors

This typically means you're trying to reference an operation that doesn't exist:

- Verify the operation UUID exists by reading operations for the flow
- Check that you're using UUIDs (36 characters) not keys (short names)
- Ensure operations are created before being referenced
</invalid_foreign_key>

<operation_not_executing>
### Operation Not Executing

- Check the resolve/reject chain for breaks
- Verify the first operation is set as the flow's `operation` field
- Confirm all required operation options are provided
</operation_not_executing>

<overlapping_operations>
### Overlapping Operations in Visual Editor

If operations appear stacked at (0,0) in the flow editor:

```json
// Fix by updating each operation's position
{"action": "update", "key": "operation-uuid", "data": {
  "position_x": 19,  // First operation
  "position_y": 1
}}

{"action": "update", "key": "other-operation-uuid", "data": {
  "position_x": 37,  // Second operation
  "position_y": 1
}}
```
</overlapping_operations>
</troubleshooting>
