# Input

```html
<v-input v-model="value" />
```

## Attributes & Events

The HTML `<input>` element supports a huge amount of attributes and events. In order to support all of these, all props
that aren't specially handled (see list below) will be passed on to the `<input>` element directly. This allows you to
change anything you want on the input.

## Prefixes / Suffixes

You can add any custom (text) prefix/suffix to the value in the input using the `prefix` and `suffix` slots.

## Props

| Prop                                | Description                                 | Default  | Type               |
| ----------------------------------- | ------------------------------------------- | -------- | ------------------ |
| `autofocus`                         | Autofocusses the input on render            | `false`  | `Boolean`          |
| `disabled`                          | Set the disabled state for the input        | `false`  | `Boolean`          |
| `full-width`                        | Render the input with 100% width            | `true`   | `Boolean`          |
| `prefix`                            | Prefix the users value with a value         | `null`   | `String`           |
| `suffix`                            | Show a value at the end of the input        | `null`   | `String`           |
| `slug`                              | Force the value to be URL safe              | `false`  | `Boolean`          |
| `slug-separator`                    | What character to use as separator in slugs | `'-'`    | `String`           |
| `active`                            | Force the focus state                       | `false`  | `Boolean`          |
| `trim`                              | Trim the start and end whitespace           | `false`  | `Boolean`          |
| `value`                             |                                             | `null`   | `[String, Number]` |
| `nullable`                          |                                             | `true`   | `Boolean`          |
| `type`                              |                                             | `'text'` | `String`           |
| `//-fornumberinputsonlyhide-arrows` |                                             | `false`  | `Boolean`          |
| `max`                               |                                             | `null`   | `Number`           |
| `min`                               |                                             | `null`   | `Number`           |
| `step`                              |                                             | `1`      | `Number`           |
| `db-safe`                           |                                             | `false`  | `Boolean`          |

Note: all other attached attributes are bound to the input HTMLELement in the component. This allows you to attach any
of the standard HTML attributes like `min`, `length`, or `pattern`.

## Slots

| Slot            | Description                                       | Data                                |
| --------------- | ------------------------------------------------- | ----------------------------------- | ---------- |
| `prepend-outer` | Before the input                                  | `{ disabled: boolean, value: string | number; }` |
| `prepend`       | In the input, before the value, before the prefix | `{ disabled: boolean, value: string | number; }` |
| `append`        | In the input, after the value, after the suffix   | `{ disabled: boolean, value: string | number; }` |
| `append-outer`  | After the input                                   | `{ disabled: boolean, value: string | number; }` |
| `input`         |                                                   |                                     |
