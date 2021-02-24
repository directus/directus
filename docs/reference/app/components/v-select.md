# Select

Renders a dropdown input.

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

## Reference

#### Props

| Prop                         | Description                                                    | Default   | Type         |
| ---------------------------- | -------------------------------------------------------------- | --------- | ------------ |
| `items`\*                    | The items that should be selectable                            |           | `ItemsRaw`   |
| `item-text`                  | Which prop should be taken to render the text                  | `'text'`  | `String`     |
| `item-value`                 | Which prop should be taken to mirror the selected value        | `'value'` | `String`     |
| `item-icon`                  | Which prop should be taken to render the icon                  | `null`    | `String`     |
| `value`                      | Mirror with `v-model` the currently selected values            | `null`    | `InputValue` |
| `multiple`                   | Allow to select multiple values                                | `false`   | `Boolean`    |
| `placeholder`                | A placeholder if no item is selected yet                       | `null`    | `String`     |
| `full-width`                 | Display the select in full width                               | `true`    | `Boolean`    |
| `disabled`                   | Disable any interaction with the select                        | `false`   | `Boolean`    |
| `show-deselect`              | Allow to deselect all currently selected items                 | `false`   | `Boolean`    |
| `allow-other`                | Allow to enter custom values                                   | `false`   | `Boolean`    |
| `close-on-content-click`     | Close the dropdown when an selection has been made             | `true`    | `Boolean`    |
| `inline`                     | display the selection inline with other text                   | `false`   | `Boolean`    |
| `multiple-preview-threshold` | The maximum amount of selected items to display in the preview | `3`       | `Number`     |

#### CSS Variables

| Variable                 | Default                    |
| ------------------------ | -------------------------- |
| `--v-select-font-family` | `var(--family-sans-serif)` |

#### Slots

| Slot      | Description                       | Data |
| --------- | --------------------------------- | ---- |
| `prepend` | Prepend anything to the selection |      |

#### Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |
