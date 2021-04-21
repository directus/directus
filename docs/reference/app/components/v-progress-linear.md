# Progress Linear

Displays a linear progress bar. Can be used to show that something is loading or how much something is done.

```html
<v-progress-linear indeterminate />
```

## Reference

#### Props

| Prop            | Description                            | Default | Type      |
| --------------- | -------------------------------------- | ------- | --------- |
| `value`         | Which value to represent from 0 to 100 | `0`     | `Number`  |
| `absolute`      | Sets position to absolute              | `false` | `Boolean` |
| `fixed`         | Sets position to fixed                 | `false` | `Boolean` |
| `indeterminate` | Play a general loading animation       | `false` | `Boolean` |
| `rounded`       | Rounds up the corners of the progress  | `false` | `Boolean` |
| `top`           | Positions the bar at the top           | `false` | `Boolean` |
| `bottom`        | Positions the bar at the bottom        | `false` | `Boolean` |

#### CSS Variables

| Variable                               | Default                    |
| -------------------------------------- | -------------------------- |
| `--v-progress-linear-height`           | `4px`                      |
| `--v-progress-linear-color`            | `var(--foreground-normal)` |
| `--v-progress-linear-background-color` | `var(--border-normal)`     |
| `--v-progress-linear-transition`       | `400ms`                    |

#### Events

| Event                | Description | Value |
| -------------------- | ----------- | ----- |
| `animationiteration` |             |       |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
