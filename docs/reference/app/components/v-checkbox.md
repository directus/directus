# Checkbox

Display a single checkbox on which you can model a boolean.

```html
<v-checkbox v-model="checked" label="Receive newsletter" />
```

## Colors

The colors can be changed via the css variables `--v-checkbox-color`.

```html
<v-checkbox class="example-1" />
<v-checkbox class="example-2" />
<v-checkbox class="example-3" />
<v-checkbox class="example-4" />

<style>
	.example-1 {
		--v-checkbox-color: #abcabc;
	}

	.example-2 {
		--v-checkbox-color: rgba(125, 125, 198, 0.5);
	}

	.example-3 {
		--v-checkbox-color: var(--red);
	}

	.example-4 {
		--v-checkbox-color: var(--border-normal);
	}
</style>
```

## Boolean vs arrays

Just as with checkboxes, you can use `v-model` with both an array and a boolean:

```html
<template>
	<v-checkbox v-model="withBoolean" />

	<v-checkbox v-model="withArray" value="red" />
	<v-checkbox v-model="withArray" value="blue" />
	<v-checkbox v-model="withArray" value="green" />
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

## Indeterminate

The indeterminate state can be set with the `indeterminate` prop. We recommend using the `.sync` modifier with the
indeterminate prop, so the checkbox can set change it too:

```html
<v-checkbox :indeterminate.sync="indeterminate">
	<script>
		export default {
			data() {
				indeterminate: true;
			},
		};
	</script>
</v-checkbox>
```

If you can't, you should listen to the `update:indeterminate` event and respond to that:

```html
<v-checkbox indeterminate @update:indeterminate="setIndeterminate"></v-checkbox>
```

## Reference

#### Props

| Prop                 | Description                                                              | Default                     | Type               |
| -------------------- | ------------------------------------------------------------------------ | --------------------------- | ------------------ |
| `value`              | Value for checkbox. Similar to value attr on checkbox type input in HTML | `null`                      | `String`           |
| `input-value`        | Value that's used with `v-model`. Either boolean or array of values      | `false`                     | `[Boolean, Array]` |
| `label`              |                                                                          | `null`                      | `String`           |
| `disabled`           |                                                                          | `false`                     | `Boolean`          |
| `indeterminate`      |                                                                          | `false`                     | `Boolean`          |
| `icon-on`            |                                                                          | `'check_box'`               | `String`           |
| `icon-off`           |                                                                          | `'check_box_outline_blank'` | `String`           |
| `icon-indeterminate` |                                                                          | `'indeterminate_check_box'` | `String`           |
| `block`              |                                                                          | `false`                     | `Boolean`          |
| `custom-value`       |                                                                          | `false`                     | `Boolean`          |
| `label`              | Label for the checkbox                                                   | `null`                      | `String`           |
| `disabled`           | Disable the checkbox                                                     | `false`                     | `Boolean`          |
| `indeterminate`      | Show the indeterminate state                                             | `false`                     | `Boolean`          |
| `icon-on`            | What icon to use for the on state                                        | `'check_box'`               | `String`           |
| `icon-off`           | What icon to use for the off state                                       | `'check_box_outline_blank'` | `String`           |
| `icon-indeterminate` | What icon to use for the indeterminate state                             | `'indeterminate_check_box'` | `String`           |
| `block`              | Show as styled block. Matches input size                                 | `false`                     | `Boolean`          |
| `input-value`        |                                                                          | `false`                     | `[Boolean, Array]` |
| `custom-value`       |                                                                          | `false`                     | `Boolean`          |

#### Slots

| Slot      | Description                        | Data |
| --------- | ---------------------------------- | ---- |
| `prepend` | Rendered right before the checkbox |      |
| `append`  | Rendered right after the label     |      |
| _default_ |                                    |      |

#### Events

| Event                  | Description                | Value                      |
| ---------------------- | -------------------------- | -------------------------- |
| `change`               | New state for the checkbox | Boolean or array of values |
| `update:indeterminate` | New state for the checkbox | Boolean or array of values |

#### CSS Variables

| Variable             | Default          |
| -------------------- | ---------------- |
| `--v-checkbox-color` | `var(--primary)` |
