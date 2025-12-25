# v-detail

Collapsible/expandable section component for organizing content into toggleable panels.

## Basic Usage

```json
{
	"type": "v-detail",
	"props": {
		"label": "Advanced Options"
	},
	"children": [
		{ "type": "p", "children": ["This content is hidden by default."] },
		{ "type": "p", "children": ["Click the header to expand/collapse."] }
	]
}
```

## Props

| Prop                  | Type    | Default  | Description                               |
| --------------------- | ------- | -------- | ----------------------------------------- |
| `label`               | string  | required | Header text shown when collapsed/expanded |
| `modelValue`          | boolean | false    | Whether the detail is expanded            |
| `onUpdate:modelValue` | action  | -        | Handler for expand/collapse               |
| `startOpen`           | boolean | false    | Start in expanded state                   |
| `disabled`            | boolean | false    | Disable expand/collapse                   |

## Controlled Expansion

```json
{
	"type": "v-detail",
	"props": {
		"label": "Settings",
		"modelValue": "state.settingsOpen",
		"onUpdate:modelValue": "actions.toggleSettings"
	},
	"children": [{ "type": "p", "children": ["Settings content here..."] }]
}
```

```javascript
state.settingsOpen = false;

actions.toggleSettings = (isOpen) => {
	state.settingsOpen = isOpen;
};
```

## Start Expanded

```json
{
	"type": "v-detail",
	"props": {
		"label": "Important Information",
		"startOpen": true
	},
	"children": [{ "type": "v-notice", "props": { "type": "warning" }, "children": ["Please read this!"] }]
}
```

## Multiple Accordion Sections

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-detail",
			"props": { "label": "Section 1" },
			"children": [{ "type": "p", "children": ["Content 1"] }]
		},
		{
			"type": "v-detail",
			"props": { "label": "Section 2" },
			"children": [{ "type": "p", "children": ["Content 2"] }]
		},
		{
			"type": "v-detail",
			"props": { "label": "Section 3" },
			"children": [{ "type": "p", "children": ["Content 3"] }]
		}
	]
}
```

## Accordion Pattern (Only One Open)

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-detail",
			"props": {
				"label": "General",
				"modelValue": "state.generalOpen",
				"onUpdate:modelValue": "actions.openGeneral"
			},
			"children": [{ "type": "p", "children": ["General settings..."] }]
		},
		{
			"type": "v-detail",
			"props": {
				"label": "Advanced",
				"modelValue": "state.advancedOpen",
				"onUpdate:modelValue": "actions.openAdvanced"
			},
			"children": [{ "type": "p", "children": ["Advanced settings..."] }]
		},
		{
			"type": "v-detail",
			"props": {
				"label": "Danger Zone",
				"modelValue": "state.dangerOpen",
				"onUpdate:modelValue": "actions.openDanger"
			},
			"children": [{ "type": "v-notice", "props": { "type": "danger" }, "children": ["Destructive actions here"] }]
		}
	]
}
```

```javascript
state.generalOpen = true; // Start with first open
state.advancedOpen = false;
state.dangerOpen = false;

// Close others when one opens
actions.openGeneral = (isOpen) => {
	if (isOpen) {
		state.advancedOpen = false;
		state.dangerOpen = false;
	}
	state.generalOpen = isOpen;
};

actions.openAdvanced = (isOpen) => {
	if (isOpen) {
		state.generalOpen = false;
		state.dangerOpen = false;
	}
	state.advancedOpen = isOpen;
};

actions.openDanger = (isOpen) => {
	if (isOpen) {
		state.generalOpen = false;
		state.advancedOpen = false;
	}
	state.dangerOpen = isOpen;
};
```

## With Form Fields Inside

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "v-card-title",
			"children": ["Create Item"]
		},
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-input",
					"props": {
						"modelValue": "state.title",
						"onUpdate:modelValue": "actions.setTitle",
						"placeholder": "Title *"
					}
				},
				{
					"type": "v-detail",
					"props": { "label": "Optional Fields" },
					"children": [
						{
							"type": "v-textarea",
							"props": {
								"modelValue": "state.description",
								"onUpdate:modelValue": "actions.setDescription",
								"placeholder": "Description"
							}
						},
						{
							"type": "v-select",
							"props": {
								"items": [
									{ "text": "Low", "value": "low" },
									{ "text": "Medium", "value": "medium" },
									{ "text": "High", "value": "high" }
								],
								"modelValue": "state.priority",
								"onUpdate:modelValue": "actions.setPriority",
								"placeholder": "Priority"
							}
						}
					]
				},
				{
					"type": "v-detail",
					"props": { "label": "Advanced Options" },
					"children": [
						{
							"type": "v-checkbox",
							"props": {
								"modelValue": "state.featured",
								"onUpdate:modelValue": "actions.setFeatured",
								"label": "Featured item"
							}
						},
						{
							"type": "v-checkbox",
							"props": {
								"modelValue": "state.archived",
								"onUpdate:modelValue": "actions.setArchived",
								"label": "Archive immediately"
							}
						}
					]
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": { "onClick": "actions.save" },
					"children": ["Save"]
				}
			]
		}
	]
}
```

```javascript
state.title = '';
state.description = '';
state.priority = null;
state.featured = false;
state.archived = false;

actions.setTitle = (v) => {
	state.title = v;
};
actions.setDescription = (v) => {
	state.description = v;
};
actions.setPriority = (v) => {
	state.priority = v;
};
actions.setFeatured = (v) => {
	state.featured = v;
};
actions.setArchived = (v) => {
	state.archived = v;
};

actions.save = async () => {
	await createItem('items', {
		title: state.title,
		description: state.description,
		priority: state.priority,
		featured: state.featured,
		status: state.archived ? 'archived' : 'draft',
	});
};
```

## Notes

- Content inside `v-detail` is only rendered when expanded (improves performance)
- The expand/collapse animation is smooth and built-in
- Use for optional/advanced fields to reduce visual clutter
- Nest multiple `v-detail` components for hierarchical organization
