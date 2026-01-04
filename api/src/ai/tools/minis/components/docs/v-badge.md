# v-badge

Small status indicator that can be attached to other elements.

## Basic Usage

```json
{
	"type": "v-badge",
	"props": { "value": "{{ state.count }}" }
}
```

## Props

| Prop       | Type          | Default | Description                              |
| ---------- | ------------- | ------- | ---------------------------------------- |
| `value`    | string/number | null    | Content (max 2-3 characters recommended) |
| `dot`      | boolean       | false   | Show as small dot only                   |
| `bordered` | boolean       | false   | Add contrast border (useful on images)   |
| `disabled` | boolean       | false   | Fade the badge                           |
| `left`     | boolean       | false   | Position on top-left                     |
| `bottom`   | boolean       | false   | Position on bottom-right                 |

> [!NOTE] `v-badge` is red (`--theme--danger`) by default. To change its color, use `style`:
> `"style": "--v-badge-background-color: var(--theme--primary)"`

## With Value

```json
{
	"type": "div",
	"props": { "style": "position: relative; display: inline-block;" },
	"children": [
		{ "type": "v-icon", "props": { "name": "notifications", "large": true } },
		{
			"type": "v-badge",
			"props": { "value": "{{ state.notificationCount }}" }
		}
	]
}
```

## Dot Badge

```json
{
	"type": "div",
	"props": { "style": "position: relative; display: inline-block;" },
	"children": [
		{ "type": "v-icon", "props": { "name": "mail", "large": true } },
		{
			"type": "v-badge",
			"props": { "dot": true }
		}
	]
}
```

## Positioning

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 32px;" },
	"children": [
		{
			"type": "div",
			"props": { "style": "position: relative; display: inline-block;" },
			"children": [
				{ "type": "v-avatar", "children": [{ "type": "v-icon", "props": { "name": "person" } }] },
				{ "type": "v-badge", "props": { "dot": true } }
			]
		},
		{
			"type": "div",
			"props": { "style": "position: relative; display: inline-block;" },
			"children": [
				{ "type": "v-avatar", "children": [{ "type": "v-icon", "props": { "name": "person" } }] },
				{ "type": "v-badge", "props": { "dot": true, "bottom": true } }
			]
		},
		{
			"type": "div",
			"props": { "style": "position: relative; display: inline-block;" },
			"children": [
				{ "type": "v-avatar", "children": [{ "type": "v-icon", "props": { "name": "person" } }] },
				{ "type": "v-badge", "props": { "dot": true, "left": true } }
			]
		}
	]
}
```

## Conditional Badge

```json
{
	"type": "div",
	"props": { "style": "position: relative; display: inline-block;" },
	"children": [
		{ "type": "v-icon", "props": { "name": "shopping_cart", "large": true } },
		{
			"type": "v-badge",
			"props": { "value": "{{ state.cartCount }}" },
			"condition": "state.cartCount > 0"
		}
	]
}
```

## Complete Example: Notification Bell

```json
{
	"type": "v-button",
	"props": { "icon": true, "secondary": true, "onClick": "actions.openNotifications" },
	"children": [
		{
			"type": "div",
			"props": { "style": "position: relative;" },
			"children": [
				{ "type": "v-icon", "props": { "name": "notifications" } },
				{
					"type": "v-badge",
					"props": { "value": "{{ state.unreadCount }}", "bordered": true },
					"condition": "state.unreadCount > 0"
				}
			]
		}
	]
}
```

```javascript
state.unreadCount = 0;

actions.init = async () => {
	const notifications = await readItems('notifications', {
		filter: { read: { _eq: false } },
		aggregate: { count: '*' },
	});
	state.unreadCount = notifications[0].count;
};

actions.openNotifications = () => {
	state.showNotifications = true;
};
```

## Notes

- Badge positions relative to parent container
- Parent needs `position: relative` and `display: inline-block`
- Use `dot` for simple presence indicators
- Use `value` for counts or short text
