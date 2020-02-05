# Progress (Linear)

```html
<v-progress-linear :value="75" />
```

## Colors

The linear progress component supports colors. The color prop accepts any valid CSS color. CSS variable names can be passed as well, prefixed with `--`:

```html
<v-progress-linear color="red" background-color="black" />
<v-progress-linear color="#efefef" background-color="#ff00aa" />
<v-progress-linear color="rgba(0, 25, 89, 0.8)" background-color="papayawhip" />
<v-progress-linear color="--blue-grey-500" background-color="--blue-grey-200" />
```

## Indeterminate

The progress indicator can be rendered in indeterminate mode by passing the `indeterminate` prop. Use this when it's unclear when the progress will be done.

## Props

| Prop               | Description                                                           | Default                              |
|--------------------|-----------------------------------------------------------------------|--------------------------------------|
| `absolute`         | Applies `position: absolute`                                          | `false`                              |
| `background-color` | Sets the background color. Any CSS value or variable prefixed with -- | `--progress-background-color`        |
| `bottom`           | Align the progress bar to the bottom                                  | `false`                              |
| `color`            | Foreground color for the progress bar                                 | `--progress-background-color-accent` |
| `fixed`            | Applies `position: fixed;` to the element                             | `false`                              |
| `height`           | Sets the height (in px) for the progress bar                          | `4`                                  |
| `indeterminate`    | Animates the bar, use when loading progress is unknown                | `false`                              |
| `rounded`          | Add a border radius to the bar                                        | `false`                              |
| `top`              | Align progress bar to the top of the parent container                 | `false`                              |
| `value`            | Percentage value for current progress                                 | `0`                                  |

## Events
n/a

## Slots

The default slot can be used to render any value in the progress bar. Make sure to add the height prop to give the content some breathing room.
