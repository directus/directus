# Divider

Divides content. Made to be used in `v-list` or `v-tabs` components.

## Usage

```html
<v-divider />
```

## Props
| Prop       | Description                                         | Default |
|------------|-----------------------------------------------------|---------|
| `vertical` | Render the divider vertically                       | `false` |
| `inset`    | Insets the divider to align with the (list) content | `false` |

## Events
n/a

## Slots

| Slot      | Description                                                 | Data |
|-----------|-------------------------------------------------------------|------|
| _default_ | Label on the divider. This isn't rendered in vertical mode. |      |

## CSS Variables
| Variable            | Default                             |
|---------------------|-------------------------------------|
| `--v-divider-color` | `var(--foreground-color-tertiary)` |
