# Progress (circular)

```html
<v-progress-circular />
```

## Colors

The color of the circular progressbar can be changed through the `--v-progress-circular-color` and `--v-progress-circular-background-color` css variable.

```html
<v-progress-circular/>
<style>
.v-progress-circular {
    --v-progress-circular-color: var(--red-100);
	--v-progress-circular-background-color: var(--red-600);
}
</style>
```


## Sizes

The circular progress component supports the following sizes through the use of props:

* x-small
* small
* (default)
* large
* x-large

```html
<v-progress-circular x-small />
<v-progress-circular small />
<v-progress-circular />
<v-progress-circular large />
<v-progress-circular x-large />
```

## Props
| Prop           | Description                       | Default                             |
|----------------|-----------------------------------|-------------------------------------|
| `value`        | The percentage value              | `0`                                 |
| `indeterminate`| Displays the loading animation    | `false`                             |
| `x-small`      | Render extra small                | `false`                             |
| `small`        | Render small                      | `false`                             |
| `large`        | Render large                      | `false`                             |
| `x-large`      | Render extra large                | `false`                             |

## Slots
| Slot      | Description                          | Data |
|-----------|--------------------------------------|------|
| _default_ | Rendered in the center of the circle | --   |

## Events
n/a

## CSS Variables
| Variable                                 | Default                                  |
|------------------------------------------|------------------------------------------|
| `--v-progress-circular-color`            | `var(--loading-background-color-accent)` |
| `--v-progress-circular-background-color` | `var(--loading-background-color)`        |
| `--v-progress-circular-transition`       | `400ms`                                  |
| `--v-progress-circular-speed`            | `1s`                                     |
| `--v-progress-circular-size`             | `28px`                                   |
| `--v-progress-circular-line-size`        | `3px`                                    |
