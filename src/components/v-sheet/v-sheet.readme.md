# Sheet

```html
<v-sheet></v-sheet>
```

A sheet is a component that holds other components. It provides a visual difference (layer) on the page. It's often used when grouping fields.

## Sizing

The sheet component has props for `height`, `width`, `min-height`, `min-width`, `max-height`, and `max-width`. All of these props are in pixels.

## Color

The color prop accepts any valid CSS color. CSS variable names can be passed as well, prefixed with `--`:

```html
<v-sheet color="#eee"></v-sheet>
<v-sheet color="papayawhip"></v-sheet>
<v-sheet color="rgba(255, 153, 84, 0.4"></v-sheet>
<v-sheet color="--input-background-color-alt"></v-sheet>
```

