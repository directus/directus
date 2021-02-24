# Field Select

Allows for easy selection of field inside a collection. Also works with relations inside a collection.

```html
<v-field-select collection="articles" v-model="selection" />
```

## Reference

#### Props

| Prop           | Description                                                | Default      | Type       |
| -------------- | ---------------------------------------------------------- | ------------ | ---------- |
| `collection`\* | From where the fields should be selected                   |              | `String`   |
| `disabled`     | Disables this component                                    | `false`      | `Boolean`  |
| `value`        | Can be used to model the selected field                    | `null`       | `string[]` |
| `depth`        | If greater than `0`, it also considers relations of fields | `1`          | `Number`   |
| `inject`       | Inject you own fields, collections or relations            | `() => ({})` | `Object`   |

#### Events

| Event   | Description           | Value      |
| ------- | --------------------- | ---------- |
| `input` | The changed selection | `string[]` |
