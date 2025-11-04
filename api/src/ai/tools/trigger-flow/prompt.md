# Directus Trigger Flow Tool

Execute flows programmatically. This tool allows you to trigger manual flows, pass data to flows, and chain flows
together for complex automation.

## 🔑 Key Concepts

- **Prerequisite**: ALWAYS read the flow first using `flows` tool to get the full definition
- **Manual Flows**: Flows with `trigger: "manual"` are designed to be triggered via UI or this tool
- **Flow Chaining**: Any flow can be triggered, receiving data in `$trigger.body`
- **Validation**: Tool validates collection support, required fields, and selection requirements

## Required Parameters

```json
{
	"flowDefinition": {}, // FULL flow object from flows.read
	"flowId": "uuid", // Flow ID to trigger
	"collection": "name", // Collection context
	"keys": ["id1"], // Item IDs (required if flow needs selection)
	"method": "POST", // GET or POST (default: GET)
	"data": {}, // Optional payload data
	"query": {}, // Optional query parameters
	"headers": {} // Optional headers
}
```

## 📋 Flow Types & Requirements

### Manual Flow with Selection

For flows with `requireSelection: true` or undefined:

```json
{
	"flowDefinition": {
		"id": "abc-123",
		"trigger": "manual",
		"options": {
			"collections": ["products", "orders"],
			"requireSelection": true,
			"fields": [
				{
					"field": "reason",
					"name": "Reason",
					"meta": { "required": true }
				}
			]
		}
	},
	"flowId": "abc-123",
	"collection": "products",
	"keys": ["prod-1", "prod-2"], // REQUIRED
	"data": {
		"reason": "Bulk update" // Required field
	}
}
```

### Manual Flow without Selection

For flows with `requireSelection: false`:

```json
{
	"flowDefinition": {
		"id": "xyz-456",
		"trigger": "manual",
		"options": {
			"collections": ["reports"],
			"requireSelection": false
		}
	},
	"flowId": "xyz-456",
	"collection": "reports",
	"keys": [], // Optional when requireSelection: false
	"data": {
		"type": "monthly"
	}
}
```

### Webhook/Operation Flows

Flows with webhook or operation triggers:

```json
{
	"flowDefinition": {
		"id": "webhook-flow",
		"trigger": "webhook",
		"options": {
			"collections": ["*"] // or specific collections
		}
	},
	"flowId": "webhook-flow",
	"collection": "any_collection",
	"method": "POST",
	"data": {
		"custom": "payload"
	},
	"headers": {
		"X-Custom-Header": "value"
	}
}
```

## 🔄 Validation Rules

The tool validates:

1. **Flow Definition**: Must provide complete flow object
2. **Flow ID Match**: Definition ID must match flowId parameter
3. **Collection Support**: Collection must be in flow's collections array
4. **Selection Required**: Keys required when `requireSelection !== false`
5. **Required Fields**: All required fields must be present in data

## ⚡ Common Workflows

### 1. Export Selected Items

```json
// Step 1: Get flow definition
flows.read({ filter: { name: { _eq: "Export Items" }}})

// Step 2: Trigger with selection
{
  "flowDefinition": { /* from step 1 */ },
  "flowId": "export-flow-id",
  "collection": "products",
  "keys": ["1", "2", "3"],
  "data": {
    "format": "csv",
    "email": "user@example.com"
  }
}
```

### 2. Process Batch Without Selection

```json
// For flows that process all items
{
	"flowDefinition": {
		/* flow with requireSelection: false */
	},
	"flowId": "batch-process",
	"collection": "orders",
	"keys": [], // Empty when not required
	"data": {
		"status": "pending",
		"date_range": "last_30_days"
	}
}
```

### 3. Chain Flows Together

```json
// Trigger a flow from another flow
{
	"flowDefinition": {
		/* operation trigger flow */
	},
	"flowId": "child-flow",
	"collection": "notifications",
	"data": {
		"parent_result": "{{ $last }}", // Data from parent flow
		"step": 2
	}
}
```

## 📊 Data Access in Triggered Flow

The triggered flow receives:

- `$trigger.body` - The `data` parameter you send
- `$trigger.query` - The `query` parameter
- `$trigger.headers` - The `headers` parameter
- `$trigger.collection` - The collection context
- `$trigger.keys` - The selected item IDs
- `$accountability` - User/permission context

## ⚠️ Important Notes

- **Read First**: ALWAYS read the flow definition before triggering
- **Collection Wildcard**: `"*"` in collections means any collection is accepted
- **Required Fields**: Check `options.fields` for required inputs
- **For-Each**: If you pass an array, flow runs once per array item
- **Response**: Flow can return data via its trigger's `return` option
- **Permissions**: Respects flow's `accountability` setting

## 🚨 Common Mistakes to Avoid

1. **Don't** trigger without reading flow definition first
2. **Don't** omit keys when flow requires selection
3. **Don't** ignore required fields in flow configuration
4. **Don't** use wrong collection not in flow's collections list
5. **Don't** assume `requireSelection` - check explicitly
6. **Don't** pass stringified JSON - use native objects

## Decision Tree

```
1. Read flow definition using flows tool
2. Check trigger type:
   - manual → Check requireSelection
   - webhook/operation → Keys optional
3. Validate collection in flow.options.collections
4. If requireSelection !== false → keys required
5. Check flow.options.fields for required data fields
6. Trigger with all validated parameters
```
