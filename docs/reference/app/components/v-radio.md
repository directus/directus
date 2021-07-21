# Radio

Classic radio buttons. Nothing special.

```html
<v-radio v-model="selected" value="red" />
<v-radio v-model="selected" value="blue" />
<v-radio v-model="selected" value="green" />
```

## Reference

#### Props

| Prop          | Description                                 | Default                    | Type      |
| ------------- | ------------------------------------------- | -------------------------- | --------- |
| `value`\*     | What value to represent when selected       |                            | `String`  |
| `input-value` | Selected value. Used as value for `v-model` | `null`                     | `String`  |
| `label`       | Label to render next to the radio           | `null`                     | `String`  |
| `disabled`    | Disable the radio button                    | `false`                    | `Boolean` |
| `icon-on`     | Change the icon to display when enabled     | `'radio_button_checked'`   | `String`  |
| `icon-off`    | Change the icon to display when disabled    | `'radio_button_unchecked'` | `String`  |
| `block`       | Render the radio in a block like style      | `false`                    | `Boolean` |

#### Events

| Event    | Description                                                   | Value    |
| -------- | ------------------------------------------------------------- | -------- |
| `change` | When the state of the radio button changes. Used in `v-model` | `string` |

#### Slots

| Slot    | Description                                                                       | Data |
| ------- | --------------------------------------------------------------------------------- | ---- |
| `label` | Custom override for label slot. Allows you to render custom markup in label slot. |      |

#### CSS Variables

| Variable          | Default          |
| ----------------- | ---------------- |
| `--v-radio-color` | `var(--primary)` |
