# Overlay

```html
<v-overlay :active="overlay">
	<v-button @click="overlay = false">Close overlay</v-button>
</v-overlay>
```

The overlay is a fairly barebones component that's meant to be used with modals / confirms / other attention requiring actions.

## Color

The colors can be changed via the css variables `--v-overlay-color` and `--v-overlay-opacity`.

```html
<v-overlay :active="overlay">
	<v-button @click="overlay = false">Close overlay</v-button>
</v-overlay>
<style>
.v-overlay {
	--v-overlay-color: var(--red);
	--v-overlay-opacity: 0.5;
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
| `--v-overlay-color`   | `var(--modal-smoke-color)` |
| `--v-overlay-opacity` | `0.75`                     |
| `--v-overlay-z-index` | `500`                      |
