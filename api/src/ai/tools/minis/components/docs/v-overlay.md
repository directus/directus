# v-overlay

Full-screen or container overlay for loading states or blocking interactions.

## Basic Usage

```json
{
	"type": "div",
	"props": { "style": "position: relative; min-height: 200px;" },
	"children": [
		{ "type": "p", "children": ["Content behind overlay"] },
		{
			"type": "v-overlay",
			"props": { "active": "state.isLoading", "absolute": true }
		}
	]
}
```

## Props

| Prop        | Type    | Default | Description                                              |
| ----------- | ------- | ------- | -------------------------------------------------------- |
| `active`    | boolean | false   | Whether the overlay is visible                           |
| `absolute`  | boolean | false   | Position absolute (within parent) vs fixed (full screen) |
| `clickable` | boolean | false   | Allow clicking through the overlay                       |

## Loading Overlay

```json
{
	"type": "div",
	"props": { "style": "position: relative;" },
	"children": [
		{
			"type": "v-card",
			"children": [
				{ "type": "v-card-title", "children": ["Data"] },
				{ "type": "v-card-text", "children": ["Content here..."] }
			]
		},
		{
			"type": "v-overlay",
			"props": { "active": "state.loading", "absolute": true },
			"children": [{ "type": "v-progress-circular", "props": { "indeterminate": true } }]
		}
	]
}
```

```javascript
state.loading = false;

actions.loadData = async () => {
	state.loading = true;
	try {
		state.data = await readItems('collection');
	} finally {
		state.loading = false;
	}
};
```

## With Custom Content

```json
{
	"type": "v-overlay",
	"props": { "active": "state.showOverlay", "absolute": true },
	"children": [
		{
			"type": "div",
			"props": { "style": "text-align: center; color: white;" },
			"children": [
				{ "type": "v-progress-circular", "props": { "indeterminate": true } },
				{ "type": "p", "children": ["Loading data..."] }
			]
		}
	]
}
```

## Important Notes

- Parent must have `position: relative` for `absolute: true` to work
- Without `absolute`, overlay covers the entire viewport
- Use for loading states within a specific container
- Content can be placed inside the overlay (centered automatically)
