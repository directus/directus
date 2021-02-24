# Button

A simple button component to make your life interactive!

```html
<v-button>Click me!</v-button>
```

## Sizes

The button component supports the following sizes through the use of props:

- x-small
- small
- (default)
- large
- x-large

## Colors

You can set the color, background color, hover color, and background hover color with the `--v-button-color`,
`--v-button-background-color`, `--v-button-color-hover`, and `--v-button-background-color-hover` css variables
respectively:

```html
<v-button>Click me</v-button>

<style>
	.v-button {
		--v-button-color: var(--red);
		--v-button-background-color: var(--red-50);
		--v-button-color-hover: var(--white);
		--v-button-background-color-hover: var(--red);
	}
</style>
```

## Loading

The button has a loading state that can be enabled with the `loading` prop. By default, the button will render a
`v-spinner`. You can override what's being shown during the loading state by using the `#loading` slot:

```html
<v-button>
	<template #loading>... Almost done ...</template>
</v-button>
```

The loading slot is rendered _on top_ of the content that was there before. Make sure that your loading content doesn't
exceed the size of the default state content. This restriction is put in place to prevent jumps when going from and to
the loading state.

## Reference

#### Props

| Prop         | Description                                                               | Default    | Type                 |
| ------------ | ------------------------------------------------------------------------- | ---------- | -------------------- |
| `icon`       | Remove padding / min-width. Meant to be used with just an icon as content | `false`    | `Boolean`            |
| `outlined`   | No background                                                             | `false`    | `Boolean`            |
| `rounded`    | Enable rounded corners                                                    | `false`    | `Boolean`            |
| `type`       | HTML `type` attribute                                                     | `'button'` | `String`             |
| `disabled`   | Disabled state                                                            | `false`    | `Boolean`            |
| `loading`    | Loading state                                                             | `false`    | `Boolean`            |
| `to`         | Render as vue router-link                                                 | `null`     | `string or Location` |
| `href`       | Render as anchor                                                          | `null`     | `String`             |
| `align`      | Align content in button. One of `left                                     | `'center'` | `String`             |
| `dashed`     | Render the border dashed. Meant to be used with `outlined`.               | `false`    | `Boolean`            |
| `tile`       | Render without border radius                                              | `false`    | `Boolean`            |
| `download`   | Add the `download` attribute (used in combo with `href`)                  | `null`     | `String`             |
| `full-width` |                                                                           | `false`    | `Boolean`            |
| `exact`      |                                                                           | `false`    | `Boolean`            |
| `secondary`  |                                                                           | `false`    | `Boolean`            |
| `value`      |                                                                           | `null`     | `[Number, String]`   |

#### Slots

| Slot            | Description                                  | Data |
| --------------- | -------------------------------------------- | ---- |
| _default_       | Button content                               |      |
| `loading`       | Content that's rendered during loading state |      |
| `prepend-outer` | Content that's rendered before the button    |      |
| `append-outer`  | Content that's rendered after the button     |      |

#### Events

| Event   | Description           | Value        |
| ------- | --------------------- | ------------ |
| `click` | User clicks on button | `MouseEvent` |

#### CSS Variables

| Variable                                | Default                      |
| --------------------------------------- | ---------------------------- |
| `--v-button-width`                      | `auto`                       |
| `--v-button-height`                     | `44px`                       |
| `--v-button-color`                      | `var(--foreground-inverted)` |
| `--v-button-color-hover`                | `var(--foreground-inverted)` |
| `--v-button-color-activated`            | `var(--foreground-inverted)` |
| `--v-button-color-disabled`             | `var(--foreground-subdued)`  |
| `--v-button-background-color`           | `var(--primary)`             |
| `--v-button-background-color-hover`     | `var(--primary-125)`         |
| `--v-button-background-color-activated` | `var(--primary)`             |
| `--v-button-background-color-disabled`  | `var(--background-normal)`   |
| `--v-button-font-size`                  | `16px`                       |
| `--v-button-font-weight`                | `600`                        |
| `--v-button-line-height`                | `22px`                       |
| `--v-button-min-width`                  | `140px`                      |
