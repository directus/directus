# Input

Displays the usual input. Can be used to model strings and numbers.

```html
<v-input v-model="value" />
```

## Attributes & Events

The HTML `<input>` element supports a huge amount of attributes and events. In order to support all of these, all props
that aren't specially handled (see list below) will be passed on to the `<input>` element directly. This allows you to
change anything you want on the input.

## Prefixes / Suffixes

You can add any custom (text) prefix/suffix to the value in the input using the `prefix` and `suffix` slots.

## Reference

#### Props

| Prop             | Description                                                    | Default  | Type               |
| ---------------- | -------------------------------------------------------------- | -------- | ------------------ |
| `value`          | Used with `v-model` to mirror the entered value                | `null`   | `[String, Number]` |
| `autofocus`      | Autofocusses the input on render                               | `false`  | `Boolean`          |
| `disabled`       | Set the disabled state for the input                           | `false`  | `Boolean`          |
| `full-width`     | Render the input with 100% width                               | `true`   | `Boolean`          |
| `prefix`         | Prefix the users value with a value                            | `null`   | `String`           |
| `suffix`         | Show a value at the end of the input                           | `null`   | `String`           |
| `slug`           | Force the value to be URL safe                                 | `false`  | `Boolean`          |
| `slug-separator` | What character to use as separator in slugs                    | `'-'`    | `String`           |
| `active`         | Force the focus state                                          | `false`  | `Boolean`          |
| `trim`           | Trim the start and end whitespace                              | `false`  | `Boolean`          |
| `nullable`       | When active, sets an empty entry to null                       | `true`   | `Boolean`          |
| `type`           | Can be `text` or `number`                                      | `'text'` | `String`           |
| `max`            | The maximum number that can be entered                         | `null`   | `Number`           |
| `min`            | The minimum number that can be entered                         | `null`   | `Number`           |
| `step`           | In which unit steps should be counted up or down               | `1`      | `Number`           |
| `db-safe`        | Make the value save to be used with the DB                     | `false`  | `Boolean`          |
| `hide-arrows`    | Hide the arrows that are used to increase or decrease a number | `false`  | `Boolean`          |

Note: all other attached attributes are bound to the input HTMLElement in the component. This allows you to attach any
of the standard HTML attributes like `min`, `length`, or `pattern`.

#### Slots

| Slot            | Description                                       | Data                                              |
| --------------- | ------------------------------------------------- | ------------------------------------------------- |
| `prepend-outer` | Before the input                                  | `{ disabled: boolean, value: string or number; }` |
| `prepend`       | In the input, before the value, before the prefix | `{ disabled: boolean, value: string or number; }` |
| `append`        | In the input, after the value, after the suffix   | `{ disabled: boolean, value: string or number; }` |
| `append-outer`  | After the input                                   | `{ disabled: boolean, value: string or number; }` |
| `input`         |                                                   |                                                   |

#### CSS Variables

| Variable                      | Default                     |
| ----------------------------- | --------------------------- |
| `--v-input-font-family`       | `var(--family-sans-serif)`  |
| `--v-input-placeholder-color` | `var(--foreground-subdued)` |

#### Events

| Event     | Description                       | Value              |
| --------- | --------------------------------- | ------------------ |
| `click`   | Fires when the input gets clicked |                    |
| `keydown` | When a key has been pressed       |                    |
| `input`   | Updated the modeled value         | `String or Number` |
