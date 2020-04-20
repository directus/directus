# Divider

Divides content. Made to be used in `v-list` or `v-tabs` components.

## Usage

```html
<v-divider />
```

## Props

| Prop          | Description                                           | Default |
| ------------- | ----------------------------------------------------- | ------- |
| `vertical`    | Render the divider vertically                         | `false` |
| `inlineTitle` | Render the title inline with the divider, or under it | `true`  |

## Events

n/a

## Slots

| Slot      | Description                                                              | Data |
|-----------|--------------------------------------------------------------------------|------|
| _default_ | Label on the divider. This isn't rendered in vertical mode.              |      |
| `icon`    | Icon on the divider. Rendered in all modes, inline with title if present |      |

## CSS Variables

| Variable                  | Default                     |
| ------------------------- | --------------------------- |
| `--v-divider-color`       | `var(--border-normal)`      |
| `--v-divider-label-color` | `var(--foreground-subdued)` |
