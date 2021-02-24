# Sheet

A sheet is a component that holds other components. It provides a visual difference (layer) on the page. It's often used
when grouping fields.

```html
<v-sheet></v-sheet>
```

## Sizing

The sheet component has props for `height`, `width`, `min-height`, `min-width`, `max-height`, and `max-width`. All of
these props are in pixels.

## Color

The color can be changed via the css variable called `--v-sheet-color`.

```html
<v-sheet />
<style>
	.v-sheet {
		--v-sheet-color: var(-red-600);
	}
</style>
```

## Reference

#### CSS Variables

| Variable                     | Default                     |
| ---------------------------- | --------------------------- |
| `--v-sheet-background-color` | `var(--background-subdued)` |
| `--v-sheet-height`           | `auto`                      |
| `--v-sheet-min-height`       | `var(--input-height)`       |
| `--v-sheet-max-height`       | `none`                      |
| `--v-sheet-width`            | `auto`                      |
| `--v-sheet-min-width`        | `none`                      |
| `--v-sheet-max-width`        | `none`                      |
| `--v-sheet-padding`          | `8px`                       |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
