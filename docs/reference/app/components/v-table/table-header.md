## Events

| Event               | Description | Value |
| ------------------- | ----------- | ----- |
| `update:sort`       |             |       |
| `toggle-select-all` |             |       |
| `update:headers`    |             |       |

## Props

| Prop                   | Description | Default | Type                       |
| ---------------------- | ----------- | ------- | -------------------------- |
| `show-select`          |             | `false` | `Boolean`                  |
| `show-resize`          |             | `false` | `Boolean`                  |
| `show-manual-sort`     |             | `false` | `Boolean`                  |
| `some-items-selected`  |             | `false` | `Boolean`                  |
| `all-items-selected`   |             | `false` | `Boolean`                  |
| `fixed`                |             | `false` | `Boolean`                  |
| `must-sort`            |             | `false` | `Boolean`                  |
| `has-item-append-slot` |             | `false` | `Boolean`                  |
| `manual-sort-key`      |             | `null`  | `String`                   |
| `headers`\*            |             |         | `Header[]`                 |
| `sort`\*               |             |         | `Object as PropType<Sort>` |

## Slots

| Slot                     | Description | Data |
| ------------------------ | ----------- | ---- |
| `header.${header.value}` |             |      |
