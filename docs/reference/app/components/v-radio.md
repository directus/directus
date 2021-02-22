# Radio

Classic radio buttons. Nothing special.

## Usage

```html
<v-radio v-model="selected" value="red" />
<v-radio v-model="selected" value="blue" />
<v-radio v-model="selected" value="green" />
```

## Props

| Prop          | Description                                 | Default                                      | Type      |
| ------------- | ------------------------------------------- | -------------------------------------------- | --------- | -------- | --- |
| <!--          | `value`\*                                   | What value to save in `v-model` when checked |           | `String` | --> |
| `input-value` | Selected value. Used as value for `v-model` | `null`                                       | `String`  |
| `label`       | Label to render next to the radio           | `null`                                       | `String`  |
| `disabled`    | Disable the radio button                    | `false`                                      | `Boolean` |
| `icon-on`     |                                             | `'radio_button_checked'`                     | `String`  |
| `icon-off`    |                                             | `'radio_button_unchecked'`                   | `String`  |
| `block`       |                                             | `false`                                      | `Boolean` |
| `value`\*     |                                             |                                              | `String`  |

## Events

| Event    | Description                                                   | Value    |
| -------- | ------------------------------------------------------------- | -------- |
| `change` | When the state of the radio button changes. Used in `v-model` | `string` |

## Slots

| Slot    | Description                                                                       | Data |
| ------- | --------------------------------------------------------------------------------- | ---- |
| `label` | Custom override for label slot. Allows you to render custom markup in label slot. |      |

## CSS Variables

| Variable          | Default          |
| ----------------- | ---------------- |
| `--v-radio-color` | `var(--primary)` |
