# v-radio

Radio button for selecting one option from a group.

## Basic Usage

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-radio",
			"props": {
				"modelValue": "state.size",
				"onUpdate:modelValue": "actions.setSize",
				"value": "small",
				"label": "Small"
			}
		},
		{
			"type": "v-radio",
			"props": {
				"modelValue": "state.size",
				"onUpdate:modelValue": "actions.setSize",
				"value": "medium",
				"label": "Medium"
			}
		},
		{
			"type": "v-radio",
			"props": {
				"modelValue": "state.size",
				"onUpdate:modelValue": "actions.setSize",
				"value": "large",
				"label": "Large"
			}
		}
	]
}
```

```javascript
state.size = 'medium'; // Default selection

actions.setSize = (value) => {
	state.size = value;
};
```

## Props

| Prop                  | Type    | Default                  | Description                                    |
| --------------------- | ------- | ------------------------ | ---------------------------------------------- |
| `modelValue`          | any     | null                     | Currently selected value (shared across group) |
| `onUpdate:modelValue` | action  | required                 | Selection change handler                       |
| `value`               | any     | required                 | This radio's value                             |
| `label`               | string  | null                     | Label text                                     |
| `disabled`            | boolean | false                    | Disable this radio                             |
| `iconOn`              | string  | "radio_button_checked"   | Icon when selected                             |
| `iconOff`             | string  | "radio_button_unchecked" | Icon when not selected                         |
| `block`               | boolean | false                    | Display as block element                       |

## Radio Group with Dynamic Options

```json
{
	"type": "div",
	"children": [
		{ "type": "p", "children": ["Select priority:"] },
		{
			"type": "template",
			"iterate": "state.priorities",
			"as": "priority",
			"template": {
				"type": "v-radio",
				"props": {
					"modelValue": "state.selectedPriority",
					"onUpdate:modelValue": "actions.setPriority",
					"value": "priority.value",
					"label": "{{ priority.label }}",
					"block": true
				}
			}
		}
	]
}
```

```javascript
state.priorities = [
	{ value: 'low', label: 'Low - Can wait' },
	{ value: 'medium', label: 'Medium - Normal' },
	{ value: 'high', label: 'High - Urgent' },
	{ value: 'critical', label: 'Critical - Immediate' },
];
state.selectedPriority = 'medium';

actions.setPriority = (value) => {
	state.selectedPriority = value;
};
```

## Custom Icons

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-radio",
			"props": {
				"modelValue": "state.rating",
				"onUpdate:modelValue": "actions.setRating",
				"value": "good",
				"label": "Good",
				"iconOn": "thumb_up",
				"iconOff": "thumb_up"
			}
		},
		{
			"type": "v-radio",
			"props": {
				"modelValue": "state.rating",
				"onUpdate:modelValue": "actions.setRating",
				"value": "bad",
				"label": "Bad",
				"iconOn": "thumb_down",
				"iconOff": "thumb_down"
			}
		}
	]
}
```

## Complete Example: Survey Question

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["How would you rate our service?"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-radio",
					"props": {
						"modelValue": "state.rating",
						"onUpdate:modelValue": "actions.setRating",
						"value": 5,
						"label": "Excellent",
						"block": true
					}
				},
				{
					"type": "v-radio",
					"props": {
						"modelValue": "state.rating",
						"onUpdate:modelValue": "actions.setRating",
						"value": 4,
						"label": "Good",
						"block": true
					}
				},
				{
					"type": "v-radio",
					"props": {
						"modelValue": "state.rating",
						"onUpdate:modelValue": "actions.setRating",
						"value": 3,
						"label": "Average",
						"block": true
					}
				},
				{
					"type": "v-radio",
					"props": {
						"modelValue": "state.rating",
						"onUpdate:modelValue": "actions.setRating",
						"value": 2,
						"label": "Below Average",
						"block": true
					}
				},
				{
					"type": "v-radio",
					"props": {
						"modelValue": "state.rating",
						"onUpdate:modelValue": "actions.setRating",
						"value": 1,
						"label": "Poor",
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
					"props": {
						"onClick": "actions.submit",
						"disabled": "state.noSelection"
					},
					"children": ["Submit"]
				}
			]
		}
	]
}
```

```javascript
state.rating = null;
state.noSelection = true;

actions.setRating = (value) => {
	state.rating = value;
	state.noSelection = value === null;
};

actions.submit = async () => {
	await createItem('survey_responses', {
		rating: state.rating,
	});
};
```

## v-radio vs v-checkbox

| Feature    | v-radio              | v-checkbox              |
| ---------- | -------------------- | ----------------------- |
| Selection  | Single (one of many) | Multiple or boolean     |
| modelValue | Shared value         | Boolean or array        |
| Use case   | "Choose one"         | "Select many" or toggle |
