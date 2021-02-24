# Detail

Use the detail component to hide not so important information or elements.

```html
<v-detail label="There is content hidden in me">
	<div>I'm hidden until you open the component</div>
</v-detail>
```

## Reference

#### Props

| Prop         | Description             | Default            | Type      |
| ------------ | ----------------------- | ------------------ | --------- |
| `active`     | Used with `v-model`     | `undefined`        | `Boolean` |
| `label`      | Label of detail         | `i18n.t('toggle')` | `String`  |
| `start-open` | Have it open by default | `false`            | `Boolean` |
| `disabled`   | Disable any interaction | `false`            | `Boolean` |

#### Events

| Event    | Description                 | Value     |
| -------- | --------------------------- | --------- |
| `toggle` | New active value of divider | `boolean` |

#### Slots

| Slot      | Description                   | Data                  |
| --------- | ----------------------------- | --------------------- |
| _default_ | Content of the detail section |                       |
| `title`   | Content to render in divider  | `{ active: boolean }` |

#### CSS Variables

n/a
