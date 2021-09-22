# Field Template

Similar to the v-field-select. Allows you to select fields or relational fields from a collection with the benefit of
being able to add text in between.

Models a template string like `My name is {name} and I'm {age} years old`.

```html
<v-field-template collection="articles" />
```

## Reference

#### Props

| Prop           | Description                                                | Default | Type      |
| -------------- | ---------------------------------------------------------- | ------- | --------- |
| `collection`\* | From where the fields should be selected                   |         | `String`  |
| `disabled`     | Disables this component                                    | `false` | `Boolean` |
| `value`        | Can be used to model the template string                   | `null`  | `String`  |
| `depth`        | If greater than `0`, it also considers relations of fields | `2`     | `Number`  |

#### Events

| Event   | Description                 | Value    |
| ------- | --------------------------- | -------- |
| `input` | The changed template string | `String` |
