# v-card

Card container component with optional title, subtitle, content, and actions sections.

## Components

| Component         | Description                          |
| ----------------- | ------------------------------------ |
| `v-card`          | Main card container                  |
| `v-card-title`    | Card header/title                    |
| `v-card-subtitle` | Secondary title below the main title |
| `v-card-text`     | Main content area                    |
| `v-card-actions`  | Footer area for buttons/actions      |

## Basic Usage

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Card Title"] },
		{ "type": "v-card-text", "children": ["Card content goes here."] },
		{
			"type": "v-card-actions",
			"children": [
				{ "type": "v-button", "props": { "secondary": true }, "children": ["Cancel"] },
				{ "type": "v-button", "children": ["Save"] }
			]
		}
	]
}
```

## v-card Props

| Prop       | Type    | Default | Description                             |
| ---------- | ------- | ------- | --------------------------------------- |
| `disabled` | boolean | false   | Dims the card and disables interactions |
| `tile`     | boolean | false   | Removes border radius (square corners)  |

## With Subtitle

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["User Profile"] },
		{ "type": "v-card-subtitle", "children": ["Last updated: {{ state.lastUpdated }}"] },
		{ "type": "v-card-text", "children": ["Profile content..."] }
	]
}
```

## Disabled State

```json
{
	"type": "v-card",
	"props": { "disabled": "state.isLoading" },
	"children": [
		{ "type": "v-card-title", "children": ["Processing..."] },
		{ "type": "v-card-text", "children": [{ "type": "v-progress-linear", "props": { "indeterminate": true } }] }
	]
}
```

## Card Grid Layout

```json
{
	"type": "div",
	"props": { "style": "display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.items",
			"as": "item",
			"template": {
				"type": "v-card",
				"children": [
					{ "type": "v-card-title", "children": ["{{ item.title }}"] },
					{ "type": "v-card-text", "children": ["{{ item.description }}"] },
					{
						"type": "v-card-actions",
						"children": [
							{
								"type": "v-button",
								"props": { "secondary": true, "onClick": "actions.viewItem" },
								"children": ["View"]
							}
						]
					}
				]
			}
		}
	]
}
```

## Complete Example: Item Editor Card

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Edit Item"] },
		{ "type": "v-card-subtitle", "children": ["ID: {{ state.itemId }}"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-input",
					"props": {
						"modelValue": "state.title",
						"onUpdate:modelValue": "actions.setTitle",
						"placeholder": "Title"
					}
				},
				{
					"type": "v-textarea",
					"props": {
						"modelValue": "state.description",
						"onUpdate:modelValue": "actions.setDescription",
						"placeholder": "Description"
					}
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": { "secondary": true, "onClick": "actions.cancel" },
					"children": ["Cancel"]
				},
				{
					"type": "v-button",
					"props": { "onClick": "actions.save", "loading": "state.saving" },
					"children": ["Save"]
				}
			]
		}
	]
}
```

```javascript
state.itemId = null;
state.title = '';
state.description = '';
state.saving = false;

actions.setTitle = (v) => {
	state.title = v;
};
actions.setDescription = (v) => {
	state.description = v;
};

actions.init = async () => {
	// Load item if editing
	const item = await readItem('items', state.itemId);
	state.title = item.title;
	state.description = item.description;
};

actions.save = async () => {
	state.saving = true;
	try {
		await updateItem('items', state.itemId, {
			title: state.title,
			description: state.description,
		});
	} finally {
		state.saving = false;
	}
};

actions.cancel = () => {
	// Reset to original values
	actions.init();
};
```

## Styling Notes

- Cards have automatic padding and shadow
- Use `v-card-text` for proper content padding
- `v-card-actions` automatically right-aligns buttons
- Multiple `v-card-text` sections can be used for separated content areas
