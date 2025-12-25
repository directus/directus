# v-progress-linear

Horizontal progress bar for showing progress or loading states.

## Basic Usage

```json
{
	"type": "v-progress-linear",
	"props": { "value": 75 }
}
```

## Props

| Prop            | Type    | Default | Description                |
| --------------- | ------- | ------- | -------------------------- |
| `value`         | number  | null    | Progress value (0-100)     |
| `indeterminate` | boolean | false   | Infinite loading animation |
| `rounded`       | boolean | false   | Rounded ends               |
| `absolute`      | boolean | false   | Position absolute          |
| `bottom`        | boolean | false   | Position at bottom         |

## Determinate Progress

```json
{
	"type": "v-progress-linear",
	"props": { "value": "state.progress" }
}
```

```javascript
state.progress = 0;

actions.startUpload = async () => {
	// Simulate progress
	for (let i = 0; i <= 100; i += 10) {
		state.progress = i;
		await new Promise((r) => setTimeout(r, 200));
	}
};
```

## Indeterminate (Loading)

```json
{
	"type": "v-progress-linear",
	"props": { "indeterminate": true },
	"condition": "state.isLoading"
}
```

## Rounded Style

```json
{
	"type": "v-progress-linear",
	"props": { "value": 60, "rounded": true }
}
```

## With Label

```json
{
	"type": "div",
	"children": [
		{
			"type": "div",
			"props": { "style": "display: flex; justify-content: space-between; margin-bottom: 4px;" },
			"children": [
				{ "type": "span", "children": ["Uploading..."] },
				{ "type": "span", "children": ["{{ state.progress }}%"] }
			]
		},
		{
			"type": "v-progress-linear",
			"props": { "value": "state.progress", "rounded": true }
		}
	]
}
```

## File Upload Progress

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["File Upload"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"condition": "state.uploadingFile",
					"children": [
						{
							"type": "div",
							"props": { "style": "display: flex; align-items: center; gap: 12px; margin-bottom: 8px;" },
							"children": [
								{ "type": "v-icon", "props": { "name": "upload_file" } },
								{ "type": "span", "children": ["{{ state.fileName }}"] }
							]
						},
						{
							"type": "v-progress-linear",
							"props": { "value": "state.uploadProgress", "rounded": true }
						},
						{
							"type": "p",
							"props": { "style": "text-align: center; margin-top: 8px; color: var(--theme--foreground-subdued);" },
							"children": ["{{ state.uploadProgress }}% complete"]
						}
					]
				}
			]
		}
	]
}
```

## Multiple Progress Bars

```json
{
	"type": "div",
	"props": { "style": "display: flex; flex-direction: column; gap: 16px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.tasks",
			"as": "task",
			"template": {
				"type": "div",
				"children": [
					{
						"type": "div",
						"props": { "style": "display: flex; justify-content: space-between; margin-bottom: 4px;" },
						"children": [
							{ "type": "span", "children": ["{{ task.name }}"] },
							{ "type": "span", "children": ["{{ task.progress }}%"] }
						]
					},
					{
						"type": "v-progress-linear",
						"props": { "value": "task.progress", "rounded": true }
					}
				]
			}
		}
	]
}
```

```javascript
state.tasks = [
	{ name: 'Design', progress: 100 },
	{ name: 'Development', progress: 75 },
	{ name: 'Testing', progress: 30 },
	{ name: 'Deployment', progress: 0 },
];
```

## Complete Example: Download Manager

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Downloads"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-list",
					"children": [
						{
							"type": "template",
							"iterate": "state.downloads",
							"as": "dl",
							"template": {
								"type": "v-list-item",
								"children": [
									{
										"type": "v-list-item-icon",
										"children": [{ "type": "v-icon", "props": { "name": "download" } }]
									},
									{
										"type": "v-list-item-content",
										"children": [
											{
												"type": "div",
												"children": [
													{ "type": "div", "children": ["{{ dl.name }}"] },
													{
														"type": "v-progress-linear",
														"props": {
															"value": "dl.progress",
															"indeterminate": "dl.progress === null",
															"rounded": true
														}
													},
													{
														"type": "div",
														"props": { "style": "font-size: 12px; color: var(--theme--foreground-subdued);" },
														"children": ["{{ dl.status }}"]
													}
												]
											}
										]
									}
								]
							}
						}
					]
				}
			]
		}
	]
}
```

```javascript
state.downloads = [
	{ name: 'report.pdf', progress: 100, status: 'Complete' },
	{ name: 'images.zip', progress: 67, status: '67% - 2.3 MB/s' },
	{ name: 'data.csv', progress: null, status: 'Starting...' },
];
```

## Notes

- Use `indeterminate` when progress percentage is unknown
- Use `value` (0-100) when you can track progress
- `rounded` provides a softer appearance
- Combine with text labels for better user feedback
