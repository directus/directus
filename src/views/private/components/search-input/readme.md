# Search Input

Renders as a standard header toggle button, expands into a full search bar. Should ideally be used
in the last position in the header bar actions slot (left most action).

## Usage

```html
<search-filter v-model="searchQuery" />
```

## Props
| Prop    | Description                  | Default |
|---------|------------------------------|---------|
| `value` | Value for use with `v-model` | `null`  |

## Events
| Event   | Description                      | Value    |
|---------|----------------------------------|----------|
| `input` | Input event, used with `v-model` | `string` |

## Slots
n/a

## CSS Variables
n/a
