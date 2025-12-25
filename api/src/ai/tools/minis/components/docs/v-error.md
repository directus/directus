# v-error

Error display component for showing error states and messages.

## Basic Usage

```json
{
	"type": "v-error",
	"props": { "error": "state.error" }
}
```

## Props

| Prop    | Type          | Default | Description             |
| ------- | ------------- | ------- | ----------------------- |
| `error` | object/string | null    | Error object or message |

## Simple Error Message

```json
{
	"type": "v-error",
	"props": { "error": "Something went wrong" },
	"condition": "state.hasError"
}
```

## Error Object

```json
{
	"type": "v-error",
	"props": { "error": "state.errorObject" },
	"condition": "state.errorObject"
}
```

```javascript
state.errorObject = null;

actions.loadData = async () => {
	try {
		state.data = await readItems('items');
		state.errorObject = null;
	} catch (error) {
		state.errorObject = error;
	}
};
```

## Error with Retry

```json
{
	"type": "div",
	"condition": "state.error",
	"children": [
		{
			"type": "v-error",
			"props": { "error": "state.error" }
		},
		{
			"type": "v-button",
			"props": {
				"onClick": "actions.retry",
				"secondary": true,
				"style": "margin-top: 16px;"
			},
			"children": [{ "type": "v-icon", "props": { "name": "refresh", "left": true } }, "Try Again"]
		}
	]
}
```

```javascript
state.error = null;
state.data = null;

actions.loadData = async () => {
	state.error = null;
	try {
		state.data = await readItems('items');
	} catch (error) {
		state.error = error;
	}
};

actions.retry = () => {
	actions.loadData();
};
```

## v-error vs v-notice

| Feature  | v-error                   | v-notice                             |
| -------- | ------------------------- | ------------------------------------ |
| Purpose  | Display caught errors     | Display messages/alerts              |
| Input    | Error object or string    | String content                       |
| Styling  | Error-specific formatting | Multiple types (info, warning, etc.) |
| Best for | API errors, exceptions    | User-facing messages                 |

For user-facing messages, prefer `v-notice` with `type="danger"`:

```json
{
	"type": "v-notice",
	"props": { "type": "danger" },
	"children": ["Please fill in all required fields."]
}
```

## Complete Example: Data Fetch with Error Handling

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Items"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "display: flex; justify-content: center; padding: 40px;" },
					"condition": "state.isLoading",
					"children": [{ "type": "v-progress-circular", "props": { "indeterminate": true } }]
				},
				{
					"type": "div",
					"condition": "state.error && !state.isLoading",
					"children": [
						{
							"type": "v-error",
							"props": { "error": "state.error" }
						},
						{
							"type": "div",
							"props": { "style": "display: flex; justify-content: center; margin-top: 16px;" },
							"children": [
								{
									"type": "v-button",
									"props": { "onClick": "actions.loadData", "secondary": true },
									"children": ["Retry"]
								}
							]
						}
					]
				},
				{
					"type": "v-list",
					"condition": "!state.error && !state.isLoading",
					"children": [
						{
							"type": "template",
							"iterate": "state.items",
							"as": "item",
							"template": {
								"type": "v-list-item",
								"children": [{ "type": "v-list-item-content", "children": ["{{ item.name }}"] }]
							}
						}
					]
				},
				{
					"type": "v-info",
					"props": { "center": true },
					"condition": "!state.error && !state.isLoading && state.items.length === 0",
					"children": ["No items found."]
				}
			]
		}
	]
}
```

```javascript
state.items = [];
state.isLoading = false;
state.error = null;

actions.init = () => {
	actions.loadData();
};

actions.loadData = async () => {
	state.isLoading = true;
	state.error = null;

	try {
		state.items = await readItems('items');
	} catch (error) {
		state.error = error;
	} finally {
		state.isLoading = false;
	}
};
```

## v-error-boundary

For catching errors in child components:

```json
{
	"type": "v-error-boundary",
	"children": [
		{
			"type": "div",
			"children": ["Content that might error"]
		}
	]
}
```

This catches render errors in children and displays an error state instead of crashing.

## Notes

- Use `v-error` to display caught API or runtime errors
- Use `v-notice` with `type="danger"` for user-facing validation messages
- Always provide a retry mechanism when showing errors
- Consider showing different error messages for different error types
