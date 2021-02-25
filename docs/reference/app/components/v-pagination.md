# Pagination

Add a pagination to a list or similar to allow for access to multiple pages.

## Usage

```html
<v-pagination v-model="currentPage" :length="6" />
```

## Reference

#### Props

| Prop              | Description                                      | Default     | Type      |
| ----------------- | ------------------------------------------------ | ----------- | --------- |
| `length`\*        | The amount of pages to render                    | `null`      | `Number`  |
| `value`           | Currently selected page                          | `null`      | `Number`  |
| `disabled`        | Disables the pagination                          | `false`     | `Boolean` |
| `total-visible`   | Specify the max total visible pagination numbers | `undefined` | `Number`  |
| `show-first-last` | Show first/last buttons                          | `false`     | `Boolean` |

#### Events

| Event   | Description           | Value    |
| ------- | --------------------- | -------- |
| `input` | When the page changes | `number` |

#### CSS Variables

| Variable                      | Default          |
| ----------------------------- | ---------------- |
| `--v-pagination-active-color` | `var(--primary)` |
