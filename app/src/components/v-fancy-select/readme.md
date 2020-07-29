# Fancy Select

Mimics the functionality of a select, where only the current value is shown, but does it in a
different visual representation.

## Usage

```html
<v-fancy-select
	v-model="selection"
	:items="[
		{
			value: 'code',
			icon: 'code',
			text: 'Raw Value',
			description: 'This works for most non-relational fields',
		},
		{
			value: 'palette',
			icon: 'palette',
			text: 'Formatted Value',
			description: 'Templated formatting and conditional coloring to text values',
		},
		{
			value: 'label',
			icon: 'label',
			text: 'Placard',
			description: 'Shows the value within a colored badge',
		},
	]"
/>
```

## Props
| Prop       | Description                             | Default |
|------------|-----------------------------------------|---------|
| `items`*   | Items the user can select from          |         |
| `value`    | Value used for v-model                  | `null`  |
| `disabled` | Disable selecting / deselecting a value |         |

## Events
| Event   | Description                | Value     |
|---------|----------------------------|-----------|
| `input` | Syncs value with `v-model` | `boolean` |

## Slots
n/a

## CSS Variables
n/a
