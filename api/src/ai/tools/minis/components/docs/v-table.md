# v-table

Data table component for displaying tabular data with sorting, selection, and custom rendering.

## Basic Usage

```json
{
	"type": "v-table",
	"props": {
		"headers": [
			{ "text": "Name", "value": "name" },
			{ "text": "Email", "value": "email" },
			{ "text": "Status", "value": "status" }
		],
		"items": "state.users"
	}
}
```

**Required Script:**

```javascript
state.users = [];

actions.init = async () => {
	state.users = await readItems('users', {
		fields: ['id', 'name', 'email', 'status'],
	});
};
```

## Props

| Prop                  | Type    | Default  | Description                                       |
| --------------------- | ------- | -------- | ------------------------------------------------- |
| `headers`             | Array   | required | Column definitions (see format below)             |
| `items`               | Array   | required | Data rows                                         |
| `itemKey`             | string  | "id"     | Unique key field for each row                     |
| `sort`                | Object  | null     | Current sort state `{ by: 'field', desc: false }` |
| `loading`             | boolean | false    | Show loading state                                |
| `showSelect`          | string  | null     | Selection mode: "one", "multiple", or null        |
| `modelValue`          | Array   | []       | Selected item keys                                |
| `onUpdate:modelValue` | action  | -        | Selection change handler                          |
| `fixedHeader`         | boolean | false    | Keep header visible on scroll                     |
| `showResize`          | boolean | false    | Allow column resizing                             |

## Header Format

```javascript
{
  text: "Display Name",     // Column header text
  value: "fieldName",       // Key in items to display
  width: 200,               // Column width in pixels (optional)
  sortable: true,           // Allow sorting (default: true)
  align: "left",            // "left", "center", "right"
  description: "Tooltip"    // Header tooltip (optional)
}
```

## With Sorting

```json
{
	"type": "v-table",
	"props": {
		"headers": [
			{ "text": "Name", "value": "name", "sortable": true },
			{ "text": "Created", "value": "date_created", "sortable": true },
			{ "text": "Status", "value": "status", "sortable": true }
		],
		"items": "state.items",
		"sort": "state.sortState",
		"onUpdate:sort": "actions.setSort"
	}
}
```

```javascript
state.items = [];
state.sortState = { by: 'name', desc: false };

actions.setSort = (sort) => {
	state.sortState = sort;
	actions.loadData();
};

actions.loadData = async () => {
	const sortField = state.sortState.desc ? `-${state.sortState.by}` : state.sortState.by;

	state.items = await readItems('articles', {
		sort: [sortField],
	});
};
```

## With Selection

### Single Selection

```json
{
	"type": "v-table",
	"props": {
		"headers": "state.headers",
		"items": "state.items",
		"itemKey": "id",
		"showSelect": "one",
		"modelValue": "state.selected",
		"onUpdate:modelValue": "actions.setSelected"
	}
}
```

```javascript
state.selected = [];

actions.setSelected = (keys) => {
	state.selected = keys;
	if (keys.length > 0) {
		console.log('Selected item:', keys[0]);
	}
};
```

### Multiple Selection

```json
{
	"type": "v-table",
	"props": {
		"headers": "state.headers",
		"items": "state.items",
		"itemKey": "id",
		"showSelect": "multiple",
		"modelValue": "state.selected",
		"onUpdate:modelValue": "actions.setSelected"
	}
}
```

## With Row Click

```json
{
	"type": "v-table",
	"props": {
		"headers": "state.headers",
		"items": "state.items",
		"onClick:row": "actions.onRowClick"
	}
}
```

```javascript
actions.onRowClick = ({ item }) => {
	state.selectedItem = item;
	console.log('Clicked:', item.name);
};
```

## Column Widths and Alignment

```json
{
	"type": "v-table",
	"props": {
		"headers": [
			{ "text": "", "value": "icon", "width": 50, "sortable": false },
			{ "text": "Name", "value": "name", "width": 200 },
			{ "text": "Description", "value": "description" },
			{ "text": "Count", "value": "count", "width": 100, "align": "right" },
			{ "text": "Status", "value": "status", "width": 120, "align": "center" }
		],
		"items": "state.items",
		"showResize": true
	}
}
```

## Loading State

```json
{
	"type": "v-table",
	"props": {
		"headers": "state.headers",
		"items": "state.items",
		"loading": "state.isLoading"
	}
}
```

```javascript
state.isLoading = false;
state.items = [];

actions.loadData = async () => {
	state.isLoading = true;
	try {
		state.items = await readItems('articles');
	} finally {
		state.isLoading = false;
	}
};
```

## Complete Example: Article Manager

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "v-card-title",
			"children": ["Articles"]
		},
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "margin-bottom: 16px" },
					"children": [
						{
							"type": "v-input",
							"props": {
								"modelValue": "state.search",
								"onUpdate:modelValue": "actions.setSearch",
								"placeholder": "Search articles..."
							}
						}
					]
				},
				{
					"type": "v-table",
					"props": {
						"headers": [
							{ "text": "Title", "value": "title", "width": 300 },
							{ "text": "Author", "value": "author_name", "width": 150 },
							{ "text": "Status", "value": "status", "width": 100 },
							{ "text": "Published", "value": "date_published", "width": 150 }
						],
						"items": "state.filteredArticles",
						"itemKey": "id",
						"sort": "state.sort",
						"onUpdate:sort": "actions.setSort",
						"loading": "state.loading",
						"showSelect": "multiple",
						"modelValue": "state.selected",
						"onUpdate:modelValue": "actions.setSelected",
						"fixedHeader": true
					}
				}
			]
		},
		{
			"type": "v-card-actions",
			"condition": "state.hasSelection",
			"children": [
				{
					"type": "v-button",
					"props": { "onClick": "actions.deleteSelected", "kind": "danger" },
					"children": ["Delete Selected ({{ state.selected.length }})"]
				}
			]
		}
	]
}
```

```javascript
state.articles = [];
state.search = '';
state.sort = { by: 'title', desc: false };
state.loading = false;
state.selected = [];
state.hasSelection = false;

// Computed-like filtered list
state.filteredArticles = [];

actions.init = async () => {
	await actions.loadArticles();
};

actions.loadArticles = async () => {
	state.loading = true;
	try {
		const sortField = state.sort.desc ? `-${state.sort.by}` : state.sort.by;
		state.articles = await readItems('articles', {
			fields: ['id', 'title', 'author_name', 'status', 'date_published'],
			sort: [sortField],
		});
		actions.applyFilter();
	} finally {
		state.loading = false;
	}
};

actions.setSearch = (value) => {
	state.search = value;
	actions.applyFilter();
};

actions.applyFilter = () => {
	if (!state.search) {
		state.filteredArticles = state.articles;
	} else {
		const query = state.search.toLowerCase();
		state.filteredArticles = state.articles.filter((a) => a.title.toLowerCase().includes(query));
	}
};

actions.setSort = (sort) => {
	state.sort = sort;
	actions.loadArticles();
};

actions.setSelected = (keys) => {
	state.selected = keys;
	state.hasSelection = keys.length > 0;
};

actions.deleteSelected = async () => {
	for (const id of state.selected) {
		await deleteItem('articles', id);
	}
	state.selected = [];
	state.hasSelection = false;
	await actions.loadArticles();
};
```

## Notes

- Tables automatically handle overflow with horizontal scrolling
- Use `fixedHeader: true` for tables with many rows
- The `itemKey` prop should match a unique field in your items (usually "id")
- Sorting is client-side by default; for server-side sorting, reload data in `onUpdate:sort`
