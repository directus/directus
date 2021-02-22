# Detail

Allows for collapsable content

## Usage

```html
<v-detail />
```

## Props

| Prop         | Description         | Default            | Type      |
| ------------ | ------------------- | ------------------ | --------- |
| `active`     | Used with `v-model` | `undefined`        | `Boolean` |
| `label`      | Label of detail     | `i18n.t('toggle')` | `String`  |
| `start-open` |                     | `false`            | `Boolean` |
| `disabled`   |                     | `false`            | `Boolean` |

## Events

| Event    | Description                 | Value     |
| -------- | --------------------------- | --------- |
| `toggle` | New active value of divider | `boolean` |

## Slots

| Slot      | Description                   | Data                  |
| --------- | ----------------------------- | --------------------- |
| _default_ | Content of the detail section |                       |
| `title`   | Content to render in divider  | `{ active: boolean }` |

## CSS Variables

n/a
