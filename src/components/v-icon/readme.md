# Icon

The icon component allows you to render any [Material Design Icons](https://material.io/icons). It also supports rendering of custom SVG based icons.

## Sizes / Colors

The icon component supports multiple sizes and colors. The color prop accepts any valid CSS color. Color changes are done via the css variable `--v-icon-color` like in the example below.

```html
<v-icon name="add"/>
<style>
.v-icon {
	--v-icon-color: var(--green-500);
}
</style>
```

| Prop Name      | Size in PX |
|----------------|------------|
| `sup`          | 8          |
| `x-small`      | 12         |
| `small`        | 18         |
| None (default) | 24         |
| `large`        | 36         |
| `x-large`      | 48         |

The `sup` size is meant to be used as superscript. For example the required state flag.

## Custom Size
If the default sizes don't give you the exact size you require, you can add the `size` prop with any
custom pixel value. Note: we recommend using one of the pre-defined sizes to ensure a consistent look
across the platform.

## Outline
You can render the outline variant of the Material Icon by setting the `outline` property.

## Click events
When you add a click event to the icon, the icon will automatically add a pointer cursor.

## Left / Right
Oftentimes, you'll use the icon next to some text, for example in a button. When doing this, you can use the `left` / `right` props to add some spacing to the icon:

```html
<v-button>
	<v-icon name="add" left> Add new
</v-button>
```

## Props
| Name        | Description                                                       | Default |
|-------------|-------------------------------------------------------------------|---------|
| `name`*     | Name of the icon                                                  | --      |
| `outline`   | Use outline Material Icons. Note: only works for non-custom icons | `false` |
| `size`      | Custom pixel size                                                 | `false` |
| `x-small`   | Render the icon extra small                                       | `false` |
| `small`     | Render the icon small                                             | `false` |
| `large`     | Render the icon large                                             | `false` |
| `x-large`   | Render the icon extra large                                       | `false` |
| `left`      | Use when icon is left of text                                     | `false` |
| `right`     | Use when icon is right of text                                    | `false` |
| `disabledd` | Prevent the click handler from firing                             | `false` |

## Events
| Event   | Description          | Data         |
|---------|----------------------|--------------|
| `click` | Standard click event | `MouseEvent` |

## Slots
n/a

## CSS Variables
| Variable         | Default        |
|------------------|----------------|
| `--v-icon-color` | `currentColor` |
| `--v-icon-size`  | `24px`         |
