# Context Menu

## Usage

This allows the element to open a context menu with the specified ref. It adds `contextmenu` event (right click) to
activate/open the context menu, and `pointerdown` event on document to deactivate/close when it's not the event target.

```html
<element v-context-menu="'contextMenu'"></element>
```

Somewhere in the same component:

```html
<v-menu ref="contextMenu">
	<!-- menu items here -->
</v-menu>
```
