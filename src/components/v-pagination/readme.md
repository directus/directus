# Pagination

## Usage

```html
<v-pagination v-model="currentPage" :lenght="6" />
```

## Props
| Prop              | Description                                      | Default |
|-------------------|--------------------------------------------------|---------|
| `disabled`        | Disables the pagination                          | `false` |
| `length`*         | Length of the pagination component               |         |
| `total-visible`   | Specify the max total visible pagination numbers |         |
| `value`           | Currently selected page                          |         |
| `show-first-last` | Show first/last buttons                          | `false` |

## Events
| Event   | Description           | Value    |
|---------|-----------------------|----------|
| `input` | When the page changes | `number` |

## Slots
n/a

## CSS Variables
| Variable                      | Default         |
|-------------------------------|-----------------|
| `--v-pagination-active-color` | `var(--primary)` |
