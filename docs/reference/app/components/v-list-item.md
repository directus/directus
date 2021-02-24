## Reference

#### CSS Variables

| Variable                                | Default                                                               |
| --------------------------------------- | --------------------------------------------------------------------- |
| `--v-list-item-min-height-large`        | `40px`                                                                |
| `--v-list-item-min-height`              | `var(--v-list-item-min-height)`                                       |
| `--v-list-item-padding-large`           | `0 8px`                                                               |
| `--v-list-item-padding`                 | `0 8px 0 calc(8px + var(--v-list-item-indent, 0px))`                  |
| `--v-list-item-margin-large`            | `4px 0`                                                               |
| `--v-list-item-margin`                  | `2px 0`                                                               |
| `--v-list-item-min-width`               | `none`                                                                |
| `--v-list-item-max-width`               | `none`                                                                |
| `--v-list-item-max-height`              | `auto`                                                                |
| `--v-list-item-border-radius`           | `var(--border-radius)`                                                |
| `--v-list-item-margin-bottom`           | `0`                                                                   |
| `--v-list-item-color`                   | `var(--v-list-color, var(--foreground-normal))`                       |
| `--v-list-item-color-hover`             | `var(--v-list-color-hover, var(--foreground-normal))`                 |
| `--v-list-item-color-active`            | `var(--v-list-color-active, var(--foreground-normal))`                |
| `--v-list-item-background-color-hover`  | `var(--v-list-background-color-hover, var(--background-normal-alt))`  |
| `--v-list-item-background-color-active` | `var(--v-list-background-color-active, var(--background-normal-alt))` |

#### Props

| Prop       | Description | Default     | Type                 |
| ---------- | ----------- | ----------- | -------------------- |
| `large`    |             | `false`     | `Boolean`            |
| `dense`    |             | `false`     | `Boolean`            |
| `to`       |             | `null`      | `string or Location` |
| `href`     |             | `null`      | `String`             |
| `disabled` |             | `false`     | `Boolean`            |
| `active`   |             | `false`     | `Boolean`            |
| `dashed`   |             | `false`     | `Boolean`            |
| `exact`    |             | `false`     | `Boolean`            |
| `download` |             | `null`      | `String`             |
| `value`    |             | `undefined` | `[String, Number]`   |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
