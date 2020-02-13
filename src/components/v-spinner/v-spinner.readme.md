# Spinner

```html
<v-spinner />
```

## Colors

The color of the spinner can be changed through the `--v-spinner-color` and `--v-spinner-background-color` css variable.

```html
<v-spinner style="--v-spinner-color: var(--red-400); --v-spinner-background-color: transparent" />
```

The background color can be set in similar fashion:

```html
<v-spinner/>
<style>
.v-spinner {
    --v-spinner-color: var(--red-100);
	--v-spinner-background-color: var(--red-600);
}
</style>
```


## Sizes

The spinner component supports the following sizes through the use of props:

* x-small
* small
* (default)
* large
* x-large

Alternatively, you can force the font-size through the `size` prop:

```html
<v-spinner x-small />
<v-spinner small />
<v-spinner />
<v-spinner large />
<v-spinner x-large />
<v-spinner :size="64" />
```

## Props
| Prop        | Description                       | Default                             |
|-------------|-----------------------------------|-------------------------------------|
| `x-small`   | Render extra small                | `false`                             |
| `small`     | Render small                      | `false`                             |
| `large`     | Render large                      | `false`                             |
| `x-large`   | Render extra large                | `false`                             |

## Slots
n/a

## Events
n/a

## CSS Variables
| Variable                       | Default                                  |
|--------------------------------|------------------------------------------|
| `--v-spinner-color`            | `var(--loading-background-color-accent)` |
| `--v-spinner-background-color` | `var(--loading-background-color)`        |
| `--v-spinner-speed`            | `1s`                                     |
| `--v-spinner-size`             | `28px`                                   |
| `--v-spinner-line-size`        | `3px`                                    |
