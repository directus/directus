# Context Menu

## Usage

This allows the element to open a context menu with the specified ref. It adds `contextmenu` event (right click) to
activate/open the context menu, and `focusout` event to deactivate/close it. .

```html
<element v-context-menu="'contextMenu'"></element>
```

Somewhere in the same component:

```html
<v-menu ref="contextMenu">
	<!-- menu items here -->
</v-menu>
```
