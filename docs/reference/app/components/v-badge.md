# Badge

Display a small dot in the corner of the component.

```html
<v-badge value="2"><v-icon>ABC</v-icon></v-badge>
```

## Colors

You can set the color, background color and border color with the `--v-badge-color`, `--v-badge-background-color` and
`--v-badge-border-color` css vars respectively:

```html
<v-badge value="11" style="--v-badge-color: var(--red-500);">
	<v-icon>ABC</v-icon>
</v-badge>
```

## Reference

#### Props

| Prop       | Description                                                                  | Default | Type               |
| ---------- | ---------------------------------------------------------------------------- | ------- | ------------------ |
| `value`    | The value that will be displayed inside the badge Only 2 characters allowed) | `null`  | `[String, Number]` |
| `dot`      | Only will show a small dot without any content                               | `false` | `Boolean`          |
| `bordered` | Shows a border around the badge                                              | `false` | `Boolean`          |
| `left`     | Aligns the badge on the left side                                            | `false` | `Boolean`          |
| `bottom`   | Aligns the badge on the bottom side                                          | `false` | `Boolean`          |
| `icon`     | Shows an icon instead of text                                                | `null`  | `String`           |
| `disabled` | Don't render the badge                                                       | `false` | `Boolean`          |

#### CSS Variables

| Variable                     | Default                  |
| ---------------------------- | ------------------------ |
| `--v-badge-color`            | `var(--white)`           |
| `--v-badge-background-color` | `var(--danger)`          |
| `--v-badge-border-color`     | `var(--background-page)` |
| `--v-badge-offset-x`         | `0px`                    |
| `--v-badge-offset-y`         | `0px`                    |
| `--v-badge-size`             | `16px`                   |

#### Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
