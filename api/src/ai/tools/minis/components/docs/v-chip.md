# v-chip

Compact element for tags, selections, or filters.

## Basic Usage

```json
{
	"type": "v-chip",
	"children": ["Tag"]
}
```

## Props

| Prop       | Type    | Default | Description           |
| ---------- | ------- | ------- | --------------------- |
| `active`   | boolean | false   | Active/selected state |
| `close`    | boolean | false   | Show close button     |
| `onClose`  | action  | -       | Close button handler  |
| `onClick`  | action  | -       | Click handler         |
| `disabled` | boolean | false   | Disable the chip      |
| `outlined` | boolean | false   | Outline style         |
| `label`    | boolean | false   | Squared corners       |
| `small`    | boolean | false   | Small size            |
| `xSmall`   | boolean | false   | Extra small size      |
| `large`    | boolean | false   | Large size            |

## With Close Button

```json
{
	"type": "v-chip",
	"props": { "close": true, "onClose": "actions.removeTag" },
	"children": ["Removable"]
}
```

```javascript
actions.removeTag = () => {
	// Handle removal
};
```

## Outlined Style

```json
{
	"type": "v-chip",
	"props": { "outlined": true },
	"children": ["Outlined"]
}
```

## Active/Selected State

```json
{
	"type": "v-chip",
	"props": {
		"active": "state.isSelected",
		"onClick": "actions.toggleSelection"
	},
	"children": ["Selectable"]
}
```

```javascript
state.isSelected = false;

actions.toggleSelection = () => {
	state.isSelected = !state.isSelected;
};
```

## Sizes

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 8px; align-items: center;" },
	"children": [
		{ "type": "v-chip", "props": { "xSmall": true }, "children": ["XSmall"] },
		{ "type": "v-chip", "props": { "small": true }, "children": ["Small"] },
		{ "type": "v-chip", "children": ["Normal"] },
		{ "type": "v-chip", "props": { "large": true }, "children": ["Large"] }
	]
}
```

## Tag List

```json
{
	"type": "div",
	"props": { "style": "display: flex; flex-wrap: wrap; gap: 8px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.tags",
			"as": "tag",
			"template": {
				"type": "v-chip",
				"props": {
					"close": true,
					"onClose": "() => actions.removeTag(tag)"
				},
				"children": ["{{ tag }}"]
			}
		}
	]
}
```

```javascript
state.tags = ['Design', 'Development', 'Marketing'];

actions.removeTag = (tag) => {
	state.tags = state.tags.filter((t) => t !== tag);
};
```

## Filter Chips

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 8px; margin-bottom: 16px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.filters",
			"as": "filter",
			"template": {
				"type": "v-chip",
				"props": {
					"active": "state.activeFilters.includes(filter.value)",
					"onClick": "() => actions.toggleFilter(filter.value)",
					"outlined": true
				},
				"children": ["{{ filter.label }}"]
			}
		}
	]
}
```

```javascript
state.filters = [
	{ value: 'active', label: 'Active' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'completed', label: 'Completed' },
];
state.activeFilters = [];

actions.toggleFilter = (value) => {
	if (state.activeFilters.includes(value)) {
		state.activeFilters = state.activeFilters.filter((f) => f !== value);
	} else {
		state.activeFilters = [...state.activeFilters, value];
	}
	actions.applyFilters();
};
```

## Semantic Status Patterns

Since `v-chip` does not support a `kind` prop, use the following pattern for semantic status indicators:

```json
{
	"type": "v-chip",
	"props": {
		"small": true,
		"style": "background: var(--theme--success); color: white;"
	},
	"children": ["Active"]
}
```

### Dynamic Component Pattern (Recommended)

**Script**:

```javascript
state.status = 'active';
const statusConfig = {
	active: { label: 'Active', color: 'var(--theme--success)' },
	pending: { label: 'Pending', color: 'var(--theme--warning)' },
	danger: { label: 'Error', color: 'var(--theme--danger)' },
};
state.currentStatus = statusConfig[state.status];
```

**Schema**:

```json
{
	"type": "v-chip",
	"props": {
		"small": true,
		"style": "background: {{ state.currentStatus.color }}; color: white;"
	},
	"children": ["{{ state.currentStatus.label }}"]
}
```

## Complete Example: Article Tags Editor

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Article Tags"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;" },
					"children": [
						{
							"type": "template",
							"iterate": "state.selectedTags",
							"as": "tag",
							"template": {
								"type": "v-chip",
								"props": {
									"close": true,
									"onClose": "() => actions.removeTag(tag.id)"
								},
								"children": ["{{ tag.name }}"]
							}
						}
					]
				},
				{
					"type": "v-select",
					"props": {
						"modelValue": "state.newTag",
						"onUpdate:modelValue": "actions.setNewTag",
						"items": "state.availableTags",
						"itemText": "name",
						"itemValue": "id",
						"placeholder": "Add a tag..."
					}
				}
			]
		}
	]
}
```

```javascript
state.selectedTags = [];
state.availableTags = [];
state.newTag = null;

actions.init = async () => {
	state.availableTags = await readItems('tags');
};

actions.setNewTag = (tagId) => {
	if (tagId) {
		const tag = state.availableTags.find((t) => t.id === tagId);
		if (tag && !state.selectedTags.find((t) => t.id === tagId)) {
			state.selectedTags = [...state.selectedTags, tag];
		}
	}
	state.newTag = null;
};

actions.removeTag = (tagId) => {
	state.selectedTags = state.selectedTags.filter((t) => t.id !== tagId);
};
```

## Notes

- Use `close` for removable chips
- Use `active` for selectable filter chips
- Use `outlined` for less prominent appearance
- Chips work well in flex containers with `gap` for spacing
