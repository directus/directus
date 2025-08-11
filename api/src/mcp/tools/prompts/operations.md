# Directus Operations Tool

Manage operations within flows. Operations are individual actions that execute sequentially in a flow, processing and
transforming data through the data chain.

## 🔑 Key Concepts

- **Operations** are the building blocks of flows
- Each operation has a unique `key` that identifies it in the data chain
- Operations connect via `resolve` (success) and `reject` (failure) paths
- Data from each operation is stored under its key in the data chain

## Actions

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

## 📋 Operation Types & Options

### Condition

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

**⚠️ CRITICAL: Filter Syntax**

- Use **nested objects**, NOT dot notation
- `"$trigger.payload.status"` ❌ WRONG
- `{"$trigger": {"payload": {"status": {...}}}}` ✅ CORRECT

**More Filter Examples**:

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
    "_and": [
      {
        "$trigger": {
          "payload": {
            "status": {"_eq": "published"}
          }
        }
      },
      {
        "$trigger": {
          "payload": {
            "featured": {"_eq": true}
          }
        }
      }
    ]
  }
}

// Check nested data from previous operations
{
  "filter": {
    "read_items": {
      "0": {
        "status": {"_eq": "active"}
      }
    }
  }
}
```

### Create Data

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

### Read Data

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

### Update Data

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

### Delete Data

Removes items from a collection

```json
{
	"type": "item-delete",
	"options": {
		"collection": "temp_data",
		"permissions": "$full",
		"key": ["{{ $last[0] }}"]
	}
}
```

### Run Script (exec) ⚠️ SECURITY CRITICAL

Execute custom JavaScript/TypeScript in isolated sandbox

**⚠️ SECURITY WARNING**:

- Scripts run in a sandboxed environment with NO file system or network access
- Always validate and sanitize data before processing
- Avoid exposing sensitive data or credentials
- Consider if the logic can be achieved with other operations first

```json
{
	"type": "exec",
	"options": {
		"code": "module.exports = async function(data) {\n  // Validate input\n  if (!data.$trigger.payload.value) {\n    throw new Error('Missing required value');\n  }\n  \n  // Process data\n  const result = data.$trigger.payload.value * 2;\n  \n  // Return must be valid JSON\n  return {\n    result: result,\n    processed: true\n  };\n}"
	}
}
```

**Common Use Cases**:

- Data transformation and calculations
- Complex conditional logic
- Formatting and parsing
- Extracting values from nested data

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

### Send Email

Send email notifications

```json
{
	"type": "mail",
	"options": {
		"to": ["user@example.com", "{{ $trigger.payload.email }}"],
		"subject": "Order Confirmation",
		"body": "Your order {{ $trigger.payload.order_id }} has been confirmed."
	}
}
```

### Send Notification

Send in-app notifications to users

```json
{
	"type": "notification",
	"options": {
		"users": ["{{ $accountability.user }}"],
		"permissions": "$trigger",
		"title": "Task Complete",
		"message": "Your export is ready for download"
	}
}
```

### Webhook / Request URL

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
		"body": "{\"data\": \"{{ $last }}\", \"timestamp\": \"{{ $trigger.timestamp }}\"}"
	}
}
```

**Important Notes**:

- **headers**: Array of objects with `header` and `value` properties (NOT a simple object)
- **body**: Stringified JSON (NOT a native object)
- Use double quotes and escape them in the JSON string: `"{\"key\": \"value\"}"`

**Real Example (Netlify Deploy Hook)**:

````json
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

### Transform Payload
Create custom JSON payload
```json
{
  "type": "transform",
  "options": {
    "payload": {
      "combined": {
        "user": "{{ $accountability.user }}",
        "items": "{{ read_items }}",
        "timestamp": "{{ $trigger.timestamp }}"
      }
    }
  }
}
````

### Trigger Flow

Execute another flow

```json
{
	"type": "trigger",
	"options": {
		"flow": "other-flow-uuid",
		"payload": {
			"data": "{{ $last }}"
		}
	}
}
```

### Sleep

Delay execution

```json
{
	"type": "sleep",
	"options": {
		"milliseconds": 5000
	}
}
```

### Log to Console

Debug logging

```json
{
	"type": "log",
	"options": {
		"message": "Processing item: {{ $trigger.payload.id }}"
	}
}
```

## 🔄 Data Chain Variables

Use `{{ variable }}` syntax to access data:

- `{{ $trigger.payload }}` - Trigger data
- `{{ $accountability.user }}` - User context
- `{{ $last }}` - Previous operation result
- `{{ operation_key.field }}` - Specific operation data
- `{{ array[0].property }}` - Array/object access

## ⚡ Real-World Patterns

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

## 📍 Operation Positioning System

Operations use a **grid-based positioning system** for the visual flow editor:

### Grid Layout:

- **Each operation** occupies a **14x14 grid unit**
- **Position coordinates** are grid units, NOT pixels
- **Standard spacing** between operations is typically **18 units** (19, 37, 55, 73, etc.)
- **Vertical positioning** usually starts at `position_y: 1`

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

### Positioning Tips:

- **ALWAYS SET POSITIONS**: Never use default (0,0) - operations will overlap
- **Start at 19**: First operation typically at `position_x: 19, position_y: 1`
- **Increment by 18**: Next positions: 37, 55, 73, 91, etc.
- **Row spacing**: Use `position_y: 1, 19, 37` for multiple rows
- **Visual clarity**: Leave space between branches and parallel paths
- **No Overlapping**: Each operation needs unique coordinates

## ⚠️ Important Notes

- **Admin Required**: This tool requires admin permissions
- **Flow Required**: Operations must belong to an existing flow (use `flow` UUID)
- **Unique Keys**: Each operation needs a unique `key` within its flow
- **Data Chain**: Results stored under operation's `key`
- **Execution Order**: Determined by resolve/reject paths, NOT position
- **Permissions**: Can be `$public`, `$trigger`, `$full`, or role UUID
- **First Operation**: Set as flow's `operation` field when creating
- **Position**: Grid-based layout for visual organization only

## 🔧 Typical Flow Creation Workflow

The standard workflow for creating flows with operations:

### Step-by-Step Process:

1. **Create the flow** using the `flows` tool
2. **Create all operations** with null resolve/reject initially
3. **Link operations together** using the UUIDs returned from step 2
4. **Update the flow** to set the first operation as the entry point

### Why This Order Matters:

- Operations must exist before they can be referenced in resolve/reject fields
- UUIDs are only available after operations are created
- The flow needs at least one operation created before setting its entry point

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
  "resolve": "email-uuid-789",  // ✅ Use UUID from step 2
  "reject": null                // No error handling operation
}}

// Step 4: Update flow to set first operation (using flows tool)
{"action": "update", "key": "flow-uuid-123", "data": {
  "operation": "condition-uuid-456"  // First operation UUID
}}
```

## 🚨 Common Mistakes to Avoid

1. **Don't** create operations without a flow - create flow first
2. **Don't** use operation keys in resolve/reject - use UUIDs:

   ```json
   // ❌ WRONG - Using operation key
   "resolve": "send_email"

   // ✅ CORRECT - Using operation UUID
   "resolve": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   ```

3. **Don't** try to reference operations that don't exist yet
4. **Don't** use duplicate keys within the same flow
5. **Don't** create circular references in resolve/reject paths
6. **Don't** forget to handle both success and failure paths
7. **Don't** pass stringified JSON - use native objects
8. **Don't** leave operations at default position (0,0) - they will overlap:

   ```json
   // ❌ WRONG - Operations will overlap at origin
   "position_x": 0,
   "position_y": 0

   // ✅ CORRECT - Use proper grid positions
   "position_x": 19,  // First operation
   "position_y": 1
   ```

9. **Don't** use dot notation in condition filters:

   ```json
   // ❌ WRONG - Dot notation
   {"$trigger.payload.status": {"_eq": "published"}}

   // ✅ CORRECT - Nested objects
   {"$trigger": {"payload": {"status": {"_eq": "published"}}}}
   ```

10. **Don't** use wrong format for request operations:

    ```json
    // ❌ WRONG - Headers as object, body as object
    {
      "headers": {"Authorization": "Bearer token"},
      "body": {"data": "value"}
    }

    // ✅ CORRECT - Headers as array, body as string
    {
      "headers": [{"header": "Authorization", "value": "Bearer token"}],
      "body": "{\"data\": \"value\"}"
    }
    ```

## 🔍 Troubleshooting

### "Invalid foreign key" Errors

This typically means you're trying to reference an operation that doesn't exist:

- Verify the operation UUID exists by reading operations for the flow
- Check that you're using UUIDs (36 characters) not keys (short names)
- Ensure operations are created before being referenced

### Operation Not Executing

- Check the resolve/reject chain for breaks
- Verify the first operation is set as the flow's `operation` field
- Confirm all required operation options are provided

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
