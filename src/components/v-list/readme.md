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

## Props

| Prop        | Description                                                                                                 | Default |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| `dense`     | Removes some padding to make the list items closer together                                                 | `false` |
| `threeLine` | Limits list items to three lines of text (1 of title, 2 of subtitle). Only works in webkit enabled browsers | `false` |
| `nav`       | Adds a small margin and border-radius for nav menu styling                                                  | `false` |
| `multiple`  | Allows multiple child groups to be open at once                                                             | `true`  |

## Events

n/a

## Slots

| Slot      | Description  | Data |
| --------- | ------------ | ---- |
| _default_ | List content |      |

## CSS Variables

| Variable                           | Default                          |
| ---------------------------------- | -------------------------------- |
| `--v-list-padding`                 | `8px 0`                          |
| `--v-list-max-height`              | `none`                           |
| `--v-list-max-width`               | `none`                           |
| `--v-list-min-width`               | `none`                           |
| `--v-list-min-height`              | `none`                           |
| `--v-list-color`                   | `var(--foreground-normal)`        |
| `--v-list-color-hover`             | `var(--foreground-normal)`        |
| `--v-list-color-active`            | `var(--foreground-normal)`        |
| `--v-list-background-color-hover`  | `var(--background-normal-alt)`  |
| `--v-list-background-color-active` | `var(--background-normal-alt)` |

---

# List Item

A wrapper for list items that formats children nicely. Can be used on its own or inside a list component. Best used with subcomponents (see below).

## Usage

```html
<v-list-item>
	<v-list-item-title>Hello, world!</v-list-item-title>
</v-list-item>
```

## Props

| Prop       | Description                                                          | Default |
|------------|----------------------------------------------------------------------|---------|
| `dense`    | Removes some padding to make the individual list item shorter        | `false` |
| `lines`    | Sets if the list item will support `1`, `2`, or `3` lines of content | `null`  |
| `to`       | Render as vue router-link with to link                               | `null`  |
| `disabled` | Disable the list item                                                | `false` |
| `active`   | Enable the list item's active state                                  | `false` |
| `exact`    | Set the `exact` prop on router-link. Used with `to`                  | `false` |

## Events

n/a

## Slots

| Slot      | Description       | Data |
| --------- | ----------------- | ---- |
| _default_ | List item content |      |

## CSS Variables

| Variable                                    | Default                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `--v-list-item-one-line-min-height`         | `48px`                                                                  |
| `--v-list-item-two-line-min-height`         | `60px`                                                                  |
| `--v-list-item-three-line-min-height`       | `76px`                                                                  |
| `--v-list-item-one-line-min-height-dense`   | `40px`                                                                  |
| `--v-list-item-two-line-min-height-dense`   | `48px`                                                                  |
| `--v-list-item-three-line-min-height-dense` | `64px`                                                                  |
| `--v-list-item-padding`                     | `0 16px 0 calc(16px + var(--v-list-item-indent, 0px))`                  |
| `--v-list-item-min-width`                   | `none`                                                                  |
| `--v-list-item-max-width`                   | `none`                                                                  |
| `--v-list-item-min-height`                  | `var(--v-list-item-one-line-min-height)`                                |
| `--v-list-item-max-height`                  | `auto`                                                                  |
| `--v-list-item-border-radius`               | `0`                                                                     |
| `--v-list-item-margin-bottom`               | `0`                                                                     |
| `--v-list-item-color`                       | `var(--v-list-color, var(--foreground-normal))`                          |
| `--v-list-item-color-hover`                 | `var(--v-list-color-hover, var(--foreground-normal))`                    |
| `--v-list-item-color-active`                | `var(--v-list-color-active, var(--foreground-normal))`                   |
| `--v-list-item-background-color-hover`      | `var(--v-list-background-color-hover, var(--background-normal-alt))`   |
| `--v-list-item-background-color-active`     | `var(--v-list-background-color-active, var(--background-normal-alt))` |

---

# List Item Content

A wrapper for the main text content of a list item. It adds some padding and helps control overflow. The parent of `v-list-title` and `v-list-subtitle` components, it's also the main controller of the `dense` option on lists.

## Usage

```html
<v-list-item-content>Hello, world!</v-list-item-content>
```

## Props

n/a

## Events

n/a

## Slots

| Slot      | Description               | Data |
| --------- | ------------------------- | ---- |
| _default_ | List item content content |      |

## CSS Variables

| Variable                        | Default  |
| ------------------------------- | -------- |
| `--v-list-item-content-padding` | `12px 0` |

---

# List Item Title

Wrapper that adds typographic styling and margin for the subtitle/description of the list item. Responsive to `dense` and `threeLine` props.

## Usage

```html
<v-list-item-title>Hello, world</v-list-item-title>
```

## Props

n/a

## Events

n/a

## Slots

| Slot      | Description             | Data |
| --------- | ----------------------- | ---- |
| _default_ | List item title content |      |

## CSS Variables

n/a

---

# List Item Subtitle

Wrapper that adds typographic styling and margin for the subtitle/description of the list item. Responsive to `dense` and `threeLine` props.

## Usage

```html
<v-list-item-subtitle>This is the subtitle</v-list-item-subtitle>
```

## Props

n/a

## Events

n/a

## Slots

| Slot      | Description                | Data |
| --------- | -------------------------- | ---- |
| _default_ | List item subtitle content |      |

## CSS Variables

n/a

---

# List Item Icon

Wrapper for icon, action, or avatar type elements in a list item. Can be used on the left or right of an item.

## Usage

```html
<v-list-item-icon>
	<v-icon name="person" />
</v-list-item-icon>
```

## Props

| Prop     | Description                                                         | Default |
| -------- | ------------------------------------------------------------------- | ------- |
| `center` | Whether to center the element (good for action elements or avatars) | `false` |

## Events

n/a

## Slots

| Slot      | Description            | Data |
| --------- | ---------------------- | ---- |
| _default_ | List item icon content |      |

## CSS Variables

n/a

---

# List Group

Provides the ability to make a collapsable (sub)group of list items, within a list or independently. List groups can be nested to an arbitrary depth.

```html
<v-list>
	<!-- Root level items -->
	<v-list-item />
	<v-list-item />

	<v-list-group>
		<template v-slot:activator>
			... Click me to expand! ...
		</template>

		<v-list-item v-for="item in dropDownItems">
			...item content etc.
		</v-list-item>

		<v-list-group>
			<template v-slot:activator>
				... Click me to expand this subgroup! ...
			</template>

			<v-list-item />
			<v-list-item />

			<v-list-group>
				<template v-slot:activator>
					... Click me to expand next subgroup! ...
				</template>

				<v-list-item v-for="item in subGroupDropdownItems">
				</v-list-item>
			</v-list-group>
		</v-list-group>
	</v-list-group>
</v-list>
```

## Props

| Prop       | Description                                                                     | Default |
|------------|---------------------------------------------------------------------------------|---------|
| `multiple` | Allow multiple subgroups to be open at the same time                            | `true`  |
| `to`       | Where to link to. This will only make the chevron toggle the group active state |         |
| `active`   | Render the activitor item in the active state                                   | `false` |

## Events

n/a

## Slots

| Slot      | Description   | Data |
| --------- | ------------- | ---- |
| _default_ | Group content |      |

## CSS Variables

n/a
