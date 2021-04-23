# Icon

The icon component allows you to render any [Material Design Icons](https://material.io/icons). It also supports
rendering of custom SVG based icons.

## Sizes / Colors

The icon component supports multiple sizes and colors. The color prop accepts any valid CSS color. Color changes are
done via the css variable `--v-icon-color` like in the example below.

```html
<v-icon name="add" />
<style>
	.v-icon {
		--v-icon-color: var(--green-500);
	}
</style>
```

## Custom Size

If the default sizes don't give you the exact size you require, you can add the `size` prop with any custom pixel value.
Note: we recommend using one of the pre-defined sizes to ensure a consistent look across the platform.

## Outline

You can render the outline variant of the Material Icon by setting the `outline` property.

## Click events

When you add a click event to the icon, the icon will automatically add a pointer cursor.

## Left / Right

Oftentimes, you'll use the icon next to some text, for example in a button. When doing this, you can use the `left` /
`right` props to add some spacing to the icon:

```html
<v-button>
	<v-icon name="add" left />
	Add new
</v-button>
```

## Reference

#### Props

| Prop       | Description                          | Default | Type      |
| ---------- | ------------------------------------ | ------- | --------- |
| `name`\*   | Which icon to display                |         | `String`  |
| `filled`   | Removes the outline style if enabled | `false` | `Boolean` |
| `sup`      |                                      | `false` | `Boolean` |
| `left`     | Displays the icon more to the left   | `false` | `Boolean` |
| `right`    | Displays the icon more to the right  | `false` | `Boolean` |
| `disabled` | Disables the icon                    | `false` | `Boolean` |

#### CSS Variables

| Variable               | Default        |
| ---------------------- | -------------- |
| `--v-icon-color`       | `currentColor` |
| `--v-icon-color-hover` | `currentColor` |
| `--v-icon-size`        | `24px`         |

#### Events

| Event   | Description                     | Value |
| ------- | ------------------------------- | ----- |
| `click` | Fires when clicking on the icon |       |
