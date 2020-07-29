# Input

```html
<v-textarea v-model="value" />
```

## Attributes & Events

The HTML `<textarea>` element supports a huge amount of attributes and events. In order to support all of these, all props that aren't specially handled (see list below) will be passed on to the `<textarea>` element directly. This allows you to change anything you want on the input.

## Props

| Prop              | Description                                                                    | Default |
| ----------------- | ------------------------------------------------------------------------------ | ------- |
| `placeholder`     | Text to show when no input is entered                                          | `null`  |
| `autofocus`       | Autofocusses the input on render                                               | `false` |
| `disabled`        | Set the disabled state for the input                                           | `false` |
| `full-width`      | Render the input with 100% width                                               | `false` |
| `value`           | Current value. Syncs with `v-model`                                            |         |
| `expand-on-focus` | Renders the textarea at regular input size, and expands to max-height on focus | `false` |
| `trim`            | Trim leading and trailing whitespace                                           | `true`  |

Note: all other attached attributes are bound to the input HTMLELement in the component. This allows you to attach any of the standard HTML attributes like `min`, `length`, or `pattern`.

## Slots

| Slot      | Description                                              | Data |
| --------- | -------------------------------------------------------- | ---- |
| `prepend` | Prepend elements before the text content in the textarea |      |
| `append`  | Append elements after the text content                   |      |

## Events

| Events  | Description       | Value |
| ------- | ----------------- | ----- |
| `input` | Updates `v-model` | `any` |

Note: all other listeners are bound to the input HTMLElement, allowing you to handle everything from `keydown` to `emptied`.

## CSS Variables

| Variable                   | Default                    |
| -------------------------- | -------------------------- |
| `--v-textarea-min-height`  | `none`                     |
| `--v-textarea-max-height`  | `var(--input-height-tall)` |
| `--v-textarea-height`      | `var(--input-height-tall)` |
| `--v-textarea-font-family` | `var(--family-sans-serif)` |
