# v-progress-circular

Circular progress indicator for loading states or progress display.

## Basic Usage

```json
{
	"type": "v-progress-circular",
	"props": { "indeterminate": true }
}
```

## Props

| Prop            | Type    | Default | Description            |
| --------------- | ------- | ------- | ---------------------- |
| `value`         | number  | null    | Progress value (0-100) |
| `indeterminate` | boolean | false   | Spinning animation     |
| `small`         | boolean | false   | Small size             |
| `xSmall`        | boolean | false   | Extra small size       |
| `large`         | boolean | false   | Large size             |
| `xLarge`        | boolean | false   | Extra large size       |

## Determinate Progress

```json
{
	"type": "v-progress-circular",
	"props": { "value": 75 }
}
```

## Indeterminate (Spinner)

```json
{
	"type": "v-progress-circular",
	"props": { "indeterminate": true }
}
```

## Sizes

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 16px; align-items: center;" },
	"children": [
		{ "type": "v-progress-circular", "props": { "indeterminate": true, "xSmall": true } },
		{ "type": "v-progress-circular", "props": { "indeterminate": true, "small": true } },
		{ "type": "v-progress-circular", "props": { "indeterminate": true } },
		{ "type": "v-progress-circular", "props": { "indeterminate": true, "large": true } },
		{ "type": "v-progress-circular", "props": { "indeterminate": true, "xLarge": true } }
	]
}
```

## Loading State

```json
{
	"type": "div",
	"props": { "style": "display: flex; justify-content: center; padding: 40px;" },
	"condition": "state.isLoading",
	"children": [{ "type": "v-progress-circular", "props": { "indeterminate": true } }]
}
```

## With Label

```json
{
	"type": "div",
	"props": { "style": "display: flex; flex-direction: column; align-items: center; gap: 8px;" },
	"children": [
		{ "type": "v-progress-circular", "props": { "indeterminate": true } },
		{ "type": "span", "children": ["Loading..."] }
	]
}
```

## Centered Loading Overlay

```json
{
	"type": "v-overlay",
	"props": { "modelValue": "state.isLoading" },
	"children": [
		{
			"type": "div",
			"props": { "style": "display: flex; flex-direction: column; align-items: center; gap: 16px;" },
			"children": [
				{ "type": "v-progress-circular", "props": { "indeterminate": true, "large": true } },
				{ "type": "span", "props": { "style": "color: white;" }, "children": ["Processing..."] }
			]
		}
	]
}
```

## Progress with Value Display

```json
{
	"type": "div",
	"props": { "style": "position: relative; display: inline-flex; align-items: center; justify-content: center;" },
	"children": [
		{ "type": "v-progress-circular", "props": { "value": "state.progress", "large": true } },
		{
			"type": "span",
			"props": { "style": "position: absolute; font-size: 14px; font-weight: bold;" },
			"children": ["{{ state.progress }}%"]
		}
	]
}
```

## Button with Loading State

```json
{
	"type": "v-button",
	"props": {
		"onClick": "actions.submit",
		"disabled": "state.isSubmitting"
	},
	"children": [
		{
			"type": "v-progress-circular",
			"props": { "indeterminate": true, "xSmall": true },
			"condition": "state.isSubmitting"
		},
		{
			"type": "span",
			"condition": "!state.isSubmitting",
			"children": ["Submit"]
		},
		{
			"type": "span",
			"condition": "state.isSubmitting",
			"children": ["Submitting..."]
		}
	]
}
```

Note: For buttons, prefer using the button's built-in `loading` prop instead.

## Complete Example: Data Loading Card

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Statistics"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "display: flex; justify-content: center; padding: 40px;" },
					"condition": "state.isLoading",
					"children": [
						{
							"type": "div",
							"props": { "style": "text-align: center;" },
							"children": [
								{ "type": "v-progress-circular", "props": { "indeterminate": true } },
								{
									"type": "p",
									"props": { "style": "margin-top: 16px; color: var(--theme--foreground-subdued);" },
									"children": ["Loading statistics..."]
								}
							]
						}
					]
				},
				{
					"type": "div",
					"condition": "!state.isLoading",
					"children": [
						{
							"type": "div",
							"props": { "style": "display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" },
							"children": [
								{
									"type": "template",
									"iterate": "state.stats",
									"as": "stat",
									"template": {
										"type": "div",
										"props": { "style": "text-align: center;" },
										"children": [
											{
												"type": "div",
												"props": { "style": "position: relative; display: inline-flex; margin-bottom: 8px;" },
												"children": [
													{ "type": "v-progress-circular", "props": { "value": "stat.percentage", "large": true } },
													{
														"type": "span",
														"props": {
															"style": "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold;"
														},
														"children": ["{{ stat.percentage }}%"]
													}
												]
											},
											{ "type": "div", "props": { "style": "font-weight: 500;" }, "children": ["{{ stat.label }}"] }
										]
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

```javascript
state.isLoading = true;
state.stats = [];

actions.init = async () => {
	state.isLoading = true;

	try {
		const data = await readItems('analytics');
		state.stats = [
			{ label: 'Completed', percentage: data.completedRate },
			{ label: 'In Progress', percentage: data.inProgressRate },
			{ label: 'Pending', percentage: data.pendingRate },
		];
	} finally {
		state.isLoading = false;
	}
};
```

## Notes

- Use `indeterminate` when duration is unknown (most common)
- Use `value` when you can track actual progress
- Size props match other Directus components (xSmall, small, large, xLarge)
- For loading states, prefer this over custom spinners
