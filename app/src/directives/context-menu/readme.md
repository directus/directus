# Context Menu

## Usage

This allows the element to open a context menu when `contextmenu` event (right click) is triggered, and closes it on
`focusout`.

```html
<element v-context-menu></element>
```

Somewhere in the same component:

```html
<v-menu ref="contextMenu">
	<!-- menu items here -->
</v-menu>
```
