# v-button

Clickable button component with multiple styles and states.

## Basic Usage

```json
{
	"type": "v-button",
	"props": { "onClick": "actions.handleClick" },
	"children": ["Click Me"]
}
```

```javascript
actions.handleClick = () => {
	console.log('Button clicked!');
};
```

| Prop        | Type    | Default  | Description                                                       |
| ----------- | ------- | -------- | ----------------------------------------------------------------- |
| `kind`      | string  | "normal" | Semantic intent: "normal", "info", "success", "warning", "danger" |
| `secondary` | boolean | false    | Subset style (subdued background)                                 |
| `outlined`  | boolean | false    | Transparent background with border                                |
| `loading`   | boolean | false    | Show loading spinner                                              |
| `disabled`  | boolean | false    | Disable interaction                                               |
| `fullWidth` | boolean | false    | Take 100% container width                                         |
| `icon`      | boolean | false    | Icon-only style (removes min-width)                               |
| `onClick`   | action  | -        | Click event handler                                               |

## Semantic Kinds

Use `kind` to convey meaning without custom CSS:

- `normal`: Default primary action (Directus blue).
- `success`: Positive outcomes (Save, Create, Success).
- `info`: Helpful information or neutral actions.
- `warning`: Cautionary actions (Archive, Disable).
- `danger`: Critical or destructive actions (Delete, Reset).

## Button Styles

### Primary (Default)

```json
{
	"type": "v-button",
	"props": { "onClick": "actions.save" },
	"children": ["Save"]
}
```

### Secondary

```json
{
	"type": "v-button",
	"props": { "secondary": true, "onClick": "actions.cancel" },
	"children": ["Cancel"]
}
```

### Kind Variants

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 8px;" },
	"children": [
		{ "type": "v-button", "props": { "kind": "info" }, "children": ["Info"] },
		{ "type": "v-button", "props": { "kind": "success" }, "children": ["Success"] },
		{ "type": "v-button", "props": { "kind": "warning" }, "children": ["Warning"] },
		{ "type": "v-button", "props": { "kind": "danger" }, "children": ["Delete"] }
	]
}
```

### Outlined

```json
{
	"type": "v-button",
	"props": { "outlined": true, "onClick": "actions.edit" },
	"children": ["Edit"]
}
```

### Dashed (for "add" actions)

```json
{
	"type": "v-button",
	"props": { "dashed": true, "fullWidth": true, "onClick": "actions.addItem" },
	"children": ["+ Add Item"]
}
```

## Loading State

```json
{
	"type": "v-button",
	"props": {
		"onClick": "actions.submit",
		"loading": "state.isSubmitting",
		"disabled": "state.isSubmitting"
	},
	"children": ["Submit"]
}
```

```javascript
state.isSubmitting = false;

actions.submit = async () => {
	state.isSubmitting = true;
	try {
		await createItem('items', state.formData);
	} finally {
		state.isSubmitting = false;
	}
};
```

## With Icon

```json
{
	"type": "v-button",
	"props": { "onClick": "actions.add" },
	"children": [{ "type": "v-icon", "props": { "name": "add", "left": true } }, "Add New"]
}
```

## Icon-Only Button

```json
{
	"type": "v-button",
	"props": { "icon": true, "secondary": true, "onClick": "actions.delete" },
	"children": [{ "type": "v-icon", "props": { "name": "delete" } }]
}
```

## Button Sizes

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 8px; align-items: center;" },
	"children": [
		{ "type": "v-button", "props": { "xSmall": true }, "children": ["XSmall"] },
		{ "type": "v-button", "props": { "small": true }, "children": ["Small"] },
		{ "type": "v-button", "children": ["Normal"] },
		{ "type": "v-button", "props": { "large": true }, "children": ["Large"] },
		{ "type": "v-button", "props": { "xLarge": true }, "children": ["XLarge"] }
	]
}
```

## Full Width

```json
{
	"type": "v-button",
	"props": { "fullWidth": true, "onClick": "actions.continue" },
	"children": ["Continue"]
}
```

## Button Group

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 8px;" },
	"children": [
		{
			"type": "v-button",
			"props": { "secondary": true, "onClick": "actions.previous" },
			"children": ["Previous"]
		},
		{
			"type": "v-button",
			"props": { "onClick": "actions.next" },
			"children": ["Next"]
		}
	]
}
```

## Complete Example: Action Toolbar

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 8px; padding: 16px; background: var(--theme--background-subdued);" },
	"children": [
		{
			"type": "v-button",
			"props": { "onClick": "actions.create", "kind": "info" },
			"children": [{ "type": "v-icon", "props": { "name": "add", "left": true } }, "New"]
		},
		{
			"type": "v-button",
			"props": {
				"onClick": "actions.edit",
				"secondary": true,
				"disabled": "state.noSelection"
			},
			"children": [{ "type": "v-icon", "props": { "name": "edit", "left": true } }, "Edit"]
		},
		{
			"type": "v-button",
			"props": {
				"onClick": "actions.delete",
				"kind": "danger",
				"disabled": "state.noSelection"
			},
			"children": [{ "type": "v-icon", "props": { "name": "delete", "left": true } }, "Delete"]
		},
		{ "type": "div", "props": { "style": "flex: 1;" } },
		{
			"type": "v-button",
			"props": {
				"onClick": "actions.refresh",
				"icon": true,
				"secondary": true,
				"loading": "state.refreshing"
			},
			"children": [{ "type": "v-icon", "props": { "name": "refresh" } }]
		}
	]
}
```

```javascript
state.noSelection = true;
state.selectedId = null;
state.refreshing = false;

actions.create = () => {
	// Open create form
};

actions.edit = () => {
	if (state.selectedId) {
		// Open edit form
	}
};

actions.delete = async () => {
	if (state.selectedId) {
		await deleteItem('items', state.selectedId);
		state.selectedId = null;
		state.noSelection = true;
	}
};

actions.refresh = async () => {
	state.refreshing = true;
	try {
		await actions.loadData();
	} finally {
		state.refreshing = false;
	}
};
```

## Notes

- Use `secondary` for less important actions
- Use `kind: "danger"` for destructive actions
- Always show `loading` state during async operations
- Use `icon: true` for icon-only buttons to get proper sizing
