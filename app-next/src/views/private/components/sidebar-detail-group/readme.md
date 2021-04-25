# Sidebar Detail Group

Used in the private view to manage the active state of [the nested `sidebar-detail` components](../sidebar-detail/).

## Usage

```html
<sidebar-detail-group :sidebar-open="sidebarOpen">
	<sidebar-detail icon="person" title="Users" >
		<!-- section content -->
	</sidebar-detail>
	<sidebar-detail icon="settings" title="Settings" >
		<!-- section content -->
	</sidebar-detail>
	<sidebar-detail icon="map" title="Routes" >
		<!-- section content -->
	</sidebar-detail>
</sidebar-detail-group>
```

## Sidebar open state

Once the sidebar closes, all open sidebar details should be closed. By watching the `sidebar-open` prop, we can dynamically close all details.

## Props
| Prop          | Description                                              | Default |
|---------------|----------------------------------------------------------|---------|
| `sidebar-open` | If the sidebar sidebar in the private view is open or not | `false` |

## Slots
| Slot      | Description |
|-----------|-------------|
| _default_ |             |

## Events
n/a

## CSS Variables
n/a
