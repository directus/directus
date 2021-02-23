# Notice

```html
<v-notice>I'm a notice!</v-notice>
```

## Props

| Prop     | Description                                                        | Default    | Type                                                                           |
| -------- | ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| `type`   | One of `info`, `success`, `warning`, `danger`                      | `'normal'` | `String as PropType<'normal' or 'info' or 'success' or 'warning' or 'danger'>` |
| `icon`   | Custom icon name, or false if you want to hide the icon completely | `null`     | `[String, Boolean]`                                                            |
| `center` | Render notice content centered                                     | `false`    | `Boolean`                                                                      |

## CSS Variables

| Variable                      | Default                     |
| ----------------------------- | --------------------------- |
| `--v-notice-color`            | `var(--foreground-subdued)` |
| `--v-notice-background-color` | `var(--background-subdued)` |
| `--v-notice-icon-color`       | `var(--foreground-subdued)` |

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
