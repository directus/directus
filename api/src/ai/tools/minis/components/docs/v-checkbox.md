# v-checkbox

Checkbox input for boolean values or multiple selections.

## Basic Usage

```json
{
	"type": "v-checkbox",
	"props": {
		"modelValue": "state.agreed",
		"onUpdate:modelValue": "actions.setAgreed",
		"label": "I agree to the terms"
	}
}
```

```javascript
state.agreed = false;

actions.setAgreed = (value) => {
	state.agreed = value;
};
```

## Props

| Prop                  | Type          | Default                   | Description                |
| --------------------- | ------------- | ------------------------- | -------------------------- |
| `modelValue`          | boolean/array | false                     | Current value              |
| `onUpdate:modelValue` | action        | required                  | Value change handler       |
| `label`               | string        | null                      | Label text                 |
| `disabled`            | boolean       | false                     | Disable the checkbox       |
| `indeterminate`       | boolean       | false                     | Show indeterminate state   |
| `value`               | any           | null                      | Value when used in a group |
| `iconOn`              | string        | "check_box"               | Icon when checked          |
| `iconOff`             | string        | "check_box_outline_blank" | Icon when unchecked        |
| `block`               | boolean       | false                     | Display as block element   |

## Boolean Checkbox

Simple true/false toggle:

```json
{
	"type": "v-checkbox",
	"props": {
		"modelValue": "state.isActive",
		"onUpdate:modelValue": "actions.setActive",
		"label": "Active"
	}
}
```

## Checkbox Group

Multiple checkboxes sharing an array value:

```json
{
	"type": "div",
	"children": [
		{ "type": "p", "children": ["Select features:"] },
		{
			"type": "v-checkbox",
			"props": {
				"modelValue": "state.features",
				"onUpdate:modelValue": "actions.setFeatures",
				"value": "notifications",
				"label": "Email notifications"
			}
		},
		{
			"type": "v-checkbox",
			"props": {
				"modelValue": "state.features",
				"onUpdate:modelValue": "actions.setFeatures",
				"value": "analytics",
				"label": "Analytics tracking"
			}
		},
		{
			"type": "v-checkbox",
			"props": {
				"modelValue": "state.features",
				"onUpdate:modelValue": "actions.setFeatures",
				"value": "api",
				"label": "API access"
			}
		}
	]
}
```

```javascript
state.features = []; // Array for group

actions.setFeatures = (value) => {
	state.features = value;
};
```

## Custom Icons

```json
{
	"type": "v-checkbox",
	"props": {
		"modelValue": "state.starred",
		"onUpdate:modelValue": "actions.setStarred",
		"iconOn": "star",
		"iconOff": "star_outline",
		"label": "Add to favorites"
	}
}
```

## Indeterminate State

For "select all" scenarios:

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-checkbox",
			"props": {
				"modelValue": "state.allSelected",
				"onUpdate:modelValue": "actions.toggleAll",
				"indeterminate": "state.someSelected",
				"label": "Select all"
			}
		},
		{ "type": "v-divider" },
		{
			"type": "template",
			"iterate": "state.items",
			"as": "item",
			"template": {
				"type": "v-checkbox",
				"props": {
					"modelValue": "state.selectedIds",
					"onUpdate:modelValue": "actions.setSelected",
					"value": "item.id",
					"label": "{{ item.name }}"
				}
			}
		}
	]
}
```

```javascript
state.items = [
	{ id: 1, name: 'Item 1' },
	{ id: 2, name: 'Item 2' },
	{ id: 3, name: 'Item 3' },
];
state.selectedIds = [];
state.allSelected = false;
state.someSelected = false;

actions.setSelected = (value) => {
	state.selectedIds = value;
	state.allSelected = value.length === state.items.length;
	state.someSelected = value.length > 0 && value.length < state.items.length;
};

actions.toggleAll = (value) => {
	if (value) {
		state.selectedIds = state.items.map((i) => i.id);
	} else {
		state.selectedIds = [];
	}
	state.allSelected = value;
	state.someSelected = false;
};
```

## Block Display

Full-width clickable area:

```json
{
	"type": "v-checkbox",
	"props": {
		"modelValue": "state.option",
		"onUpdate:modelValue": "actions.setOption",
		"label": "Enable this option",
		"block": true
	}
}
```

## Complete Example: Settings Panel

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Notification Settings"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-checkbox",
					"props": {
						"modelValue": "state.emailNotifs",
						"onUpdate:modelValue": "actions.setEmailNotifs",
						"label": "Email notifications",
						"block": true
					}
				},
				{
					"type": "v-checkbox",
					"props": {
						"modelValue": "state.pushNotifs",
						"onUpdate:modelValue": "actions.setPushNotifs",
						"label": "Push notifications",
						"block": true
					}
				},
				{
					"type": "v-checkbox",
					"props": {
						"modelValue": "state.weeklyDigest",
						"onUpdate:modelValue": "actions.setWeeklyDigest",
						"label": "Weekly digest email",
						"block": true
					}
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": { "onClick": "actions.saveSettings" },
					"children": ["Save"]
				}
			]
		}
	]
}
```

```javascript
state.emailNotifs = true;
state.pushNotifs = false;
state.weeklyDigest = true;

actions.setEmailNotifs = (v) => {
	state.emailNotifs = v;
};
actions.setPushNotifs = (v) => {
	state.pushNotifs = v;
};
actions.setWeeklyDigest = (v) => {
	state.weeklyDigest = v;
};

actions.saveSettings = async () => {
	await updateItem('user_settings', state.settingsId, {
		email_notifications: state.emailNotifs,
		push_notifications: state.pushNotifs,
		weekly_digest: state.weeklyDigest,
	});
};
```
