# v-highlight

Text highlighting component that highlights matching parts of text.

## Basic Usage

```json
{
	"type": "v-highlight",
	"props": {
		"text": "state.fullText",
		"query": "state.searchQuery"
	}
}
```

## Props

| Prop    | Type   | Default | Description                            |
| ------- | ------ | ------- | -------------------------------------- |
| `text`  | string | ""      | Full text to display                   |
| `query` | string | ""      | Text to highlight within the full text |

## Search Results Highlighting

```json
{
	"type": "v-list",
	"children": [
		{
			"type": "template",
			"iterate": "state.searchResults",
			"as": "result",
			"template": {
				"type": "v-list-item",
				"props": { "onClick": "() => actions.openResult(result)" },
				"children": [
					{
						"type": "v-list-item-content",
						"children": [
							{
								"type": "v-highlight",
								"props": {
									"text": "result.title",
									"query": "state.searchQuery"
								}
							}
						]
					}
				]
			}
		}
	]
}
```

```javascript
state.searchQuery = '';
state.searchResults = [];

actions.search = async () => {
	if (state.searchQuery.length < 2) {
		state.searchResults = [];
		return;
	}

	state.searchResults = await readItems('articles', {
		filter: {
			title: { _contains: state.searchQuery },
		},
		limit: 10,
	});
};
```

## Complete Example: Searchable List

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Search Products"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "v-input",
					"props": {
						"modelValue": "state.query",
						"onUpdate:modelValue": "actions.setQuery",
						"placeholder": "Search...",
						"iconLeft": "search"
					}
				},
				{
					"type": "v-list",
					"props": { "style": "margin-top: 16px;" },
					"condition": "state.results.length > 0",
					"children": [
						{
							"type": "template",
							"iterate": "state.results",
							"as": "item",
							"template": {
								"type": "v-list-item",
								"children": [
									{
										"type": "v-list-item-content",
										"children": [
											{
												"type": "div",
												"children": [
													{
														"type": "strong",
														"children": [
															{
																"type": "v-highlight",
																"props": {
																	"text": "item.name",
																	"query": "state.query"
																}
															}
														]
													}
												]
											},
											{
												"type": "div",
												"props": { "style": "color: var(--theme--foreground-subdued); font-size: 12px;" },
												"children": [
													{
														"type": "v-highlight",
														"props": {
															"text": "item.description",
															"query": "state.query"
														}
													}
												]
											}
										]
									}
								]
							}
						}
					]
				},
				{
					"type": "v-info",
					"props": { "center": true },
					"condition": "state.query.length > 0 && state.results.length === 0",
					"children": ["No results found for \"{{ state.query }}\""]
				}
			]
		}
	]
}
```

```javascript
state.query = '';
state.results = [];
state.allItems = [];

actions.init = async () => {
	state.allItems = await readItems('products', {
		fields: ['id', 'name', 'description'],
	});
};

actions.setQuery = (value) => {
	state.query = value;
	actions.filterResults();
};

actions.filterResults = () => {
	if (!state.query) {
		state.results = [];
		return;
	}

	const q = state.query.toLowerCase();
	state.results = state.allItems.filter(
		(item) => item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)),
	);
};
```

## Notes

- Matching is case-insensitive
- Highlighted portions receive visual emphasis (typically bold or background color)
- Works well for search result displays
- Pair with a search input for interactive filtering
- Empty query shows text without highlighting
