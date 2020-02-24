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

## Colors

You can set the default, active, and hover colors and background colors with css variables:

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
| Prop    | Description                                                 | Default |
|---------|-------------------------------------------------------------|---------|
| `dense` | Removes some padding to make the list items closer together | `false` |
| `nav`   | Adds a small margin and border-radius for nav menu styling  | `false` |

## Slots
| Slot      | Description      |
|-----------|------------------|
| _default_ | List items, etc. |

## Events
| Event   | Description           | Value        |
|---------|-----------------------|--------------|
| `click` | User clicks on button | `MouseEvent` |

## CSS Variables
| Variable                           | Default                    |
|------------------------------------|----------------------------|
| `--v-list-padding`                 | `8px 0`                    |
| `--v-list-max-height`              | `none`                     |
| `--v-list-max-width`               | `none`                     |
| `--v-list-min-width`               | `none`                     |
| `--v-list-min-height`              | `none`                     |
| `--v-list-color`                   | `var(--foreground-color)`  |
| `--v-list-color-hover`             | `var(--foreground-color)`  |
| `--v-list-color-active`            | `var(--foreground-color)`  |
| `--v-list-background-color`        | `var(--background-color)`  |
| `--v-list-background-color-hover`  | `var(--hover-background)`  |
| `--v-list-background-color-active` | `var(--active-background)` |

---

# List Item

A wrapper for list items that formats things nicely. Can be used on its own or inside a list component. Best used with subcomponents (see below).

```html
<v-list-item v-for="item in items">
	<v-list-item-content>
		{{ item.text }}
	</v-list-item-content>
</v-list-item>
```

## Colors

You can set the default, active, and hover colors and background colors on individual list items with css variables. These will override the global list css vars, which you can set as well.

Hover styles will only be set if the list item has a to link or a onClick handler.

```html
  <v-list-item class="item-red">
    Red Stuff
  </v-list-item>
  <v-list-item >
    Normal stuff
  </v-list-item>

<style>
.item-red {
	--v-list-item-color: var(--red);
	--v-list-item-color-hover: var(--white);
	--v-list-item-color-active: var(--white);
	--v-list-item-background-color: var(--red-50);
	--v-list-item-background-color-hover: var(--red-100);
	--v-list-item-background-color-active: var(--red-800);
}
</style>
```

## Props
| Prop    | Description                                                   | Default |
|---------|---------------------------------------------------------------|---------|
| `dense` | Removes some padding to make the individual list item shorter | `false` |
| `to`    | Render as vue router-link with to link                        | `null`  |

## Slots
| Slot      | Description               |
|-----------|---------------------------|
| _default_ | List content, icons, etc. |

## Events
| Event   | Description         | Value        |
|---------|---------------------|--------------|
| `click` | User clicks on link | `MouseEvent` |

## CSS Variables
Second values are fallback ones, in case the list item is not inside a list where those vars are set.
| Variable                                | Default                                                         |
|-----------------------------------------|-----------------------------------------------------------------|
| `--v-list-item-padding`                 | `0 16px`                                                        |
| `--v-list-item-min-width`               | `none`                                                          |
| `--v-list-item-max-width`               | `none`                                                          |
| `--v-list-item-min-height`              | `48px`                                                          |
| `--v-list-item-max-height`              | `auto`                                                          |
| `--v-list-item-border-radius`           | `0`                                                             |
| `--v-list-item-margin-bottom`           | `0`                                                             |
| `--v-list-item-color`                   | `var(--v-list-color, var(--foreground-color))`                  |
| `--v-list-item-color-hover`             | `var(--v-list-color-hover, var(--foreground-color))`            |
| `--v-list-item-color-active`            | `var(--v-list-color-active, var(--foreground-color))`           |
| `--v-list-item-background-color`        | `var(--v-list-background-color, var(--background-color))`       |
| `--v-list-item-background-color-hover`  | `var(---list-background-color-hover, var(--hover-background))`  |
| `--v-list-item-background-color-active` | `var(--vlist-background-color-active,var(--active-background))` |

---

# List Item Content

```html
<v-list-item>
	<v-list-item-content>
		List test blah blah
	</v-list-item-content>
</v-list-item>
```

This is simply a wrapper for the main text content of a list item. It adds some padding and helps control overflow.

## Props
n/a

## Slots
| Slot      | Description               |
|-----------|---------------------------|
| _default_ | List content, icons, etc. |

## Events
n/a

## CSS Variables
| Variable                        | Default  |
|---------------------------------|----------|
| `--v-list-item-content-padding` | `12px 0` |
