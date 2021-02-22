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

## Props

| Prop                         | Description                                         | Default     | Type                                                       |
| ---------------------------- | --------------------------------------------------- | ----------- | ---------------------------------------------------------- | ---------- | --- | --- | --- |
| <!--                         | <!--                                                | `items`\*   | Items to render in the select                              |            |     | --> | --> |
| <!--                         | <!--                                                | `itemText`  | What item value to use for the display text                | `text`     |     | --> | --> |
| <!--                         | <!--                                                | `itemValue` | What item value to use for the item value                  | `value`    |     | --> | --> |
| `value`                      | Currently selected item(s)                          | `null`      | `[Array, String, Number, Boolean] as PropType<InputValue>` |
| `multiple`                   | Allow multiple items to be selected                 | `false`     | `Boolean`                                                  |
| `placeholder`                | What placeholder to show when no items are selected | `null`      | `String`                                                   |
| `full-width`                 | Render the select at full width                     | `true`      | `Boolean`                                                  |
| `disabled`                   | Disable the select                                  | `false`     | `Boolean`                                                  |
| `show-deselect`              | Show the deselect option when a value has been set  | `false`     | `Boolean`                                                  |
| `close-on-content-click`     | Close the select when selecting a value             | `true`      | `Boolean`                                                  |
| `inline`                     | Render the select inline in text                    | `false`     | `Boolean`                                                  |
| <!--                         | `items`\*                                           |             |                                                            | `ItemsRaw` | --> |
| `item-text`                  |                                                     | `'text'`    | `String`                                                   |
| `item-value`                 |                                                     | `'value'`   | `String`                                                   |
| `item-icon`                  |                                                     | `null`      | `String`                                                   |
| `allow-other`                |                                                     | `false`     | `Boolean`                                                  |
| `multiple-preview-threshold` |                                                     | `3`         | `Number`                                                   |
| `items`\*                    |                                                     |             | `ItemsRaw`                                                 |

## Events

| Event | Description | Value   |
| ----- | ----------- | ------- | ------------------------ | -------- | --------- | ------ | ------- | --- | --- |
| <!--  | <!--        | `input` | New value for the select | `(string | number)[] | string | number` | --> | --> |

## Slots

n/a

## CSS Variables

| Variable                 | Default                    |
| ------------------------ | -------------------------- |
| `--v-select-font-family` | `var(--family-sans-serif)` |

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| `prepend` |             |      |
