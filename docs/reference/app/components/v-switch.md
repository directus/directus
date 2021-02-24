# Switch

Render a switch that either can model a single boolean value or model an array in combination with the `value` prop.

```html
<v-switch v-model="checked" label="Receive newsletter" />
```

## Colors

Color changes are done using the css variable `--v-switch-color`.

```html
<v-switch v-model="checked" />
<style>
	.v-switch {
		--v-switch-color: var(--red);
	}
</style>
```

## Boolean vs arrays

Just as with regular checkboxes, you can use `v-model` with both an array and a boolean:

```html
<template>
	<v-switch v-model="withBoolean" />

	<v-switch v-model="withArray" value="red" />
	<v-switch v-model="withArray" value="blue" />
	<v-switch v-model="withArray" value="green" />
</template>

<script>
	export default {
		data() {
			return {
				withBoolean: false,
				withArray: ['red', 'green'],
			};
		},
	};
</script>
```

Keep in mind to pass the `value` prop with a unique value when using arrays in `v-model`.

## Reference

#### Props

| Prop          | Description                                            | Default | Type               |
| ------------- | ------------------------------------------------------ | ------- | ------------------ |
| `value`       | If modeling an array, what value the switch represents | `null`  | `String`           |
| `input-value` | Model the selected state using `v-model`               | `false` | `[Boolean, Array]` |
| `disabled`    | Disables the switch                                    | `false` | `Boolean`          |
| `label`       | Displays a label next to the switch                    | `null`  | `String`           |

#### CSS Variables

| Variable           | Default                    |
| ------------------ | -------------------------- |
| `--v-switch-color` | `var(--foreground-normal)` |

#### Events

| Event    | Description                          | Value |
| -------- | ------------------------------------ | ----- |
| `change` | When the state of the switch changes |       |

#### Slots

| Slot    | Description                                     | Data |
| ------- | ----------------------------------------------- | ---- |
| `label` | Alternative way of adding a label to the switch |      |
