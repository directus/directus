# v-text-overflow

Text component that truncates with ellipsis and shows full text on hover.

## Basic Usage

```json
{
	"type": "v-text-overflow",
	"props": { "text": "state.longText" }
}
```

## Props

| Prop   | Type   | Default | Description             |
| ------ | ------ | ------- | ----------------------- |
| `text` | string | ""      | Text content to display |

## Truncated Text

```json
{
	"type": "div",
	"props": { "style": "width: 200px;" },
	"children": [
		{
			"type": "v-text-overflow",
			"props": { "text": "This is a very long text that will be truncated when it exceeds the container width" }
		}
	]
}
```

## In Table Cell

```json
{
	"type": "v-table",
	"props": {
		"items": "state.items",
		"headers": [
			{ "text": "Name", "value": "name", "width": 150 },
			{ "text": "Description", "value": "description", "width": 200 },
			{ "text": "Status", "value": "status", "width": 100 }
		]
	},
	"children": [
		{
			"type": "template",
			"props": { "slot": "item.description" },
			"template": {
				"type": "v-text-overflow",
				"props": { "text": "item.description" }
			}
		}
	]
}
```

## In List Item

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
				"children": [
					{
						"type": "v-list-item-content",
						"props": { "style": "max-width: 250px;" },
						"children": [
							{
								"type": "v-text-overflow",
								"props": { "text": "item.title" }
							}
						]
					}
				]
			}
		}
	]
}
```

## Complete Example: File List

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Files"] },
		{
			"type": "v-list",
			"children": [
				{
					"type": "template",
					"iterate": "state.files",
					"as": "file",
					"template": {
						"type": "v-list-item",
						"children": [
							{
								"type": "v-list-item-icon",
								"children": [{ "type": "v-icon", "props": { "name": "insert_drive_file" } }]
							},
							{
								"type": "v-list-item-content",
								"props": { "style": "max-width: 200px;" },
								"children": [
									{
										"type": "v-text-overflow",
										"props": { "text": "file.name" }
									}
								]
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

actions.init = async () => {
	const files = await readItems('directus_files', {
		fields: ['id', 'filename_download', 'filesize'],
	});

	state.files = files.map((f) => ({
		id: f.id,
		name: f.filename_download,
		size: formatSize(f.filesize),
	}));
};

function formatSize(bytes) {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
```

## Notes

- Container must have a defined width for truncation to work
- Full text appears in tooltip on hover
- Useful for tables and lists with variable-length content
- Alternative: use CSS `text-overflow: ellipsis` directly if tooltip isn't needed
