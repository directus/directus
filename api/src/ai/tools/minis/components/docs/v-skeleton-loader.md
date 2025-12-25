# v-skeleton-loader

Placeholder loading animation that mimics content structure.

## Basic Usage

```json
{
	"type": "v-skeleton-loader"
}
```

## Props

| Prop   | Type   | Default | Description             |
| ------ | ------ | ------- | ----------------------- |
| `type` | string | null    | Preset type (see below) |

## Available Types

The skeleton loader can mimic different content types:

- `text` - Text lines
- `list-item` - List item with icon and text
- `list-item-avatar` - List item with avatar
- `card` - Card with image and text

## Basic Skeleton

```json
{
	"type": "v-skeleton-loader",
	"condition": "state.isLoading"
}
```

## Text Skeleton

```json
{
	"type": "v-skeleton-loader",
	"props": { "type": "text" }
}
```

## List Item Skeleton

```json
{
	"type": "v-skeleton-loader",
	"props": { "type": "list-item" }
}
```

## Multiple Skeletons

```json
{
	"type": "div",
	"props": { "style": "display: flex; flex-direction: column; gap: 8px;" },
	"condition": "state.isLoading",
	"children": [
		{ "type": "v-skeleton-loader", "props": { "type": "list-item" } },
		{ "type": "v-skeleton-loader", "props": { "type": "list-item" } },
		{ "type": "v-skeleton-loader", "props": { "type": "list-item" } }
	]
}
```

## Conditional Loading Pattern

```json
{
	"type": "div",
	"children": [
		{
			"type": "div",
			"condition": "state.isLoading",
			"children": [
				{ "type": "v-skeleton-loader", "props": { "type": "list-item" } },
				{ "type": "v-skeleton-loader", "props": { "type": "list-item" } },
				{ "type": "v-skeleton-loader", "props": { "type": "list-item" } }
			]
		},
		{
			"type": "v-list",
			"condition": "!state.isLoading",
			"children": [
				{
					"type": "template",
					"iterate": "state.items",
					"as": "item",
					"template": {
						"type": "v-list-item",
						"children": ["{{ item.name }}"]
					}
				}
			]
		}
	]
}
```

## Card with Skeleton Loading

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Recent Items"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"condition": "state.isLoading",
					"props": { "style": "display: flex; flex-direction: column; gap: 16px;" },
					"children": [
						{ "type": "v-skeleton-loader", "props": { "type": "list-item-avatar" } },
						{ "type": "v-skeleton-loader", "props": { "type": "list-item-avatar" } },
						{ "type": "v-skeleton-loader", "props": { "type": "list-item-avatar" } }
					]
				},
				{
					"type": "v-list",
					"condition": "!state.isLoading",
					"children": [
						{
							"type": "template",
							"iterate": "state.items",
							"as": "item",
							"template": {
								"type": "v-list-item",
								"children": [
									{
										"type": "v-list-item-icon",
										"children": [
											{ "type": "v-avatar", "props": { "small": true }, "children": ["{{ item.initials }}"] }
										]
									},
									{ "type": "v-list-item-content", "children": ["{{ item.name }}"] }
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
state.isLoading = true;
state.items = [];

actions.init = async () => {
	state.isLoading = true;

	try {
		const data = await readItems('contacts');
		state.items = data.map((d) => ({
			...d,
			initials: (d.first_name[0] + d.last_name[0]).toUpperCase(),
			name: `${d.first_name} ${d.last_name}`,
		}));
	} finally {
		state.isLoading = false;
	}
};
```

## Complete Example: Dashboard Cards Loading

```json
{
	"type": "div",
	"props": { "style": "display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.isLoading ? [1, 2, 3] : state.cards",
			"as": "card",
			"template": {
				"type": "v-card",
				"children": [
					{
						"type": "v-card-text",
						"children": [
							{
								"type": "v-skeleton-loader",
								"condition": "state.isLoading"
							},
							{
								"type": "div",
								"condition": "!state.isLoading",
								"children": [
									{
										"type": "h3",
										"props": { "style": "margin: 0 0 8px 0;" },
										"children": ["{{ card.title }}"]
									},
									{
										"type": "p",
										"props": { "style": "font-size: 32px; font-weight: bold; margin: 0;" },
										"children": ["{{ card.value }}"]
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
```

```javascript
state.isLoading = true;
state.cards = [];

actions.init = async () => {
	state.isLoading = true;

	try {
		// Fetch dashboard data
		const stats = await readItems('dashboard_stats');
		state.cards = stats;
	} finally {
		state.isLoading = false;
	}
};
```

## Notes

- Use skeleton loaders to improve perceived loading performance
- Match the skeleton structure to your actual content layout
- Show same number of skeleton items as expected content
- Combine with `condition` for loading/loaded states
