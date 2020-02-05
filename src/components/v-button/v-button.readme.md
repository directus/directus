# Button

```html
<v-button>Click me!</v-button>
```

## Sizes

The button component supports the following sizes through the use of props:

* x-small
* small
* (default)
* large
* x-large

Alternatively, you can force the font-size through the `size` prop:

```html
<v-button :size="64">Click me!</v-button>
```

## Colors

You can set the color, background color, hover color, and background hover color with the `color`, `background-color`, `hover-color`, and `hover-background-color` props respectively:

```html
<v-button
	color="--red"
	background-color="--red-50"
	hover-color="--white"
	hover-background-color="--red"
>
	Click me
</v-button>
```

## Events

The only event that can be added to the button is the `click` event:

```html
<v-button @click="sayHi">Hello!</v-button>
```

## Loading

The button has a loading state that can be enabled with the `loading` prop. By default, the button will render a `v-spinner`. You can override what's being shown during the loading state by using the `#loading` slot:

```html
<v-button>
	<template #loading>
		... Almost done ...
	</template>
</v-button>
```

The loading slot is rendered _on top_ of the content that was there before. Make sure that your loading content doesn't exceed the size of the default state content. This restriction is put in place to prevent jumps when going from and to the loading state.

## Props

| Prop                     | Description                                                               | Default                                   |
|--------------------------|---------------------------------------------------------------------------|-------------------------------------------|
| `block`                  | Enable ull width (display block)                                          | `false`                                   |
| `icon`                   | Remove padding / min-width. Meant to be used with just an icon as content | `false`                                   |
| `outlined`               | No background                                                             | `false`                                   |
| `rounded`                | Enable rounded corners                                                    | `false`                                   |
| `color`                  | Text / icon color                                                         | `--button-primary-text-color`             |
| `hover-color`            | Text / icon color on hover                                                | `--button-primary-text-color`             |
| `background-color`       | Button color                                                              | `--button-primary-background-color`       |
| `hover-background-color` | Button color on hover                                                     | `--button-primary-background-color-hover` |
| `type`                   | HTML `type` attribute                                                     | `button`                                  |
| `disabled`               | Disabled state                                                            | `false`                                   |
| `loading`                | Loading state                                                             | `false`                                   |
| `width`                  | Width in px                                                               | --                                        |
| `size`                   | Size of the text in the button in px                                      | --                                        |
| `x-small`                | Render extra small                                                        | `false`                                   |
| `small`                  | Render small                                                              | `false`                                   |
| `large`                  | Render large                                                              | `false`                                   |
| `x-large`                | Render extra large                                                        | `false`                                   |

## Slots

| Slot      | Description                                  |
|-----------|----------------------------------------------|
| `loading` | Content that's rendered during loading state |
