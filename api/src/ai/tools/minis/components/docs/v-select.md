# v-select

Dropdown select component for choosing from a list of options.

## Basic Usage

```json
{
	"type": "v-select",
	"props": {
		"items": [
			{ "text": "Option 1", "value": "opt1" },
			{ "text": "Option 2", "value": "opt2" },
			{ "text": "Option 3", "value": "opt3" }
		],
		"modelValue": "state.selectedValue",
		"onUpdate:modelValue": "actions.setSelected",
		"placeholder": "Select an option..."
	}
}
```

**Required Script:**

```javascript
state.selectedValue = null; // or 'opt1' for default

actions.setSelected = (value) => {
	state.selectedValue = value;
};
```

## Props

| Prop                  | Type                | Default    | Description                         |
| --------------------- | ------------------- | ---------- | ----------------------------------- |
| `items`               | Array               | required   | Array of options (see format below) |
| `modelValue`          | string/number/array | null       | Currently selected value(s)         |
| `onUpdate:modelValue` | action              | required   | Handler for selection changes       |
| `placeholder`         | string              | null       | Text shown when nothing selected    |
| `disabled`            | boolean             | false      | Disable the select                  |
| `multiple`            | boolean             | false      | Allow multiple selections           |
| `allowOther`          | boolean             | false      | Allow custom values                 |
| `showDeselect`        | boolean             | false      | Show clear button                   |
| `itemText`            | string              | "text"     | Key in items for display text       |
| `itemValue`           | string              | "value"    | Key in items for value              |
| `itemIcon`            | string              | null       | Key in items for icon               |
| `itemDisabled`        | string              | "disabled" | Key in items for disabled state     |

## Items Format

### Simple Array

```json
{
	"items": ["Option A", "Option B", "Option C"]
}
```

When using simple strings, both text and value are the string itself.

### Object Array (Recommended)

```json
{
	"items": [
		{ "text": "Active", "value": "active" },
		{ "text": "Inactive", "value": "inactive" },
		{ "text": "Pending", "value": "pending", "disabled": true }
	]
}
```

### With Icons

```json
{
	"items": [
		{ "text": "Users", "value": "users", "icon": "people" },
		{ "text": "Settings", "value": "settings", "icon": "settings" },
		{ "text": "Files", "value": "files", "icon": "folder" }
	],
	"itemIcon": "icon"
}
```

### Nested Groups

```json
{
	"items": [
		{
			"text": "Fruits",
			"value": "fruits",
			"children": [
				{ "text": "Apple", "value": "apple" },
				{ "text": "Banana", "value": "banana" }
			]
		},
		{
			"text": "Vegetables",
			"value": "vegetables",
			"children": [
				{ "text": "Carrot", "value": "carrot" },
				{ "text": "Broccoli", "value": "broccoli" }
			]
		}
	],
	"itemChildren": "children"
}
```

## Multiple Selection

```json
{
	"type": "v-select",
	"props": {
		"items": [
			{ "text": "Red", "value": "red" },
			{ "text": "Green", "value": "green" },
			{ "text": "Blue", "value": "blue" }
		],
		"modelValue": "state.selectedColors",
		"onUpdate:modelValue": "actions.setColors",
		"multiple": true,
		"placeholder": "Select colors..."
	}
}
```

**Script:**

```javascript
state.selectedColors = []; // Array for multiple

actions.setColors = (values) => {
	state.selectedColors = values;
};
```

## Dynamic Items from API

```javascript
state.users = [];
state.selectedUser = null;

actions.init = async () => {
	const users = await readItems('directus_users', {
		fields: ['id', 'first_name', 'last_name'],
	});

	// Transform to select format
	state.users = users.map((u) => ({
		text: `${u.first_name} ${u.last_name}`,
		value: u.id,
	}));
};

actions.setUser = (value) => {
	state.selectedUser = value;
};
```

```json
{
	"type": "v-select",
	"props": {
		"items": "state.users",
		"modelValue": "state.selectedUser",
		"onUpdate:modelValue": "actions.setUser",
		"placeholder": "Select a user..."
	}
}
```

## Complete Example: Status Filter

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "v-card-title",
			"children": ["Filter by Status"]
		},
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-select",
					"props": {
						"items": [
							{ "text": "All", "value": null },
							{ "text": "Published", "value": "published" },
							{ "text": "Draft", "value": "draft" },
							{ "text": "Archived", "value": "archived" }
						],
						"modelValue": "state.statusFilter",
						"onUpdate:modelValue": "actions.setFilter",
						"placeholder": "Filter status..."
					}
				}
			]
		},
		{
			"type": "v-card-text",
			"children": ["Selected: {{ state.statusFilter }}"]
		}
	]
}
```

```javascript
state.statusFilter = null;

actions.setFilter = (value) => {
	state.statusFilter = value;
	// Could trigger a data refresh here
	actions.loadData();
};

actions.loadData = async () => {
	const filter = state.statusFilter ? { status: { _eq: state.statusFilter } } : {};

	state.items = await readItems('articles', { filter });
};
```
