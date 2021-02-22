# Dropdown

Pick one from a list of options.

## Options

| Option        | Description                            | Default |
| ------------- | -------------------------------------- | ------- |
| `placeholder` | Text to show when no input is entered  | `null`  |
| `allow-none`  | Allow the user to deselect the value   | `false` |
| `allow-other` | Allow the user to enter a custom value | `false` |
| `choices`     | What choices to present to the user    | `null`  |

## Props

| Prop          | Description | Default                    | Type       |
| ------------- | ----------- | -------------------------- | ---------- |
| `disabled`    |             | `false`                    | `Boolean`  |
| `value`       |             | `null`                     | `String`   |
| `choices`     |             | `null`                     | `Option[]` |
| `icon`        |             | `null`                     | `String`   |
| `allow-none`  |             | `false`                    | `Boolean`  |
| `placeholder` |             | `i18n.t('select_an_item')` | `String`   |
| `allow-other` |             | `false`                    | `Boolean`  |
