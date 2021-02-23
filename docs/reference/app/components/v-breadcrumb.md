# Breadcrumb

```html
<v-breadcrumb :items="[{name: 'Collections', to: '/collections'}]" />
```

## Props

| Prop    | Description                                              | Default                                                   | Type           |
| ------- | -------------------------------------------------------- | --------------------------------------------------------- | -------------- | --- | --- |
| `items` | An array of objects which information about each section | `() => []`                                                | `Breadcrumb[]` |
| <!--    | `items.to`                                               | The reroute link                                          | `''`           |     | --> |
| <!--    | `items.name`                                             | The name which will be displayed                          | `''`           |     | --> |
| <!--    | `items.icon`                                             | Displays an icon with the given name in front of the name | `''`           |     | --> |
| <!--    | `items.disabled`                                         | If the router link should be clickable                    | `false`        |     | --> |

## CSS Variables

| Variable                        | Default                     |
| ------------------------------- | --------------------------- |
| `--v-breadcrumb-color`          | `var(--foreground-subdued)` |
| `--v-breadcrumb-color-hover`    | `var(--foreground-normal)`  |
| `--v-breadcrumb-color-disabled` | `var(--foreground-subdued)` |
| `--v-breadcrumb-divider-color`  | `var(--foreground-subdued)` |
