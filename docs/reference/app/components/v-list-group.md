# List Group

Used to display nested items inside a list.

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

#### Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `click` |             |       |

#### Props

| Prop       | Description | Default     | Type               |
| ---------- | ----------- | ----------- | ------------------ |
| `multiple` |             | `true`      | `Boolean`          |
| `to`       |             | `null`      | `String`           |
| `active`   |             | `false`     | `Boolean`          |
| `exact`    |             | `false`     | `Boolean`          |
| `disabled` |             | `false`     | `Boolean`          |
| `scope`    |             | `undefined` | `String`           |
| `value`    |             | `undefined` | `[String, Number]` |
| `dense`    |             | `false`     | `Boolean`          |

#### Slots

| Slot        | Description | Data |
| ----------- | ----------- | ---- |
| `activator` |             |      |
| _default_   |             |      |
