# Drawer Detail

Meant to be used in the drawer sidebar of the private view. Is used to register multiple sections in the drawer.

## Usage

```html
<drawer-detail icon="person" title="Users" >
	<p>Users:</p>
	<ul>
		<li>Admin</li>
	</ul>
</drawer-detail>
```

The active state is managed by the same logic as v-item-group. The drawer detail state is managed by
the private `drawer-detail-group` component in `private-view`.

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
