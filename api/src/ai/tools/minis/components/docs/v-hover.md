# v-hover

Wrapper component that tracks hover state for its children.

## Basic Usage

The v-hover component provides hover state that can be used by child components.

```json
{
	"type": "v-hover",
	"children": [
		{
			"type": "div",
			"props": { "style": "padding: 16px; background: var(--theme--background-subdued);" },
			"children": ["Hover over me"]
		}
	]
}
```

## Props

| Prop       | Type    | Default | Description             |
| ---------- | ------- | ------- | ----------------------- |
| `disabled` | boolean | false   | Disable hover detection |

## Hover Effect Card

Since v-hover passes hover state to children, you can use it to create hover effects:

```json
{
	"type": "v-hover",
	"children": [
		{
			"type": "v-card",
			"props": { "style": "transition: transform 0.2s, box-shadow 0.2s;" },
			"children": [
				{ "type": "v-card-title", "children": ["Hover Card"] },
				{ "type": "v-card-text", "children": ["This card has hover effects."] }
			]
		}
	]
}
```

## Alternative: CSS Hover

For simple hover effects, CSS is often easier:

```json
{
	"type": "div",
	"props": {
		"style": "padding: 16px; background: var(--theme--background-subdued); transition: background 0.2s;",
		"class": "hoverable"
	},
	"children": ["Hover effect with CSS"]
}
```

## Interactive Card Grid

```json
{
	"type": "div",
	"props": { "style": "display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.items",
			"as": "item",
			"template": {
				"type": "v-hover",
				"children": [
					{
						"type": "v-card",
						"props": {
							"style": "cursor: pointer; transition: transform 0.2s;",
							"onClick": "() => actions.selectItem(item)"
						},
						"children": [
							{ "type": "v-card-title", "children": ["{{ item.title }}"] },
							{ "type": "v-card-text", "children": ["{{ item.description }}"] }
						]
					}
				]
			}
		}
	]
}
```

## Notes

- v-hover is useful when you need to track hover state for complex interactions
- For simple hover effects, prefer CSS `:hover` pseudo-class
- The component enables hover-triggered visibility or styling changes
- Consider accessibility: hover effects should have keyboard equivalents
