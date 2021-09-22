# Progress Circular

Displays a circular progress bar as the name suggests. Can be used to show that something is loading or how much
something is done.

```html
<v-progress-circular indeterminate />
```

## Reference

#### Props

| Prop            | Description                                             | Default | Type      |
| --------------- | ------------------------------------------------------- | ------- | --------- |
| `indeterminate` | If set to true displays no value but spins indefinitely | `false` | `Boolean` |
| `value`         | Which value to represent going from 0 to 100            | `0`     | `Number`  |

#### CSS Variables

| Variable                                 | Default                    |
| ---------------------------------------- | -------------------------- |
| `--v-progress-circular-color`            | `var(--foreground-normal)` |
| `--v-progress-circular-background-color` | `var(--border-normal)`     |
| `--v-progress-circular-transition`       | `400ms`                    |
| `--v-progress-circular-speed`            | `2s`                       |
| `--v-progress-circular-size`             | `28px`                     |
| `--v-progress-circular-line-size`        | `3px`                      |

#### Events

| Event                | Description | Value |
| -------------------- | ----------- | ----- |
| `animationiteration` |             |       |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
