# Divider

Divides content. Made to be used in `v-list` or `v-tabs` components.

```html
<v-divider>New Section</v-divider>
```

## Reference

#### Props

| Prop           | Description                                           | Default | Type      |
| -------------- | ----------------------------------------------------- | ------- | --------- |
| `vertical`     | Render the divider vertically                         | `false` | `Boolean` |
| `inline-title` | Render the title inline with the divider, or under it | `true`  | `Boolean` |
| `large`        | Renders a larger divider                              | `false` | `Boolean` |

#### Events

n/a

#### Slots

| Slot      | Description                                                              | Data |
| --------- | ------------------------------------------------------------------------ | ---- |
| _default_ | Label on the divider. This isn't rendered in vertical mode.              |      |
| `icon`    | Icon on the divider. Rendered in all modes, inline with title if present |      |

#### CSS Variables

| Variable                  | Default                        |
| ------------------------- | ------------------------------ |
| `--v-divider-color`       | `var(--border-normal)`         |
| `--v-divider-label-color` | `var(--foreground-normal-alt)` |
