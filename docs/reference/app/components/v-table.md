## CSS Variables

| Variable                      | Default                    |
| ----------------------------- | -------------------------- |
| `--v-table-height`            | `auto`                     |
| `--v-table-sticky-offset-top` | `0`                        |
| `--v-table-color`             | `var(--foreground-normal)` |
| `--v-table-background-color`  | `var(--background-page)`   |

## Events

| Event            | Description | Value |
| ---------------- | ----------- | ----- |
| `update:headers` |             |       |
| `update:sort`    |             |       |
| `update:items`   |             |       |
| `item-selected`  |             |       |
| `select`         |             |       |
| `manual-sort`    |             |       |

## Props

| Prop                 | Description | Default              | Type                       |
| -------------------- | ----------- | -------------------- | -------------------------- |
| `headers`\*          |             |                      | `HeaderRaw[]`              |
| `items`\*            |             |                      | `Item[]`                   |
| `item-key`           |             | `'id'`               | `String`                   |
| `sort`               |             | `null`               | `Object as PropType<Sort>` |
| `must-sort`          |             | `false`              | `Boolean`                  |
| `show-select`        |             | `false`              | `Boolean`                  |
| `show-resize`        |             | `false`              | `Boolean`                  |
| `show-manual-sort`   |             | `false`              | `Boolean`                  |
| `manual-sort-key`    |             | `null`               | `String`                   |
| `selection`          |             | `() => []`           | `any`                      |
| `fixed-header`       |             | `false`              | `Boolean`                  |
| `loading`            |             | `false`              | `Boolean`                  |
| `loading-text`       |             | `i18n.t('loading')`  | `String`                   |
| `no-items-text`      |             | `i18n.t('no_items')` | `String`                   |
| `server-sort`        |             | `false`              | `Boolean`                  |
| `row-height`         |             | `48`                 | `Number`                   |
| `selection-use-keys` |             | `false`              | `Boolean`                  |
| `inline`             |             | `false`              | `Boolean`                  |
| `disabled`           |             | `false`              | `Boolean`                  |

## Slots

| Slot                     | Description | Data |
| ------------------------ | ----------- | ---- |
| `header.${header.value}` |             |      |
