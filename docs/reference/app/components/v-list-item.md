# List Item

Used inside a `v-list` to display an item inside the given list.

## Reference

#### Props

| Prop       | Description                                        | Default     | Type                 |
| ---------- | -------------------------------------------------- | ----------- | -------------------- |
| `value`    | What value to represent when active                | `undefined` | `[String, Number]`   |
| `large`    | If the item should be displayed larger             | `false`     | `Boolean`            |
| `dense`    | Makes the item smaller                             | `false`     | `Boolean`            |
| `to`       | Where the item should link to                      | `null`      | `string or Location` |
| `href`     | Same as `to` except that it takes an external link | `null`      | `String`             |
| `disabled` | Disables the item                                  | `false`     | `Boolean`            |
| `active`   | If the item should be active or not                | `false`     | `Boolean`            |
| `dashed`   | Adds a dashed style                                | `false`     | `Boolean`            |
| `exact`    |                                                    | `false`     | `Boolean`            |
| `download` |                                                    | `null`      | `String`             |

#

### CSS Variables

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

#### Slots

| Slot      | Description                 | Data |
| --------- | --------------------------- | ---- |
| _default_ | Where the item content goes |      |
