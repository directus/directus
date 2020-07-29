# Badge

```html
<v-badge value="2"><v-icon>ABC</v-icon></v-badge>
```

## Colors

You can set the color, background color and boder color with the `--v-badge-color`, `--v-badge-background-color` and `--v-badge-border-color` css vars respectively:

```html
<v-badge
	value="11"
	style="--v-badge-color: var(--red-500);"
>
	<v-icon>ABC</v-icon>
</v-badge>
```

## Props
| Prop       | Description                                                                  | Default |
|------------|------------------------------------------------------------------------------|---------|
| `value`    | The value that will be displayed inside the badge Only 2 characters allowed) | `null`  |
| `dot`      | Only will show a small dot without any content                               | `false` |
| `bordered` | Shows a border arround the badge                                             | `false` |
| `left`     | Aligns the badge on the left side                                            | `false` |
| `bottom`   | Aligns the badge on the bottom side                                          | `false` |
| `icon`     | Shows an icon instead of text                                                | `null`  |
| `disabled` | Don't render the badge                                                       | `false` |

## Slots
N/A

## Events
N/A

## CSS Variables
| Variable                     | Default                  |
|------------------------------|--------------------------|
| `--v-badge-color`            | `var(--white)`           |
| `--v-badge-background-color` | `var(--danger)`          |
| `--v-badge-border-color`     | `var(--background-page)` |
| `--v-badge-offset-x`         | `0px`                    |
| `--v-badge-offset-y`         | `0px`                    |
