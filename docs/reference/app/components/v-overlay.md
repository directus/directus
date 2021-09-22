# Overlay

The overlay is a fairly barebones component that's meant to be used with modals / confirms / other attention requiring
actions.

```html
<v-overlay :active="overlay">
	<v-button @click="overlay = false">Close overlay</v-button>
</v-overlay>
```

## Color

The colors can be changed via the css variable `--v-overlay-color`.

```html
<v-overlay :active="overlay">
	<v-button @click="overlay = false">Close overlay</v-button>
</v-overlay>
<style>
	.v-overlay {
		--v-overlay-color: rgba(255, 0, 0, 0.5);
	}
</style>
```

## Reference

#### Props

| Prop       | Description               | Default | Type      |
| ---------- | ------------------------- | ------- | --------- |
| `active`   | Show / hide the overlay   | `false` | `Boolean` |
| `absolute` | Add `position: absolute;` | `false` | `Boolean` |

#### CSS Variables

| Variable              | Default                |
| --------------------- | ---------------------- |
| `--v-overlay-color`   | `var(--overlay-color)` |
| `--v-overlay-z-index` | `600`                  |

#### Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `click` |             |       |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
