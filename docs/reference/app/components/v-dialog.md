# Dialog

Renders an overlay with a flex slot rendering whatever content you pass.

```html
<v-dialog>
	<v-sheet>
		<h2>Are you sure you want to delete this item?</h2>
		<v-button>No</v-button>
		<v-button>Yes</v-button>
	</v-sheet>
</v-dialog>
```

## Reference

#### Props

| Prop         | Description                                         | Default     | Type      |
| ------------ | --------------------------------------------------- | ----------- | --------- |
| `persistent` | Disable closing by clicking on the side             | `false`     | `Boolean` |
| `active`     | Can be used in combination with `v-model`           | `undefined` | `Boolean` |
| `placement`  | Display it either in the `center` or to the `right` | `'center'`  | `String`  |

#### Slots

| Slot        | Description                                   | Data |
| ----------- | --------------------------------------------- | ---- |
| _default_   | Whatever should be rendered inside the dialog |      |
| `activator` | Insert an activator for the dialog            |      |

#### Events

| Event    | Description             | Value     |
| -------- | ----------------------- | --------- |
| `toggle` | Change the active state | `boolean` |
| `esc`    | Escape has been pressed | `boolean` |

#### CSS Variables

| Variable             | Default |
| -------------------- | ------- |
| `--v-dialog-z-index` | `100`   |
