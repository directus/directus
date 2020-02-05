# Spinner

```html
<v-spinner />
```

## Colors

The color of the spinner can be changed through the `color` prop. This prop accepts any valid CSS color string, or a global CSS var prefixed with `--`:

```html
<v-spinner color="red" />
<v-spinner color="#abcabc" />
<v-spinner color="rgba(255, 125, 81, 0.2)" />
<v-spinner color="--amber" />
<v-spinner color="--danger" />
```

The background color can be set in similar fashion:

```html
<v-spinner background-color="red" />
<v-spinner background-color="#abcabc" />
<v-spinner background-color="rgba(255, 125, 81, 0.2)" />
<v-spinner background-color="--amber" />
<v-spinner background-color="--danger" />
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
| `color`     | Color of the spinner              | `--loading-background-color-accent` |
| `size`      | Size of the spinner in px         | --                                  |
| `line-size` | Size of the border of the spinner | --                                  |
| `speed`     | Speed of the spin animation       | `1s`                                |
| `x-small`   | Render extra small                | `false`                             |
| `small`     | Render small                      | `false`                             |
| `large`     | Render large                      | `false`                             |
| `x-large`   | Render extra large                | `false`                             |
