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

## Colors

You can set the color, background color, hover color, and background hover color with the `--v-button-color`, `--v-button-background-color`, `--v-button-hover-color`, and `--v-button-hover-background-color` css variables respectively:

```html
<v-button>Click me</v-button>

<style>
.v-button {
	--v-button-color: var(--red);
	--v-button-background-color: var(--red-50);
	--v-button-hover-color: var(--white);
	--v-button-hover-background-color: var(--red);
}
</style>
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
| `type`                   | HTML `type` attribute                                                     | `button`                                  |
| `disabled`               | Disabled state                                                            | `false`                                   |
| `loading`                | Loading state                                                             | `false`                                   |
| `size`                   | Size of the text in the button in px                                      | --                                        |
| `x-small`                | Render extra small                                                        | `false`                                   |
| `small`                  | Render small                                                              | `false`                                   |
| `large`                  | Render large                                                              | `false`                                   |
| `x-large`                | Render extra large                                                        | `false`                                   |

## Slots

| Slot      | Description                                  |
|-----------|----------------------------------------------|
| _default_ | Button content |
| `loading` | Content that's rendered during loading state |

## Events

| Event   | Description           | Value        |
|---------|-----------------------|--------------|
| `click` | User clicks on button | `MouseEvent` |

## CSS Variables

| Variable                            | Default                                        |
|-------------------------------------|------------------------------------------------|
| `--v-button-width`                  | `auto`                                         |
| `--v-button-height`                 | `44px`                                         |
| `--v-button-color`                  | `var(--button-primary-text-color)`             |
| `--v-button-background-color`       | `var(--button-primary-background-color)`       |
| `--v-button-hover-color`            | `var(--button-primary-text-color)`             |
| `--v-button-hover-background-color` | `var(--button-primary-background-color-hover)` |
| `--v-button-font-size`              | `16px`                                         |
