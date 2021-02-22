# Tags

## Options

| Option        | Description                                         | Default       |
| ------------- | --------------------------------------------------- | ------------- |
| `disabled`    | Disabled                                            | `false`       |
| `placeholder` | Text to show when no input is entered               | `null`        |
| `lowercase`   | Converts all tags to lowercase                      | `false`       |
| `alphabetize` | Alphabetizes tags, both in display and output       | `false`       |
| `iconLeft`    | Icon to appear on the inside left of the input box  | `null`        |
| `iconRight`   | Icon to appear on the inside right of the input box | `local_offer` |
| `allowCustom` | Allows the user to input their own tags             | `true`        |
| `presets`     | List of preset values users can choose from         | `[]`          |

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## Props

| Prop             | Description | Default         | Type                                                              |
| ---------------- | ----------- | --------------- | ----------------------------------------------------------------- |
| `disabled`       |             | `false`         | `Boolean`                                                         |
| `value`          |             | `null`          | `string[]`                                                        |
| `placeholder`    |             | `null`          | `String`                                                          |
| `whitespace`     |             | `null`          | `String`                                                          |
| `capitalization` |             | `null`          | `String as PropType<'uppercase' or 'lowercase' or 'auto-format'>` |
| `alphabetize`    |             | `false`         | `Boolean`                                                         |
| `icon-left`      |             | `null`          | `String`                                                          |
| `icon-right`     |             | `'local_offer'` | `String`                                                          |
| `presets`        |             | `null`          | `string[]`                                                        |
| `allow-custom`   |             | `true`          | `Boolean`                                                         |
