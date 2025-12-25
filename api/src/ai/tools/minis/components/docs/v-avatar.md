# v-avatar

Circular or square avatar container for user images, initials, or icons.

## Basic Usage

```json
{
	"type": "v-avatar",
	"children": [{ "type": "img", "props": { "src": "state.userAvatar", "alt": "User" } }]
}
```

## Props

| Prop     | Type    | Default | Description                |
| -------- | ------- | ------- | -------------------------- |
| `tile`   | boolean | false   | Square instead of circular |
| `xSmall` | boolean | false   | Extra small (24px)         |
| `small`  | boolean | false   | Small (32px)               |
| `large`  | boolean | false   | Large (48px)               |
| `xLarge` | boolean | false   | Extra large (64px)         |

## With Image

```json
{
	"type": "v-avatar",
	"children": [{ "type": "img", "props": { "src": "state.avatarUrl", "alt": "Avatar" } }]
}
```

## With Initials

```json
{
	"type": "v-avatar",
	"props": { "style": "background: var(--theme--primary); color: white;" },
	"children": ["{{ state.initials }}"]
}
```

```javascript
state.firstName = 'John';
state.lastName = 'Doe';
state.initials = 'JD'; // Calculate from names

actions.init = () => {
	state.initials = (state.firstName[0] + state.lastName[0]).toUpperCase();
};
```

## With Icon

```json
{
	"type": "v-avatar",
	"props": { "style": "background: var(--theme--background-accent);" },
	"children": [{ "type": "v-icon", "props": { "name": "person" } }]
}
```

## Sizes

```json
{
	"type": "div",
	"props": { "style": "display: flex; gap: 16px; align-items: center;" },
	"children": [
		{
			"type": "v-avatar",
			"props": { "xSmall": true },
			"children": [{ "type": "v-icon", "props": { "name": "person", "xSmall": true } }]
		},
		{
			"type": "v-avatar",
			"props": { "small": true },
			"children": [{ "type": "v-icon", "props": { "name": "person", "small": true } }]
		},
		{
			"type": "v-avatar",
			"children": [{ "type": "v-icon", "props": { "name": "person" } }]
		},
		{
			"type": "v-avatar",
			"props": { "large": true },
			"children": [{ "type": "v-icon", "props": { "name": "person" } }]
		},
		{
			"type": "v-avatar",
			"props": { "xLarge": true },
			"children": [{ "type": "v-icon", "props": { "name": "person", "large": true } }]
		}
	]
}
```

## Square (Tile)

```json
{
	"type": "v-avatar",
	"props": { "tile": true },
	"children": [{ "type": "img", "props": { "src": "state.logoUrl", "alt": "Logo" } }]
}
```

## User Display with Name

```json
{
	"type": "div",
	"props": { "style": "display: flex; align-items: center; gap: 12px;" },
	"children": [
		{
			"type": "v-avatar",
			"children": [{ "type": "img", "props": { "src": "state.user.avatar", "alt": "User" } }]
		},
		{
			"type": "div",
			"children": [
				{ "type": "strong", "children": ["{{ state.user.name }}"] },
				{
					"type": "p",
					"props": { "style": "margin: 0; color: var(--theme--foreground-subdued); font-size: 12px;" },
					"children": ["{{ state.user.email }}"]
				}
			]
		}
	]
}
```

## User List

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "template",
			"iterate": "state.users",
			"as": "user",
			"template": {
				"type": "v-list-item",
				"children": [
					{
						"type": "v-list-item-icon",
						"children": [
							{
								"type": "v-avatar",
								"props": { "small": true },
								"children": ["{{ user.initials }}"]
							}
						]
					},
					{
						"type": "v-list-item-content",
						"children": ["{{ user.name }}"]
					}
				]
			}
		}
	]
}
```

## With Badge

```json
{
	"type": "div",
	"props": { "style": "position: relative; display: inline-block;" },
	"children": [
		{
			"type": "v-avatar",
			"children": [{ "type": "img", "props": { "src": "state.avatarUrl" } }]
		},
		{
			"type": "v-badge",
			"props": { "dot": true, "bottom": true, "right": true }
		}
	]
}
```

## Complete Example: Team Members

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Team Members"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "display: flex; flex-wrap: wrap; gap: 16px;" },
					"children": [
						{
							"type": "template",
							"iterate": "state.team",
							"as": "member",
							"template": {
								"type": "div",
								"props": { "style": "text-align: center;" },
								"children": [
									{
										"type": "v-avatar",
										"props": { "large": true, "style": "background: var(--theme--primary); color: white;" },
										"children": ["{{ member.initials }}"]
									},
									{
										"type": "p",
										"props": { "style": "margin: 8px 0 0; font-size: 12px;" },
										"children": ["{{ member.name }}"]
									}
								]
							}
						}
					]
				}
			]
		}
	]
}
```

```javascript
state.team = [];

actions.init = async () => {
	const users = await readItems('directus_users', {
		fields: ['id', 'first_name', 'last_name'],
	});

	state.team = users.map((u) => ({
		id: u.id,
		name: `${u.first_name} ${u.last_name}`,
		initials: (u.first_name[0] + u.last_name[0]).toUpperCase(),
	}));
};
```
