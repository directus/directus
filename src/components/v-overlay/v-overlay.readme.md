# Overlay

```html
<v-overlay :active="overlay">
	<v-button @click="overlay = false">Close overlay</v-button>
</v-overlay>
```

The overlay is a fairly barebones component that's meant to be used with modals / confirms / other attention requiring actions.

## Color

The overlay component supports multiple colors. The color prop accepts any valid CSS color. CSS variable names can be passed as well.

## Props

| Prop       | Description               | Default               |
|------------|---------------------------|-----------------------|
| `active`   | Show / hide the overlay   | `false`               |
| `absolute` | Add `position: absolute;` | `false`               |
| `color`    | Color for the overlay     | `--modal-smoke-color` |
| `z-index`  | `z-index` for the overlay | `500`                 |
| `opacity`  | Opacity for the overlay   | `0.75`                |

## Slots

The only slot is the default slot. All content in the overlay will be rendered in the center of the overlay.
