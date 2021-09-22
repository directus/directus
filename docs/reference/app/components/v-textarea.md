# Textarea

Renders a textarea in which multiline text can be entered.

```html
<v-textarea v-model="value" />
```

## Attributes & Events

The HTML `<textarea>` element supports a huge amount of attributes and events. In order to support all of these, all
props that aren't specially handled (see list below) will be passed on to the `<textarea>` element directly. This allows
you to change anything you want on the input.

## Reference

#### Props

| Prop              | Description                                                                    | Default | Type      |
| ----------------- | ------------------------------------------------------------------------------ | ------- | --------- |
| `placeholder`     | Text to show when no input is entered                                          | `null`  | `String`  |
| `autofocus`       | Autofocusses the input on render                                               | `false` | `Boolean` |
| `disabled`        | Set the disabled state for the input                                           | `false` | `Boolean` |
| `full-width`      | Render the input with 100% width                                               | `true`  | `Boolean` |
| `value`           | Current value. Syncs with `v-model`                                            | `null`  | `String`  |
| `expand-on-focus` | Renders the textarea at regular input size, and expands to max-height on focus | `false` | `Boolean` |
| `trim`            | Trim leading and trailing whitespace                                           | `false` | `Boolean` |

Note: all other attached attributes are bound to the input HTMLElement in the component. This allows you to attach any
of the standard HTML attributes like `min`, `length`, or `pattern`.

#### Slots

| Slot      | Description                                              | Data |
| --------- | -------------------------------------------------------- | ---- |
| `prepend` | Prepend elements before the text content in the textarea |      |
| `append`  | Append elements after the text content                   |      |

#### CSS Variables

| Variable                   | Default                    |
| -------------------------- | -------------------------- |
| `--v-textarea-min-height`  | `none`                     |
| `--v-textarea-max-height`  | `var(--input-height-tall)` |
| `--v-textarea-height`      | `var(--input-height-tall)` |
| `--v-textarea-font-family` | `var(--family-sans-serif)` |

#### Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |
