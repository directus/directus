# Notice

```html
<v-notice>I'm a notice!</v-notice>
```

## Props
| Prop      | Description                                                        | Default |
|-----------|--------------------------------------------------------------------|---------|
| `type`    | One of `info`, `success`, `warning`, `danger`                      | `info`  |
| `icon`    | Custom icon name, or false if you want to hide the icon completely | `null`  |
| `center`  | Render notice content centered                                     | `false` |

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             | --   |

## Events
n/a

## CSS Variables
| Variable                      | Default                     |
|-------------------------------|-----------------------------|
| `--v-notice-color`            | `var(--foreground-subdued)` |
| `--v-notice-background-color` | `var(--background-subdued)` |
| `--v-notice-icon-color`       | `var(--foreground-subdued)` |
