# Sheet

```html
<v-sheet></v-sheet>
```

A sheet is a component that holds other components. It provides a visual difference (layer) on the page. It's often used
when grouping fields.

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
