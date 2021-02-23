## Events

| Event           | Description | Value |
| --------------- | ----------- | ----- |
| `click`         |             |       |
| `item-selected` |             |       |

## Props

| Prop                 | Description | Default | Type       |
| -------------------- | ----------- | ------- | ---------- |
| `show-select`        |             | `false` | `Boolean`  |
| `show-manual-sort`   |             | `false` | `Boolean`  |
| `is-selected`        |             | `false` | `Boolean`  |
| `subdued`            |             | `false` | `Boolean`  |
| `sorted-manually`    |             | `false` | `Boolean`  |
| `has-click-listener` |             | `false` | `Boolean`  |
| `height`             |             | `48`    | `Number`   |
| `headers`\*          |             |         | `Header[]` |
| `item`\*             |             |         | `Object`   |

## Slots

| Slot                   | Description | Data |
| ---------------------- | ----------- | ---- |
| `item-append`          |             |      |
| `item.${header.value}` |             |      |
