# Overlay

```html
<v-overlay :active="overlay">
	<v-button @click="overlay = false">Close overlay</v-button>
</v-overlay>
```

The overlay is a fairly barebones component that's meant to be used with modals / confirms / other attention requiring actions.

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

## Props
| Prop       | Description               | Default               |
|------------|---------------------------|-----------------------|
| `active`   | Show / hide the overlay   | `false`               |
| `absolute` | Add `position: absolute;` | `false`               |

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             | --   |

## Events
| Event   | Description | Value        |
|---------|-------------|--------------|
| `click` |             | `MouseEvent` |

## CSS Variables
| Variable              | Default                    |
|-----------------------|----------------------------|
| `--v-overlay-color`   | `var(--overlay-color)`     |
| `--v-overlay-z-index` | `500`                      |
