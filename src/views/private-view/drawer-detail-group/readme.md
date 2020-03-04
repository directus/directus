# Drawer Detail Group

Used in the private view to manage the active state of [the nested `drawer-detail` components](../drawer-detail/).

## Usage

```html
<drawer-detail-group :drawer-open="drawerOpen">
	<drawer-detail icon="person" title="Users" >
		<!-- section content -->
	</drawer-detail>
	<drawer-detail icon="settings" title="Settings" >
		<!-- section content -->
	</drawer-detail>
	<drawer-detail icon="map" title="Routes" >
		<!-- section content -->
	</drawer-detail>
</drawer-detail-group>
```

## Drawer open state

Once the drawer closes, all open drawer details should be closed. By watching the `drawer-open` prop, we can dynamically close all details.

## Props
| Prop          | Description                                              | Default |
|---------------|----------------------------------------------------------|---------|
| `drawer-open` | If the drawer sidebar in the private view is open or not | `false` |

## Slots
| Slot      | Description |
|-----------|-------------|
| _default_ |             |

## Events
n/a

## CSS Variables
n/a
