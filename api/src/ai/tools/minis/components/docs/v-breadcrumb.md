# v-breadcrumb

Navigation breadcrumb showing the current location in a hierarchy.

## Basic Usage

```json
{
	"type": "v-breadcrumb",
	"props": { "items": "state.breadcrumbs" }
}
```

```javascript
state.breadcrumbs = [
	{ name: 'Home', to: '/' },
	{ name: 'Products', to: '/products' },
	{ name: 'Electronics', disabled: true },
];
```

## Props

| Prop    | Type  | Default | Description               |
| ------- | ----- | ------- | ------------------------- |
| `items` | array | []      | Array of breadcrumb items |

## Item Properties

Each item in the `items` array can have:

| Property   | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| `name`     | string  | Display text                             |
| `to`       | string  | Link/route (optional)                    |
| `disabled` | boolean | Non-clickable (usually for current page) |
| `icon`     | string  | Icon name to show before text            |

## Static Breadcrumbs

```json
{
	"type": "v-breadcrumb",
	"props": {
		"items": [
			{ "name": "Dashboard", "to": "/" },
			{ "name": "Settings", "to": "/settings" },
			{ "name": "Profile", "disabled": true }
		]
	}
}
```

## With Icons

```json
{
	"type": "v-breadcrumb",
	"props": {
		"items": [
			{ "name": "Home", "icon": "home", "to": "/" },
			{ "name": "Documents", "icon": "folder", "to": "/documents" },
			{ "name": "Report.pdf", "icon": "description", "disabled": true }
		]
	}
}
```

## Dynamic Breadcrumbs

```json
{
	"type": "v-breadcrumb",
	"props": { "items": "state.breadcrumbs" }
}
```

```javascript
state.breadcrumbs = [];
state.currentCategory = null;
state.currentItem = null;

actions.init = async () => {
	// Example: viewing a product in a category
	const category = await readItem('categories', state.categoryId);
	const product = await readItem('products', state.productId);

	state.breadcrumbs = [
		{ name: 'Home', to: '/' },
		{ name: 'Categories', to: '/categories' },
		{ name: category.name, to: `/categories/${category.id}` },
		{ name: product.name, disabled: true },
	];
};
```

## Click Handling

Since minis don't have routing, use onClick to handle breadcrumb navigation:

```json
{
	"type": "div",
	"props": { "style": "display: flex; align-items: center; gap: 8px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.breadcrumbs",
			"as": "crumb",
			"template": {
				"type": "div",
				"props": { "style": "display: flex; align-items: center; gap: 8px;" },
				"children": [
					{
						"type": "span",
						"props": {
							"style": "crumb.disabled ? 'color: var(--theme--foreground);' : 'color: var(--theme--primary); cursor: pointer;'",
							"onClick": "() => !crumb.disabled && actions.navigateTo(crumb)"
						},
						"children": ["{{ crumb.name }}"]
					},
					{
						"type": "v-icon",
						"props": { "name": "chevron_right", "small": true },
						"condition": "!crumb.isLast"
					}
				]
			}
		}
	]
}
```

```javascript
state.breadcrumbs = [];
state.currentView = 'list';

actions.navigateTo = (crumb) => {
	if (crumb.view) {
		state.currentView = crumb.view;
		actions.loadView(crumb.view, crumb.data);
	}
};
```

## Complete Example: File Browser Breadcrumbs

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "div",
			"props": { "style": "padding: 12px 16px; border-bottom: 1px solid var(--theme--border-color);" },
			"children": [
				{
					"type": "v-breadcrumb",
					"props": { "items": "state.breadcrumbs" }
				}
			]
		},
		{
			"type": "v-list",
			"children": [
				{
					"type": "template",
					"iterate": "state.currentItems",
					"as": "item",
					"template": {
						"type": "v-list-item",
						"props": {
							"clickable": true,
							"onClick": "() => actions.openItem(item)"
						},
						"children": [
							{
								"type": "v-list-item-icon",
								"children": [{ "type": "v-icon", "props": { "name": "item.isFolder ? 'folder' : 'description'" } }]
							},
							{ "type": "v-list-item-content", "children": ["{{ item.name }}"] }
						]
					}
				}
			]
		}
	]
}
```

```javascript
state.breadcrumbs = [{ name: 'Root', folderId: null, disabled: false }];
state.currentItems = [];
state.currentFolderId = null;

actions.init = () => {
	actions.loadFolder(null);
};

actions.loadFolder = async (folderId) => {
	state.currentFolderId = folderId;

	// Load items in this folder
	state.currentItems = await readItems('directus_files', {
		filter: { folder: folderId ? { _eq: folderId } : { _null: true } },
		fields: ['id', 'filename_download', 'type'],
	});

	// Add folders
	const folders = await readItems('directus_folders', {
		filter: { parent: folderId ? { _eq: folderId } : { _null: true } },
	});

	state.currentItems = [
		...folders.map((f) => ({ id: f.id, name: f.name, isFolder: true })),
		...state.currentItems.map((f) => ({ id: f.id, name: f.filename_download, isFolder: false })),
	];

	actions.updateBreadcrumbs();
};

actions.openItem = (item) => {
	if (item.isFolder) {
		state.breadcrumbs.push({ name: item.name, folderId: item.id, disabled: false });
		state.breadcrumbs[state.breadcrumbs.length - 2].disabled = false;
		state.breadcrumbs[state.breadcrumbs.length - 1].disabled = true;
		actions.loadFolder(item.id);
	}
};

actions.updateBreadcrumbs = () => {
	// Mark last item as disabled (current)
	state.breadcrumbs = state.breadcrumbs.map((b, i, arr) => ({
		...b,
		disabled: i === arr.length - 1,
	}));
};
```

## Notes

- Last breadcrumb item is typically `disabled: true` (current page)
- Use icons to indicate item types (folder, file, category)
- Handle click events for in-app navigation (no real routing in minis)
- Keep breadcrumb trails reasonable in length
