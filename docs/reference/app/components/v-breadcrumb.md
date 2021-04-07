# Breadcrumb

A breadcrumb can help you display on what site you are currently on by displaying a structure like `my / custom / page`.

```html
<v-breadcrumb :items="[{name: 'Collections', to: '/collections'}]" />
```

## Breadcrumb Item

An item for the items prop has these 4 options:

| Prop       | Description                                               |
| ---------- | --------------------------------------------------------- |
| `to`       | The reroute link                                          |
| `name`     | The name which will be displayed                          |
| `icon`     | Displays an icon with the given name in front of the name |
| `disabled` | If the router link should be clickable                    |

## Reference

#### Props

| Prop    | Description                                              | Default    | Type           |
| ------- | -------------------------------------------------------- | ---------- | -------------- |
| `items` | An array of objects which information about each section | `() => []` | `Breadcrumb[]` |

#### CSS Variables

| Variable                        | Default                     |
| ------------------------------- | --------------------------- |
| `--v-breadcrumb-color`          | `var(--foreground-subdued)` |
| `--v-breadcrumb-color-hover`    | `var(--foreground-normal)`  |
| `--v-breadcrumb-color-disabled` | `var(--foreground-subdued)` |
| `--v-breadcrumb-divider-color`  | `var(--foreground-subdued)` |
