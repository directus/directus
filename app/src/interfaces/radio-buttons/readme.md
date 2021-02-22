# Radio Buttons

## Options

| Option        | Description                                         | Default                  |
| ------------- | --------------------------------------------------- | ------------------------ |
| `choices`     | What choices to render as radios                    | `null`                   |
| `allow-other` | Allow the user to enter a custom value              | `false`                  |
| `icon-on`     | What icon to show when the radio is checked         | `radio_button_checked`   |
| `icon-off`    | What icon to show when the radio is unchecked       | `radio_button_unchecked` |
| `color`       | What color to use for the active state of the radio | `var(--primary)`         |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## Props

| Prop          | Description | Default                    | Type       |
| ------------- | ----------- | -------------------------- | ---------- |
| `disabled`    |             | `false`                    | `Boolean`  |
| `value`       |             | `null`                     | `String`   |
| `choices`     |             | `null`                     | `Option[]` |
| `allow-other` |             | `false`                    | `Boolean`  |
| `width`       |             | `null`                     | `String`   |
| `icon-on`     |             | `'radio_button_checked'`   | `String`   |
| `icon-off`    |             | `'radio_button_unchecked'` | `String`   |
| `color`       |             | `'var(--primary)'`         | `String`   |
