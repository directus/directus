# v-notice

Alert banner for displaying messages, warnings, or notifications.

## Basic Usage

```json
{
	"type": "v-notice",
	"children": ["This is a notice message."]
}
```

## Props

| Prop     | Type           | Default  | Description                                             |
| -------- | -------------- | -------- | ------------------------------------------------------- |
| `type`   | string         | "normal" | Style: "normal", "info", "success", "warning", "danger" |
| `icon`   | string/boolean | varies   | Icon name or false to hide                              |
| `center` | boolean        | false    | Center the content                                      |

## Types/Variants

```json
{
	"type": "div",
	"props": { "style": "display: flex; flex-direction: column; gap: 16px;" },
	"children": [
		{
			"type": "v-notice",
			"children": ["Default notice - neutral information."]
		},
		{
			"type": "v-notice",
			"props": { "type": "info" },
			"children": ["Info notice - helpful information."]
		},
		{
			"type": "v-notice",
			"props": { "type": "success" },
			"children": ["Success notice - operation completed."]
		},
		{
			"type": "v-notice",
			"props": { "type": "warning" },
			"children": ["Warning notice - proceed with caution."]
		},
		{
			"type": "v-notice",
			"props": { "type": "danger" },
			"children": ["Danger notice - error or critical warning."]
		}
	]
}
```

## Custom Icon

```json
{
	"type": "v-notice",
	"props": { "type": "info", "icon": "lightbulb" },
	"children": ["Pro tip: You can customize the icon!"]
}
```

## No Icon

```json
{
	"type": "v-notice",
	"props": { "icon": false },
	"children": ["Notice without an icon."]
}
```

## Centered Content

```json
{
	"type": "v-notice",
	"props": { "type": "info", "center": true },
	"children": ["This content is centered."]
}
```

## With Rich Content

```json
{
	"type": "v-notice",
	"props": { "type": "warning" },
	"children": [
		{
			"type": "div",
			"children": [
				{ "type": "strong", "children": ["Important:"] },
				" This action cannot be undone. Please make sure you have a backup before proceeding."
			]
		}
	]
}
```

## Conditional Notice

```json
{
	"type": "v-notice",
	"props": { "type": "danger" },
	"condition": "state.hasError",
	"children": ["{{ state.errorMessage }}"]
}
```

```javascript
state.hasError = false;
state.errorMessage = '';

actions.submit = async () => {
	try {
		await createItem('items', state.formData);
		state.hasError = false;
	} catch (error) {
		state.hasError = true;
		state.errorMessage = error.message;
	}
};
```

## Form Validation Notice

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-notice",
			"props": { "type": "danger" },
			"condition": "state.validationErrors.length > 0",
			"children": [
				{
					"type": "div",
					"children": [
						{ "type": "strong", "children": ["Please fix the following errors:"] },
						{
							"type": "ul",
							"props": { "style": "margin: 8px 0 0 0; padding-left: 20px;" },
							"children": [
								{
									"type": "template",
									"iterate": "state.validationErrors",
									"as": "error",
									"template": {
										"type": "li",
										"children": ["{{ error }}"]
									}
								}
							]
						}
					]
				}
			]
		}
	]
}
```

## Complete Example: Status Messages

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Create Item"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-notice",
					"props": { "type": "success" },
					"condition": "state.showSuccess",
					"children": ["Item created successfully!"]
				},
				{
					"type": "v-notice",
					"props": { "type": "danger" },
					"condition": "state.showError",
					"children": ["{{ state.errorMessage }}"]
				},
				{
					"type": "v-input",
					"props": {
						"modelValue": "state.name",
						"onUpdate:modelValue": "actions.setName",
						"placeholder": "Enter name..."
					}
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": {
						"onClick": "actions.create",
						"loading": "state.isLoading"
					},
					"children": ["Create"]
				}
			]
		}
	]
}
```

```javascript
state.name = '';
state.isLoading = false;
state.showSuccess = false;
state.showError = false;
state.errorMessage = '';

actions.setName = (v) => {
	state.name = v;
};

actions.create = async () => {
	state.showSuccess = false;
	state.showError = false;
	state.isLoading = true;

	try {
		await createItem('items', { name: state.name });
		state.showSuccess = true;
		state.name = '';

		// Auto-hide success after 3 seconds
		setTimeout(() => {
			state.showSuccess = false;
		}, 3000);
	} catch (error) {
		state.showError = true;
		state.errorMessage = error.message;
	} finally {
		state.isLoading = false;
	}
};
```

## Notes

- Use appropriate `type` for the message severity
- `info` for helpful tips and information
- `success` for completed operations
- `warning` for important but non-critical messages
- `danger` for errors and critical warnings
