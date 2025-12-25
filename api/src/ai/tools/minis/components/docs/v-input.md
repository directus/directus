# v-input

Text input field for single-line text, numbers, passwords, etc.

## Basic Usage

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.name",
		"onUpdate:modelValue": "actions.setName",
		"placeholder": "Enter your name"
	}
}
```

```javascript
state.name = '';

actions.setName = (value) => {
	state.name = value;
};
```

## Props

| Prop                  | Type          | Default  | Description                                                     |
| --------------------- | ------------- | -------- | --------------------------------------------------------------- |
| `modelValue`          | string/number | null     | Current value                                                   |
| `onUpdate:modelValue` | action        | required | Value change handler                                            |
| `placeholder`         | string        | null     | Placeholder text                                                |
| `type`                | string        | "text"   | Input type: "text", "password", "email", "number", "url", "tel" |
| `disabled`            | boolean       | false    | Disable the input                                               |
| `autofocus`           | boolean       | false    | Focus on mount                                                  |
| `prefix`              | string        | null     | Text before input                                               |
| `suffix`              | string        | null     | Text after input                                                |
| `maxLength`           | number        | null     | Maximum characters                                              |
| `min`                 | number        | null     | Minimum value (for number type)                                 |
| `max`                 | number        | null     | Maximum value (for number type)                                 |
| `step`                | number        | null     | Step increment (for number type)                                |
| `nullable`            | boolean       | false    | Allow clearing to null                                          |
| `trim`                | boolean       | false    | Trim whitespace                                                 |
| `slug`                | boolean       | false    | Convert to URL-safe slug                                        |
| `small`               | boolean       | false    | Smaller size                                                    |
| `fullWidth`           | boolean       | true     | Take full container width                                       |

## Input Types

### Text (Default)

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.text",
		"onUpdate:modelValue": "actions.setText",
		"placeholder": "Enter text"
	}
}
```

### Password

```json
{
	"type": "v-input",
	"props": {
		"type": "password",
		"modelValue": "state.password",
		"onUpdate:modelValue": "actions.setPassword",
		"placeholder": "Enter password"
	}
}
```

### Email

```json
{
	"type": "v-input",
	"props": {
		"type": "email",
		"modelValue": "state.email",
		"onUpdate:modelValue": "actions.setEmail",
		"placeholder": "email@example.com"
	}
}
```

### Number

```json
{
	"type": "v-input",
	"props": {
		"type": "number",
		"modelValue": "state.quantity",
		"onUpdate:modelValue": "actions.setQuantity",
		"min": 0,
		"max": 100,
		"step": 1,
		"placeholder": "0"
	}
}
```

## With Prefix/Suffix

### Currency

```json
{
	"type": "v-input",
	"props": {
		"type": "number",
		"modelValue": "state.price",
		"onUpdate:modelValue": "actions.setPrice",
		"prefix": "$",
		"min": 0,
		"step": 0.01
	}
}
```

### URL

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.domain",
		"onUpdate:modelValue": "actions.setDomain",
		"prefix": "https://",
		"suffix": ".com"
	}
}
```

### Units

```json
{
	"type": "v-input",
	"props": {
		"type": "number",
		"modelValue": "state.weight",
		"onUpdate:modelValue": "actions.setWeight",
		"suffix": "kg"
	}
}
```

## Slug Input

Automatically converts text to URL-safe slug:

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.slug",
		"onUpdate:modelValue": "actions.setSlug",
		"slug": true,
		"placeholder": "url-friendly-slug"
	}
}
```

## Small Size

```json
{
	"type": "v-input",
	"props": {
		"modelValue": "state.search",
		"onUpdate:modelValue": "actions.setSearch",
		"small": true,
		"placeholder": "Search..."
	}
}
```

## Complete Example: Search Form

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Search"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "display: flex; gap: 8px;" },
					"children": [
						{
							"type": "v-input",
							"props": {
								"modelValue": "state.searchQuery",
								"onUpdate:modelValue": "actions.setQuery",
								"placeholder": "Search items...",
								"autofocus": true
							}
						},
						{
							"type": "v-button",
							"props": { "onClick": "actions.search" },
							"children": ["Search"]
						}
					]
				}
			]
		},
		{
			"type": "v-card-text",
			"condition": "state.hasResults",
			"children": ["Found {{ state.results.length }} results"]
		}
	]
}
```

```javascript
state.searchQuery = '';
state.results = [];
state.hasResults = false;

actions.setQuery = (value) => {
	state.searchQuery = value;
};

actions.search = async () => {
	if (!state.searchQuery.trim()) return;

	state.results = await readItems('articles', {
		filter: {
			title: { _contains: state.searchQuery },
		},
	});

	state.hasResults = state.results.length > 0;
};
```

## Notes

- Always use `modelValue` + `onUpdate:modelValue` pattern (not v-model)
- For multi-line text, use `v-textarea` instead
- The `nullable` prop allows clearing the input to null (vs empty string)
