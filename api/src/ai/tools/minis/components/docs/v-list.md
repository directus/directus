# v-list

Container for displaying lists of items with consistent styling.

## Basic Usage

```json
{
	"type": "v-list",
	"children": [
		{ "type": "v-list-item", "children": ["Item 1"] },
		{ "type": "v-list-item", "children": ["Item 2"] },
		{ "type": "v-list-item", "children": ["Item 3"] }
	]
}
```

## Named Slots (Cleaner Syntax)

`v-list-item` supports named slots for `prepend` and `append` content, allowing for a flatter and cleaner UI schema.

```json
{
	"type": "v-list-item",
	"children": {
		"prepend": { "type": "v-icon", "props": { "icon": "star" } },
		"default": "Clean List Item",
		"append": { "type": "v-chip", "children": ["New"] }
	}
}
```

## Props

| Prop    | Type    | Default | Description                                   |
| ------- | ------- | ------- | --------------------------------------------- |
| `nav`   | boolean | false   | Navigation style (adds padding, hover states) |
| `dense` | boolean | false   | Reduce vertical spacing                       |

## Related Components

- `v-list-item` - Individual list item
- `v-list-item-icon` - Icon slot for list item
- `v-list-item-content` - Content slot for list item
- `v-list-item-hint` - Secondary text/hint
- `v-list-group` - Collapsible group of items

## List Item Props

| Prop        | Type    | Default | Description           |
| ----------- | ------- | ------- | --------------------- |
| `active`    | boolean | false   | Active/selected state |
| `disabled`  | boolean | false   | Disable the item      |
| `dense`     | boolean | false   | Reduce height         |
| `clickable` | boolean | false   | Show as clickable     |
| `onClick`   | action  | -       | Click handler         |
| `block`     | boolean | false   | Block display         |

## Simple Text List

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "v-list-item",
			"children": [{ "type": "v-list-item-content", "children": ["Dashboard"] }]
		},
		{
			"type": "v-list-item",
			"children": [{ "type": "v-list-item-content", "children": ["Settings"] }]
		},
		{
			"type": "v-list-item",
			"children": [{ "type": "v-list-item-content", "children": ["Profile"] }]
		}
	]
}
```

## With Icons

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "v-list-item",
			"children": [
				{
					"type": "v-list-item-icon",
					"children": [{ "type": "v-icon", "props": { "name": "home" } }]
				},
				{ "type": "v-list-item-content", "children": ["Home"] }
			]
		},
		{
			"type": "v-list-item",
			"children": [
				{
					"type": "v-list-item-icon",
					"children": [{ "type": "v-icon", "props": { "name": "settings" } }]
				},
				{ "type": "v-list-item-content", "children": ["Settings"] }
			]
		},
		{
			"type": "v-list-item",
			"children": [
				{
					"type": "v-list-item-icon",
					"children": [{ "type": "v-icon", "props": { "name": "person" } }]
				},
				{ "type": "v-list-item-content", "children": ["Profile"] }
			]
		}
	]
}
```

## With Hints (Secondary Text)

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "v-list-item",
			"children": [
				{
					"type": "v-list-item-icon",
					"children": [{ "type": "v-icon", "props": { "name": "inbox" } }]
				},
				{ "type": "v-list-item-content", "children": ["Inbox"] },
				{ "type": "v-list-item-hint", "children": ["24 new"] }
			]
		},
		{
			"type": "v-list-item",
			"children": [
				{
					"type": "v-list-item-icon",
					"children": [{ "type": "v-icon", "props": { "name": "send" } }]
				},
				{ "type": "v-list-item-content", "children": ["Sent"] },
				{ "type": "v-list-item-hint", "children": ["1,204"] }
			]
		},
		{
			"type": "v-list-item",
			"children": [
				{
					"type": "v-list-item-icon",
					"children": [{ "type": "v-icon", "props": { "name": "drafts" } }]
				},
				{ "type": "v-list-item-content", "children": ["Drafts"] },
				{ "type": "v-list-item-hint", "children": ["3"] }
			]
		}
	]
}
```

## Clickable Items with Active State

```json
{
	"type": "v-list",
	"props": { "nav": true },
	"children": [
		{
			"type": "template",
			"iterate": "state.menuItems",
			"as": "item",
			"template": {
				"type": "v-list-item",
				"props": {
					"clickable": true,
					"active": "state.activeItem === item.id",
					"onClick": "() => actions.selectItem(item.id)"
				},
				"children": [
					{
						"type": "v-list-item-icon",
						"children": [{ "type": "v-icon", "props": { "name": "item.icon" } }]
					},
					{ "type": "v-list-item-content", "children": ["{{ item.label }}"] }
				]
			}
		}
	]
}
```

```javascript
state.menuItems = [
	{ id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
	{ id: 'projects', icon: 'folder', label: 'Projects' },
	{ id: 'tasks', icon: 'task', label: 'Tasks' },
	{ id: 'settings', icon: 'settings', label: 'Settings' },
];
state.activeItem = 'dashboard';

actions.selectItem = (id) => {
	state.activeItem = id;
};
```

## Dense List

```json
{
	"type": "v-list",
	"props": { "dense": true },
	"children": [
		{ "type": "v-list-item", "props": { "dense": true }, "children": ["Compact Item 1"] },
		{ "type": "v-list-item", "props": { "dense": true }, "children": ["Compact Item 2"] },
		{ "type": "v-list-item", "props": { "dense": true }, "children": ["Compact Item 3"] }
	]
}
```

## Dynamic List from Data

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "template",
			"iterate": "state.items",
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
						"children": [
							{
								"type": "v-avatar",
								"props": { "small": true },
								"children": ["{{ item.initials }}"]
							}
						]
					},
					{
						"type": "v-list-item-content",
						"children": ["{{ item.name }}"]
					},
					{
						"type": "v-list-item-hint",
						"children": ["{{ item.status }}"]
					}
				]
			}
		}
	]
}
```

```javascript
state.items = [];

actions.init = async () => {
	const data = await readItems('contacts', {
		fields: ['id', 'first_name', 'last_name', 'status'],
	});

	state.items = data.map((item) => ({
		...item,
		name: `${item.first_name} ${item.last_name}`,
		initials: (item.first_name[0] + item.last_name[0]).toUpperCase(),
	}));
};

actions.openItem = (item) => {
	state.selectedItem = item;
};
```

## Complete Example: File Browser

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Files"] },
		{
			"type": "v-list",
			"props": { "nav": true },
			"children": [
				{
					"type": "template",
					"iterate": "state.files",
					"as": "file",
					"template": {
						"type": "v-list-item",
						"props": {
							"clickable": true,
							"active": "state.selectedFile === file.id",
							"onClick": "() => actions.selectFile(file)"
						},
						"children": [
							{
								"type": "v-list-item-icon",
								"children": [
									{
										"type": "v-icon",
										"props": { "name": "file.icon" }
									}
								]
							},
							{
								"type": "v-list-item-content",
								"children": ["{{ file.name }}"]
							},
							{
								"type": "v-list-item-hint",
								"children": ["{{ file.size }}"]
							}
						]
					}
				}
			]
		}
	]
}
```

```javascript
state.files = [];
state.selectedFile = null;

actions.init = async () => {
	const files = await readItems('directus_files', {
		fields: ['id', 'filename_download', 'filesize', 'type'],
	});

	state.files = files.map((f) => ({
		id: f.id,
		name: f.filename_download,
		size: formatFileSize(f.filesize),
		icon: getFileIcon(f.type),
	}));
};

function getFileIcon(type) {
	if (type.startsWith('image/')) return 'image';
	if (type.startsWith('video/')) return 'movie';
	if (type === 'application/pdf') return 'picture_as_pdf';
	return 'insert_drive_file';
}

function formatFileSize(bytes) {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

actions.selectFile = (file) => {
	state.selectedFile = file.id;
};
```

## Notes

- Use `nav: true` for navigation-style lists with hover states
- Use `dense` for compact lists
- Combine with `v-list-item-icon`, `v-list-item-content`, `v-list-item-hint` for structure
- See `v-list-group` for collapsible nested lists
