# Pagination

## Usage

```html
<v-pagination v-model="currentPage" :lenght="6" />
```

## Props

| Prop              | Description                                      | Default     | Type      |
| ----------------- | ------------------------------------------------ | ----------- | --------- |
| `disabled`        | Disables the pagination                          | `false`     | `Boolean` |
| `total-visible`   |                                                  | `undefined` | `Number`  |
| `value`           |                                                  | `null`      | `Number`  |
| `show-first-last` |                                                  | `false`     | `Boolean` |
| `total-visible`   | Specify the max total visible pagination numbers | `undefined` | `Number`  |
| `value`           | Currently selected page                          | `null`      | `Number`  |
| `show-first-last` | Show first/last buttons                          | `false`     | `Boolean` |
| `length`\*        |                                                  | `null`      | `Number`  |

## Events

| Event   | Description           | Value    |
| ------- | --------------------- | -------- |
| `input` | When the page changes | `number` |

## CSS Variables

| Variable                      | Default          |
| ----------------------------- | ---------------- |
| `--v-pagination-active-color` | `var(--primary)` |
