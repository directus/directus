# Select

Renders a dropdown input.

## Usage

```html
<v-select
	v-model="value"
	:items="[
		{
			text: 'Item 1',
			value: 'item-1',
		},
		{
			text: 'Item 2',
			value: 'item-2',
		},
	]"
/>
```

## CSS Variables

| Variable                 | Default                    |
| ------------------------ | -------------------------- |
| `--v-select-font-family` | `var(--family-sans-serif)` |

## Props

| Prop                         | Description | Default   | Type                                                       |
| ---------------------------- | ----------- | --------- | ---------------------------------------------------------- |
| `items`\*                    |             |           | `ItemsRaw`                                                 |
| `item-text`                  |             | `'text'`  | `String`                                                   |
| `item-value`                 |             | `'value'` | `String`                                                   |
| `item-icon`                  |             | `null`    | `String`                                                   |
| `value`                      |             | `null`    | `[Array, String, Number, Boolean] as PropType<InputValue>` |
| `multiple`                   |             | `false`   | `Boolean`                                                  |
| `placeholder`                |             | `null`    | `String`                                                   |
| `full-width`                 |             | `true`    | `Boolean`                                                  |
| `disabled`                   |             | `false`   | `Boolean`                                                  |
| `show-deselect`              |             | `false`   | `Boolean`                                                  |
| `allow-other`                |             | `false`   | `Boolean`                                                  |
| `close-on-content-click`     |             | `true`    | `Boolean`                                                  |
| `inline`                     |             | `false`   | `Boolean`                                                  |
| `multiple-preview-threshold` |             | `3`       | `Number`                                                   |

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| `prepend` |             |      |
