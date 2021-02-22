# Pagination

## Usage

```html
<v-pagination v-model="currentPage" :lenght="6" />
```

## Props

| Prop              | Description                                      | Default     | Type      |
| ----------------- | ------------------------------------------------ | ----------- | --------- |
| `disabled`        | Disables the pagination                          | `false`     | `Boolean` |
| `length`\*        | Length of the pagination component               | `null`      | `Number`  |
| `total-visible`   | Specify the max total visible pagination numbers | `undefined` | `Number`  |
| `value`           | Currently selected page                          | `null`      | `Number`  |
| `show-first-last` | Show first/last buttons                          | `false`     | `Boolean` |

## Events

| Event   | Description           | Value    |
| ------- | --------------------- | -------- |
| `input` | When the page changes | `number` |

## Slots

n/a

## CSS Variables

| Variable                      | Default          |
| ----------------------------- | ---------------- |
| `--v-pagination-active-color` | `var(--primary)` |
