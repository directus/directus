# Chip

```html
<v-chip>I'm a chip!</v-chip>
```

## Sizes

The chip component supports the following sizes through the use of props:

* x-small
* small
* (default)
* large
* x-large

```html
<v-chip x-small>I'm a chip!</v-chip>
```

## Colors

You can set the color, background color, hover color, and background hover color with the `color`, `background-color`, `hover-color`, and `hover-background-color` props respectively:

```html
<v-chip
	color="--red"
	background-color="--red-50"
	hover-color="--white"
	hover-background-color="--red"
>
	I'm a chip!
</v-chip>
```

## Events

There are two events, one when clicking on the chip called `click` and one when clicking on the enabled close icon called `close`.

```html
<v-chip @click="sayHi">Hello!</v-chip>
<v-chip close @close="close">I'm closeable!</v-chip>
```

| Event   | Description                                                                                    |
|---------|------------------------------------------------------------------------------------------------|
| `click` | Triggers when clicked somewhere on the chip                                                    |
| `close` | Triggers when the `close` prop is enabled and gets clicked (Doesn't trigger the `click` event) |

## Props

| Prop                     | Description                                          | Default                                 |
|--------------------------|------------------------------------------------------|-----------------------------------------|
| `active`                 | Change visibility. Can be reacted to via `sync`      | `true`                                  |
| `close`                  | Displays a close icon which triggers the close event | `false`                                 |
| `closeIcon`              | Which icon should be displayed instead of `close   ` | `close`                                 |
| `outlined`               | No background                                        | `false`                                 |
| `color`                  | Text color                                           | `--chip-primary-text-color`             |
| `hover-color`            | Text color on hover                                  | `--chip-primary-text-color`             |
| `background-color`       | Chip color                                           | `--chip-primary-background-color`       |
| `hover-background-color` | Chip color on hover                                  | `--chip-primary-background-color-hover` |
| `label`                  | Label style                                          | `false`                                 |
| `disabled`               | Disabled state                                       | `false`                                 |
| `x-small`                | Render extra small                                   | `false`                                 |
| `small`                  | Render small                                         | `false`                                 |
| `large`                  | Render large                                         | `false`                                 |
| `x-large`                | Render extra large                                   | `false`                                 |
