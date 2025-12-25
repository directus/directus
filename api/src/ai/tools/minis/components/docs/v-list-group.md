# v-list-group

Collapsible group within a v-list for nested navigation.

## Basic Usage

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "v-list-group",
			"props": { "title": "Group Title" },
			"children": [
				{ "type": "v-list-item", "children": ["Nested Item 1"] },
				{ "type": "v-list-item", "children": ["Nested Item 2"] }
			]
		}
	]
}
```

## Props

| Prop        | Type    | Default | Description                |
| ----------- | ------- | ------- | -------------------------- |
| `title`     | string  | null    | Group header text          |
| `open`      | boolean | false   | Initially expanded         |
| `clickable` | boolean | true    | Header is clickable        |
| `disabled`  | boolean | false   | Disable toggle             |
| `arrow`     | boolean | true    | Show expand/collapse arrow |
| `scope`     | string  | null    | Unique identifier          |

## Slots (Children Structure)

The component accepts children that become the nested content. For custom header content, the title is set via props.

## Initially Open

```json
{
	"type": "v-list-group",
	"props": { "title": "Settings", "open": true },
	"children": [
		{ "type": "v-list-item", "children": ["General"] },
		{ "type": "v-list-item", "children": ["Security"] },
		{ "type": "v-list-item", "children": ["Notifications"] }
	]
}
```

## Multiple Groups

```json
{
	"type": "v-list",
	"props": { "nav": true },
	"children": [
		{
			"type": "v-list-group",
			"props": { "title": "Content" },
			"children": [
				{
					"type": "v-list-item",
					"props": { "clickable": true },
					"children": [
						{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "article" } }] },
						{ "type": "v-list-item-content", "children": ["Articles"] }
					]
				},
				{
					"type": "v-list-item",
					"props": { "clickable": true },
					"children": [
						{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "image" } }] },
						{ "type": "v-list-item-content", "children": ["Media"] }
					]
				}
			]
		},
		{
			"type": "v-list-group",
			"props": { "title": "Settings" },
			"children": [
				{
					"type": "v-list-item",
					"props": { "clickable": true },
					"children": [
						{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "person" } }] },
						{ "type": "v-list-item-content", "children": ["Users"] }
					]
				},
				{
					"type": "v-list-item",
					"props": { "clickable": true },
					"children": [
						{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "lock" } }] },
						{ "type": "v-list-item-content", "children": ["Roles"] }
					]
				}
			]
		}
	]
}
```

## Dynamic Groups from Data

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "template",
			"iterate": "state.categories",
			"as": "category",
			"template": {
				"type": "v-list-group",
				"props": { "title": "{{ category.name }}" },
				"children": [
					{
						"type": "template",
						"iterate": "category.items",
						"as": "item",
						"template": {
							"type": "v-list-item",
							"props": {
								"clickable": true,
								"onClick": "() => actions.selectItem(item)"
							},
							"children": [{ "type": "v-list-item-content", "children": ["{{ item.name }}"] }]
						}
					}
				]
			}
		}
	]
}
```

```javascript
state.categories = [];

actions.init = async () => {
	const categories = await readItems('categories', {
		fields: ['id', 'name', 'items.id', 'items.name'],
	});
	state.categories = categories;
};

actions.selectItem = (item) => {
	state.selectedItem = item;
};
```

## Complete Example: Sidebar Navigation

```json
{
	"type": "v-card",
	"props": { "style": "width: 250px;" },
	"children": [
		{
			"type": "v-list",
			"props": { "nav": true },
			"children": [
				{
					"type": "v-list-item",
					"props": {
						"clickable": true,
						"active": "state.currentPage === 'dashboard'",
						"onClick": "() => actions.navigate('dashboard')"
					},
					"children": [
						{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "dashboard" } }] },
						{ "type": "v-list-item-content", "children": ["Dashboard"] }
					]
				},
				{
					"type": "v-list-group",
					"props": { "title": "Content", "open": true },
					"children": [
						{
							"type": "v-list-item",
							"props": {
								"clickable": true,
								"active": "state.currentPage === 'posts'",
								"onClick": "() => actions.navigate('posts')"
							},
							"children": [
								{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "article" } }] },
								{ "type": "v-list-item-content", "children": ["Posts"] }
							]
						},
						{
							"type": "v-list-item",
							"props": {
								"clickable": true,
								"active": "state.currentPage === 'pages'",
								"onClick": "() => actions.navigate('pages')"
							},
							"children": [
								{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "description" } }] },
								{ "type": "v-list-item-content", "children": ["Pages"] }
							]
						},
						{
							"type": "v-list-item",
							"props": {
								"clickable": true,
								"active": "state.currentPage === 'media'",
								"onClick": "() => actions.navigate('media')"
							},
							"children": [
								{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "perm_media" } }] },
								{ "type": "v-list-item-content", "children": ["Media"] }
							]
						}
					]
				},
				{
					"type": "v-list-group",
					"props": { "title": "System" },
					"children": [
						{
							"type": "v-list-item",
							"props": {
								"clickable": true,
								"active": "state.currentPage === 'users'",
								"onClick": "() => actions.navigate('users')"
							},
							"children": [
								{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "people" } }] },
								{ "type": "v-list-item-content", "children": ["Users"] }
							]
						},
						{
							"type": "v-list-item",
							"props": {
								"clickable": true,
								"active": "state.currentPage === 'settings'",
								"onClick": "() => actions.navigate('settings')"
							},
							"children": [
								{ "type": "v-list-item-icon", "children": [{ "type": "v-icon", "props": { "name": "settings" } }] },
								{ "type": "v-list-item-content", "children": ["Settings"] }
							]
						}
					]
				}
			]
		}
	]
}
```

```javascript
state.currentPage = 'dashboard';

actions.navigate = (page) => {
	state.currentPage = page;
	// Load page content
	actions.loadPageContent(page);
};

actions.loadPageContent = async (page) => {
	// Implementation depends on your app structure
};
```

## Notes

- Use within `v-list` for proper styling
- `open: true` to start expanded
- Nested groups are supported for multi-level navigation
- Combine with `nav: true` on parent `v-list` for navigation styling
