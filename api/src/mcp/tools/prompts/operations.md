Perform CRUD on Directus Operations within Flows. Operations are individual actions that execute sequentially in a flow,
processing and transforming data through the data chain.

<key_concepts>
- **Operations** are the building blocks of flows
- Each operation has a unique `key` that identifies it in the data chain
- Operations connect via `resolve` (success) and `reject` (failure) paths
- Data from each operation is stored under its key in the data chain
</key_concepts>

<uuid_vs_keys>
## UUID vs Keys - Critical Distinction

**UUIDs** (System identifiers): `"abc-123-def-456"`

- Use in: `resolve`, `reject`, `flow`, operation `key` field in CRUD
- Generated automatically when operations are created
- Required for connecting operations

**Keys** (Human-readable names): `"send_email"`, `"check_status"`

- Use in: Data chain variables `{{ operation_key }}`
- You define these when creating operations
- Used to access operation results in subsequent operations
</uuid_vs_keys>

<critical_syntax>
## Critical Syntax Rules - MEMORIZE THESE

**Condition Filters**: Use nested objects, NEVER dot notation

- ❌ `"$trigger.payload.status"`
- ✅ `{"$trigger": {"payload": {"status": {"_eq": "published"}}}}`

**Request Headers**: Array of objects, NOT simple objects

- ❌ `{"Authorization": "Bearer token"}`
- ✅ `[{"header": "Authorization", "value": "Bearer token"}]`

**Request Body**: Stringified JSON, NOT native objects

- ❌ `"body": {"data": "value"}`
- ✅ `"body": "{\"data\": \"value\"}"`

**Data Chain Variables**: Use operation keys, avoid `$last`

- ❌ `{{ $last }}` (breaks when reordered)
- ✅ `{{ operation_key }}` (reliable)
</critical_syntax>

<required_fields>
## Required Fields Summary

**All Operations:**

- `flow` - UUID of parent flow
- `key` - Unique operation identifier
- `type` - Operation type
- `position_x`, `position_y` - Grid coordinates
- `resolve`, `reject` - Next operation UUIDs (null initially)
</required_fields>

<available_operations> Core operations available in Directus:
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

If user has installed extensions from the Directus Marketplace, there may be more operations available than this. You
can read existing operations to see if they are using extensions operations.
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

<workflow_creation>
## Workflow Creation Process

**Critical Order:** Create flow first → Create operations with null resolve/reject → Link operations via UUIDs → Update flow entry point.

**See `flows` tool for complete workflow example with detailed steps.**
</workflow_creation>

<positioning_system>
## Grid Positioning

**Rules:** 14x14 units, spacing every 18 units (example 19/37/55/73). Never (0,0). Start `position_y: 1`.

**Patterns:** Linear (19,1)→(37,1)→(55,1). Branching: success (37,1), error (37,19).
</positioning_system>

<operation_examples>
**condition** - Evaluates filter rules

```json
{"type": "condition", "options": {"filter": {"$trigger": {"payload": {"status": {"_eq": "published"}}}}}}
// Multiple: {"_and": [{"status": {"_eq": "published"}}, {"featured": {"_eq": true}}]}
```

**item-create/read/update/delete** - CRUD operations

```json
{"type": "item-create", "options": {"collection": "notifications", "permissions": "$trigger", "payload": {"title": "{{ $trigger.payload.title }}"}}}
{"type": "item-read", "options": {"collection": "products", "query": {"filter": {"status": {"_eq": "active"}}}}}
{"type": "item-update", "options": {"collection": "orders", "key": "{{ $trigger.payload.id }}", "payload": {"status": "processed"}}}
{"type": "item-delete", "options": {"collection": "temp_data", "key": ["{{ read_items[0].id }}"]}}
```

**exec** - Custom JavaScript/TypeScript (sandboxed, no file/network access)

```json
{"type": "exec", "options": {"code": "module.exports = async function(data) {\n  const result = data.$trigger.payload.value * 2;\n  return { result, processed: true };\n}"}}
```

**mail** - Send email (markdown/wysiwyg/template)

```json
{"type": "mail", "options": {"to": ["user@example.com"], "subject": "Order Confirmation", "body": "Order {{ $trigger.payload.order_id }}"}}
// Template: {"type": "template", "template": "welcome-email", "data": {"username": "{{ $trigger.payload.name }}"}}
```

**notification** - In-app notifications

```json
{"type": "notification", "options": {"recipient": ["{{ $accountability.user }}"], "subject": "Task Complete", "message": "Export ready"}}
```

**request** - HTTP requests (headers must be array of objects, body as stringified JSON)

```json
{"type": "request", "options": {
  "method": "POST", "url": "https://api.example.com/webhook",
  "headers": [{"header": "Authorization", "value": "Bearer {{ $env.API_TOKEN }}"}],
  "body": "{\"data\": \"{{ process_data }}\"}"
}}
```

**json-web-token** - Sign/verify/decode JWT

```json
{"type": "json-web-token", "options": {"operation": "sign", "payload": {"userId": "{{ $trigger.payload.user }}"}, "secret": "{{ $env.JWT_SECRET }}", "options": {"expiresIn": "1h"}}}
// Verify: {"operation": "verify", "token": "{{ $trigger.payload.token }}", "secret": "{{ $env.JWT_SECRET }}"}
```

**transform** - Create custom JSON payloads

```json
{"type": "transform", "options": {"json": {"combined": {"user": "{{ $accountability.user }}", "items": "{{ read_items }}"}}}}
```

**trigger** - Execute another flow

```json
{"type": "trigger", "options": {"flow": "flow-uuid", "payload": {"data": "{{ transform_result }}"}, "iterationMode": "parallel"}}
```

**sleep/log/throw-error** - Utilities

```json
{"type": "sleep", "options": {"milliseconds": 5000}}
{"type": "log", "options": {"message": "Processing {{ $trigger.payload.id }}"}}
{"type": "throw-error", "options": {"code": "CUSTOM_ERROR", "status": "400", "message": "Invalid data"}}
```
</operation_examples>

<data_chain_variables>
**Data Chain:** Use `{{ operation_key }}` to access results, `{{ $trigger.payload }}` for trigger data. Avoid `{{ $last }}` (breaks when reordered). See `flows` tool for complete syntax.
</data_chain_variables>

<permission_options> For operations that support permissions:
- `$trigger` - Use permissions from the triggering context (default)
- `$public` - Use public role permissions
- `$full` - Use full system permissions
- `role-uuid` - Use specific role's permissions
</permission_options>


<common_mistakes>
1. Create flow first, never operations without flow
2. Use UUIDs in resolve/reject, NOT keys
3. Create operations before referencing them
4. No duplicate keys within same flow
5. Avoid circular resolve/reject references
6. Set positions (not 0,0)
7. Use nested objects in filters, NOT dot notation
8. Request headers as array of objects, body as stringified JSON
9. Pass native objects in data (except request body)
10. ALWAYS pass native objects in data (EXCEPTIONS: - request body for `request` operation - code in `exec` operations)
11. No `$NOW` variable - use exec operation: `return { now: new Date().toISOString() };`
</common_mistakes>

<troubleshooting>
**Invalid foreign key:** Operation UUID doesn't exist. Use UUIDs (36 chars), not keys. Create operations before referencing.
**Not executing:** Check resolve/reject chain, verify flow.operation set, confirm required options provided.
**Overlapping (0,0):** Update positions: `{"action": "update", "key": "uuid", "data": {"position_x": 19, "position_y": 1}}`
</troubleshooting>
