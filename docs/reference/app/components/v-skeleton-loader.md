# Skeleton Loader

Render a placeholder while the proper content is still loading.

```html
<v-skeleton-loader v-if="loading" />
```

## Reference

#### Props

| Prop   | Description                         | Default   | Type     |
| ------ | ----------------------------------- | --------- | -------- |
| `type` | Name of another component to mirror | `'input'` | `String` |

#### CSS Variables

| Variable                               | Default                     |
| -------------------------------------- | --------------------------- |
| `--v-skeleton-loader-color`            | `var(--background-page)`    |
| `--v-skeleton-loader-background-color` | `var(--background-subdued)` |
