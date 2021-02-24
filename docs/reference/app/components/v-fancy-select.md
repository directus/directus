# Fancy Select

Mimics the functionality of a select, where only the current value is shown, but does it in a different visual
representation.

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

## FancySelectItem

| Prop          | Description                                | Type                                     |
| ------------- | ------------------------------------------ | ---------------------------------------- |
| `icon`        | Which icon to display                      | `string`                                 |
| `value`       | Which value the item represents            | `string or number`                       |
| `text`        | The displayed text                         | `undefined or string or TranslateResult` |
| `description` | Optional description to display            | `undefined or string or TranslateResult` |
| `divider`     | If set to true, display an divider instead | `undefined or boolean`                   |
| `iconRight`   | Display an optional icon to the right      | `undefined or string`                    |

## Reference

#### Props

| Prop       | Description                             | Default | Type                |
| ---------- | --------------------------------------- | ------- | ------------------- |
| `items`\*  | The list of possible items to display   |         | `FancySelectItem[]` |
| `value`    | used to model the selected items        | `null`  | `[String, Number]`  |
| `disabled` | Disable selecting / deselecting a value | `false` | `Boolean`           |

#### Events

| Event   | Description                | Value     |
| ------- | -------------------------- | --------- |
| `input` | Syncs value with `v-model` | `boolean` |

#### Slots

n/a

#### CSS Variables

n/a
