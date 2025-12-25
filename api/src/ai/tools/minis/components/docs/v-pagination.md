# v-pagination

Pagination controls for navigating through paged data.

## Basic Usage

```json
{
	"type": "v-pagination",
	"props": {
		"modelValue": "state.currentPage",
		"onUpdate:modelValue": "actions.setPage",
		"length": "state.totalPages"
	}
}
```

```javascript
state.currentPage = 1;
state.totalPages = 10;

actions.setPage = (page) => {
	state.currentPage = page;
	actions.loadPage(page);
};
```

## Props

| Prop                  | Type    | Default  | Description                    |
| --------------------- | ------- | -------- | ------------------------------ |
| `modelValue`          | number  | 1        | Current page                   |
| `onUpdate:modelValue` | action  | required | Page change handler            |
| `length`              | number  | 0        | Total number of pages          |
| `totalVisible`        | number  | 7        | Number of visible page buttons |
| `disabled`            | boolean | false    | Disable pagination             |
| `showFirstLast`       | boolean | true     | Show first/last page buttons   |

## With Limited Visible Pages

```json
{
	"type": "v-pagination",
	"props": {
		"modelValue": "state.currentPage",
		"onUpdate:modelValue": "actions.setPage",
		"length": 50,
		"totalVisible": 5
	}
}
```

## Paginated List

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Items ({{ state.totalItems }} total)"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-list",
					"children": [
						{
							"type": "template",
							"iterate": "state.items",
							"as": "item",
							"template": {
								"type": "v-list-item",
								"children": [{ "type": "v-list-item-content", "children": ["{{ item.name }}"] }]
							}
						}
					]
				}
			]
		},
		{
			"type": "v-card-actions",
			"props": { "style": "justify-content: center;" },
			"children": [
				{
					"type": "v-pagination",
					"props": {
						"modelValue": "state.currentPage",
						"onUpdate:modelValue": "actions.setPage",
						"length": "state.totalPages"
					}
				}
			]
		}
	]
}
```

```javascript
state.items = [];
state.currentPage = 1;
state.totalPages = 1;
state.totalItems = 0;
state.pageSize = 10;

actions.init = () => {
	actions.loadPage(1);
};

actions.setPage = (page) => {
	state.currentPage = page;
	actions.loadPage(page);
};

actions.loadPage = async (page) => {
	const offset = (page - 1) * state.pageSize;

	// Get items for current page
	state.items = await readItems('products', {
		limit: state.pageSize,
		offset: offset,
	});

	// Get total count
	const countResult = await readItems('products', {
		aggregate: { count: '*' },
	});
	state.totalItems = countResult[0].count;
	state.totalPages = Math.ceil(state.totalItems / state.pageSize);
};
```

## Complete Example: Data Table with Pagination

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "v-card-title",
			"props": { "style": "display: flex; justify-content: space-between; align-items: center;" },
			"children": [
				{ "type": "span", "children": ["Products"] },
				{
					"type": "span",
					"props": { "style": "font-size: 14px; font-weight: normal; color: var(--theme--foreground-subdued);" },
					"children": ["Showing {{ state.showingStart }}-{{ state.showingEnd }} of {{ state.totalItems }}"]
				}
			]
		},
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "display: flex; justify-content: center; padding: 40px;" },
					"condition": "state.isLoading",
					"children": [{ "type": "v-progress-circular", "props": { "indeterminate": true } }]
				},
				{
					"type": "v-table",
					"props": {
						"items": "state.items",
						"headers": [
							{ "text": "Name", "value": "name" },
							{ "text": "Price", "value": "price" },
							{ "text": "Status", "value": "status" }
						]
					},
					"condition": "!state.isLoading"
				}
			]
		},
		{
			"type": "v-card-actions",
			"props": { "style": "justify-content: center; padding: 16px;" },
			"children": [
				{
					"type": "v-pagination",
					"props": {
						"modelValue": "state.currentPage",
						"onUpdate:modelValue": "actions.changePage",
						"length": "state.totalPages",
						"totalVisible": 7,
						"disabled": "state.isLoading"
					}
				}
			]
		}
	]
}
```

```javascript
state.items = [];
state.currentPage = 1;
state.totalPages = 1;
state.totalItems = 0;
state.pageSize = 25;
state.isLoading = false;
state.showingStart = 0;
state.showingEnd = 0;

actions.init = () => {
	actions.loadPage(1);
};

actions.changePage = (page) => {
	state.currentPage = page;
	actions.loadPage(page);
};

actions.loadPage = async (page) => {
	state.isLoading = true;

	try {
		const offset = (page - 1) * state.pageSize;

		// Parallel fetch: items and count
		const [items, countResult] = await Promise.all([
			readItems('products', {
				limit: state.pageSize,
				offset: offset,
				fields: ['id', 'name', 'price', 'status'],
			}),
			readItems('products', {
				aggregate: { count: '*' },
			}),
		]);

		state.items = items;
		state.totalItems = countResult[0].count;
		state.totalPages = Math.ceil(state.totalItems / state.pageSize);

		// Calculate showing range
		state.showingStart = offset + 1;
		state.showingEnd = Math.min(offset + state.pageSize, state.totalItems);
	} finally {
		state.isLoading = false;
	}
};
```

## Page Size Selector

```json
{
	"type": "div",
	"props": { "style": "display: flex; align-items: center; gap: 16px; justify-content: center;" },
	"children": [
		{
			"type": "v-select",
			"props": {
				"modelValue": "state.pageSize",
				"onUpdate:modelValue": "actions.setPageSize",
				"items": [
					{ "text": "10 per page", "value": 10 },
					{ "text": "25 per page", "value": 25 },
					{ "text": "50 per page", "value": 50 },
					{ "text": "100 per page", "value": 100 }
				],
				"style": "width: 140px;"
			}
		},
		{
			"type": "v-pagination",
			"props": {
				"modelValue": "state.currentPage",
				"onUpdate:modelValue": "actions.setPage",
				"length": "state.totalPages"
			}
		}
	]
}
```

```javascript
actions.setPageSize = (size) => {
	state.pageSize = size;
	state.currentPage = 1; // Reset to first page
	actions.loadPage(1);
};
```

## Notes

- Always recalculate `totalPages` after changing page size or after data changes
- Show loading state while fetching to prevent multiple clicks
- Display "showing X-Y of Z" for better UX
- Consider disabling pagination during loading
