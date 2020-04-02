# Progress (Linear)

```html
<v-progress-linear :value="75" />
```

## Colors

The linear progress component supports colors. Colors can be changed via the css variables `--v-progress-linear-color` and `--v-progress-linear-background-color`

```html
<v-progress-linear />
<style>
.v-overlay {
	--v-progress-linear-color: red;
	--v-progress-linear-background-color: var(--black);
}
</style>
```

## Indeterminate

The progress indicator can be rendered in indeterminate mode by passing the `indeterminate` prop. Use this when it's unclear when the progress will be done.

## Props
| Prop               | Description                                                           | Default                              |
|--------------------|-----------------------------------------------------------------------|--------------------------------------|
| `absolute`         | Applies `position: absolute`                                          | `false`                              |
| `bottom`           | Align the progress bar to the bottom                                  | `false`                              |
| `fixed`            | Applies `position: fixed;` to the element                             | `false`                              |
| `indeterminate`    | Animates the bar, use when loading progress is unknown                | `false`                              |
| `rounded`          | Add a border radius to the bar                                        | `false`                              |
| `top`              | Align progress bar to the top of the parent container                 | `false`                              |
| `value`            | Percentage value for current progress                                 | `0`                                  |

## Events
n/a

## Slots
| Slots     | Description | Value |
|-----------|-------------|-------|
| _default_ |             | --    |

## CSS Variables
| Variable                               | Default                         |
|----------------------------------------|---------------------------------|--|
| `--v-progress-linear-height`           | `4px`                           |
| `--v-progress-linear-color`            | `var(--foreground-normal)` |
| `--v-progress-linear-background-color` | `var(--border-normal)`     |
