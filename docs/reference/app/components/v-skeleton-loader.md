# Skeleton Loader

Render a placeholder while the proper content is still loading.

```html
<v-skeleton-loader v-if="loading" />
```

## Props

| Prop   | Description                | Default   | Type     |
| ------ | -------------------------- | --------- | -------- |
| `type` | Whatever Rijk will tell me | `'input'` | `String` |

## CSS Variables

| Variable                               | Default                     |
| -------------------------------------- | --------------------------- |
| `--v-skeleton-loader-color`            | `var(--background-page)`    |
| `--v-skeleton-loader-background-color` | `var(--background-subdued)` |
