# List

Display usual lists. Also works with nested data.

```html
<v-list>
	<v-list-item>Item 1</v-list-item>
	<v-list-item>Item 2</v-list-item>
	<v-list-item>Item 3</v-list-item>

	<v-list-group>
		<template #activator="{active}">
			<v-list-item>Group 1</v-list-item>
		</template>

		<v-list-item>Item 1-1</v-list-item>
		<v-list-item>Item 1-2</v-list-item>
		<v-list-item>Item 1-2</v-list-item>
	</v-list-group>
</v-list>
```

## Reference

#### Props

| Prop           | Description                                                 | Default    | Type                   |
| -------------- | ----------------------------------------------------------- | ---------- | ---------------------- |
| `active-items` | Used with `v-model` to model all selected items in the list | `() => []` | `(number or string)[]` |
| `large`        | Displays each list item a bit larger                        | `false`    | `Boolean`              |
| `multiple`     | Allows to select multiple items in the list                 | `true`     | `Boolean`              |
| `mandatory`    | At least one item has to be selected                        | `true`     | `Boolean`              |

#### CSS Variables

| Variable                           | Default                        |
| ---------------------------------- | ------------------------------ |
| `--v-list-padding`                 | `4px 0`                        |
| `--v-list-max-height`              | `none`                         |
| `--v-list-max-width`               | `none`                         |
| `--v-list-min-width`               | `220px`                        |
| `--v-list-min-height`              | `none`                         |
| `--v-list-color`                   | `var(--foreground-normal-alt)` |
| `--v-list-color-hover`             | `var(--foreground-normal-alt)` |
| `--v-list-color-active`            | `var(--foreground-normal-alt)` |
| `--v-list-background-color-hover`  | `var(--background-normal-alt)` |
| `--v-list-background-color-active` | `var(--background-normal-alt)` |

#### Events

| Event   | Description                          | Value |
| ------- | ------------------------------------ | ----- |
| `input` | Used to update the current selection |       |

#### Slots

| Slot      | Description                | Data |
| --------- | -------------------------- | ---- |
| _default_ | Render all list items here |      |
