# List

```html
<v-list>
	<v-list-item v-for="item in items">
		<v-list-item-content>
			{{ item.text }}
		</v-list-item-content>
	</v-list-item>
</v-list>
```

## Subcomponents

### List Item

A wrapper for list items that formats children nicely. Can be used on its own or inside a list component. Best used with subcomponents (see below).

### List Item Content

A wrapper for the main text content of a list item. It adds some padding and helps control overflow. The parent of `v-list-title` and `v-list-subtitle` components, it's also the main controller of the `dense` option on lists.

### List Item Title

Wrapper that adds typographic styling and margin for the title of the list item. Responsive to `dense` styling.

### List Item Subtitle

Wrapper that adds typographic styling and margin for the subtitle/description of the list item. Responsive to `dense` and `threeLine` props.

```html
<v-list-item v-for="item in items">
	<v-list-item-content>
		<v-list-item-title>{{ item.title }}<v-list-item-title>
		<v-list-item-subtitle>{{ item.description }}<v-list-item-subtitle>
	</v-list-item-content>
</v-list-item>
```

### List Item Icon

Wrapper for icon, action, or avatar type elements in a list item. Can be used on the left or right of an item.

```html
<v-list-item v-for="item in items">
	<v-list-item-icon><v-icon name="info"></v-list-item-icon>
	<v-list-item-content>
		<v-list-item-title>{{ item.title }}<v-list-item-title>
	</v-list-item-content>
</v-list-item>
```

## Colors

You can set the default, active, and hover colors and background colors with css variables. You can also set them on individual list items, which will override the list vars. Hover styles will only be set if the list item has a to link or an onClick handler.

```html
<v-list>
	<v-list-item v-for="item in items">
		<v-list-item-content>
			{{ item.text }}
		</v-list-item-content>
	</v-list-item>
</v-list>

<style>
	.v-list {
		--v-list-color: var(--red);
		--v-list-color-hover: var(--white);
		--v-list-color-active: var(--white);
		--v-list-background-color: var(--red-50);
		--v-list-background-color-hover: var(--red-100);
		--v-list-background-color-active: var(--red-800);
	}
</style>
```

## Props

### List (`v-list`)

| Prop        | Description                                                                                                 | Default |
|-------------|-------------------------------------------------------------------------------------------------------------|---------|
| `dense`     | Removes some padding to make the list items closer together                                                 | `false` |
| `threeLine` | Limits list items to three lines of text (1 of title, 2 of subtitle). Only works in webkit enabled browsers | `false` |
| `nav`       | Adds a small margin and border-radius for nav menu styling                                                  | `false` |

### List Item (`v-list-item`)

| Prop        | Description                                                                                                | Default |
|-------------|------------------------------------------------------------------------------------------------------------|---------|
| `dense`     | Removes some padding to make the individual list item shorter                                              | `false` |
| `threeLine` | Limits list item to three lines of text (1 of title, 2 of subtitle). Only works in webkit enabled browsers | `false` |
| `to`        | Render as vue router-link with to link                                                                     | `null`  |

### List Item Content (`v-list-item-content`)

### List Item Title (`v-list-item-title`)

### List Item Subtitle (`v-list-item-subtitle`)

n/a

### List Item Icon (`v-list-item-icon`)

| Prop     | Description                                                         | Default |
|----------|---------------------------------------------------------------------|---------|
| `center` | Whether to center the element (good for action elements or avatars) | `false` |

## Slots

### List (`v-list`)

### List Item (`v-list-item`)

### List Item Content (`v-list-item-content`)

### List Item Title (`v-list-item-title`)

### List Item Subtitle (`v-list-item-subtitle`)

### List Item Icon (`v-list-item-icon`)

| Slot      | Description   |
|-----------|---------------|
| _default_ | Content, etc. |

## Events

n/a

## CSS Variables

### List (`v-list`)

| Variable                           | Default                          |
|------------------------------------|----------------------------------|
| `--v-list-padding`                 | `8px 0`                          |
| `--v-list-max-height`              | `none`                           |
| `--v-list-max-width`               | `none`                           |
| `--v-list-min-width`               | `none`                           |
| `--v-list-min-height`              | `none`                           |
| `--v-list-color`                   | `var(--foreground-color)`        |
| `--v-list-color-hover`             | `var(--foreground-color)`        |
| `--v-list-color-active`            | `var(--foreground-color)`        |
| `--v-list-background-color`        | `var(--background-color)`        |
| `--v-list-background-color-hover`  | `var(--background-color-hover)`  |
| `--v-list-background-color-active` | `var(--background-color-active)` |

### List Item (`v-list-item`)

| Variable                                | Default                                                               |
|-----------------------------------------|-----------------------------------------------------------------------|
| `--v-list-item-padding`                 | `0 16px`                                                              |
| `--v-list-item-min-width`               | `none`                                                                |
| `--v-list-item-max-width`               | `none`                                                                |
| `--v-list-item-min-height`              | `48px`                                                                |
| `--v-list-item-max-height`              | `auto`                                                                |
| `--v-list-item-border-radius`           | `0`                                                                   |
| `--v-list-item-margin-bottom`           | `0`                                                                   |
| `--v-list-item-color`                   | `var(--v-list-color, var(--foreground-color))`                        |
| `--v-list-item-color-hover`             | `var(--v-list-color-hover, var(--foreground-color))`                  |
| `--v-list-item-color-active`            | `var(--v-list-color-active, var(--foreground-color))`                 |
| `--v-list-item-background-color`        | `var(--v-list-background-color, var(--background-color))`             |
| `--v-list-item-background-color-hover`  | `var(---list-background-color-hover, var(--background-color-hover))`  |
| `--v-list-item-background-color-active` | `var(--vlist-background-color-active,var(--background-color-active))` |

### List Item Content (`v-list-item-content`)

| Variable                        | Default  |
|---------------------------------|----------|
| `--v-list-item-content-padding` | `12px 0` |

### List Item Title (`v-list-item-title`)

### List Item Subtitle (`v-list-item-subtitle`)

### List Item Icon (`v-list-item-icon`)

n/a
