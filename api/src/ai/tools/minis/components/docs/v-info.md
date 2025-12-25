# v-info

Sidebar information panel with icon and optional title.

## Basic Usage

```json
{
	"type": "v-info",
	"props": { "title": "Information" },
	"children": ["This is additional information about the current context."]
}
```

## Props

| Prop        | Type    | Default | Description                                   |
| ----------- | ------- | ------- | --------------------------------------------- |
| `title`     | string  | null    | Title text                                    |
| `type`      | string  | "info"  | Style: "info", "success", "warning", "danger" |
| `icon`      | string  | varies  | Icon name                                     |
| `center`    | boolean | false   | Center the content                            |
| `clickable` | boolean | false   | Show as clickable                             |

## Types

```json
{
	"type": "div",
	"props": { "style": "display: grid; gap: 16px;" },
	"children": [
		{
			"type": "v-info",
			"props": { "type": "info", "title": "Info" },
			"children": ["General information message."]
		},
		{
			"type": "v-info",
			"props": { "type": "success", "title": "Success" },
			"children": ["Operation completed successfully."]
		},
		{
			"type": "v-info",
			"props": { "type": "warning", "title": "Warning" },
			"children": ["Please review before continuing."]
		},
		{
			"type": "v-info",
			"props": { "type": "danger", "title": "Error" },
			"children": ["Something went wrong."]
		}
	]
}
```

## Custom Icon

```json
{
	"type": "v-info",
	"props": {
		"title": "Pro Tip",
		"icon": "lightbulb",
		"type": "info"
	},
	"children": ["You can use keyboard shortcuts for faster navigation."]
}
```

## Without Title

```json
{
	"type": "v-info",
	"props": { "type": "warning" },
	"children": ["This field is required."]
}
```

## Centered Content

```json
{
	"type": "v-info",
	"props": { "title": "No Results", "center": true },
	"children": ["No items match your search criteria."]
}
```

## v-info vs v-notice

| Feature  | v-info                       | v-notice              |
| -------- | ---------------------------- | --------------------- |
| Layout   | Sidebar icon + content       | Full-width banner     |
| Title    | Supports title prop          | No built-in title     |
| Use case | Contextual help, field hints | Alerts, form messages |
| Visual   | More subtle/inline           | More prominent        |

## Field Help Text

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-input",
			"props": {
				"modelValue": "state.email",
				"onUpdate:modelValue": "actions.setEmail",
				"placeholder": "Enter email address"
			}
		},
		{
			"type": "v-info",
			"props": { "type": "info", "icon": "help" },
			"children": ["We'll never share your email with third parties."]
		}
	]
}
```

## Complete Example: Feature Explanation

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["API Settings"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-info",
					"props": { "title": "API Key", "type": "info" },
					"children": [
						"Your API key is used to authenticate requests to the API. Keep it secure and never share it publicly."
					]
				},
				{
					"type": "div",
					"props": { "style": "margin-top: 16px;" },
					"children": [
						{
							"type": "v-input",
							"props": {
								"modelValue": "state.apiKey",
								"onUpdate:modelValue": "actions.setApiKey",
								"type": "password",
								"placeholder": "Enter API key"
							}
						}
					]
				},
				{
					"type": "v-info",
					"props": { "type": "warning", "title": "Security Notice" },
					"condition": "state.apiKey.length > 0",
					"children": ["Make sure to store this key securely. You won't be able to see it again."]
				}
			]
		}
	]
}
```

```javascript
state.apiKey = '';

actions.setApiKey = (v) => {
	state.apiKey = v;
};
```

## Notes

- Use `v-info` for contextual help and explanations
- Use `v-notice` for alerts and status messages
- The sidebar icon layout makes it good for inline help
- Pair with form inputs to explain field requirements
