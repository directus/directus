# Sidebar Detail

Meant to be used in the sidebar sidebar of the private view. Is used to register multiple sections in the sidebar.

## Usage

```html
<sidebar-detail icon="person" title="Users" >
	<p>Users:</p>
	<ul>
		<li>Admin</li>
	</ul>
</sidebar-detail>
```

The active state is managed by the same logic as v-item-group. The sidebar detail state is managed by
the private `sidebar-detail-group` component in `private-view`.

## Props
| Prop     | Description                               | Default    |
|----------|-------------------------------------------|------------|
| `icon`*  | Icon to be displayed in the toggle header | `settings` |
| `title`* | Name of the section                       | --         |
| `badge`  | Show badge on icon with passed value      | `null`     |

## Slots
| Slot      | Description |
|-----------|-------------|
| _default_ |             |

## Events
n/a

## CSS Variables
n/a
