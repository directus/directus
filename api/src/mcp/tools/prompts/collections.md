Perform CRUD operations on Directus Collections.

<actions>

- `create`: Add new collections
- `read`: Retrieve available collections
- `update`: Modify existing collections
- `delete`: Remove collections </actions>

<collection_structure>

### Collection Structure

```json
{
	"collection": "products",
	"meta": {
		"collection": "ai_prompts",
		"icon": "inventory_2", // Any Material Symbols icons
		"note": "Main product catalog with inventory tracking" // Helpful 1 sentence description
		"color": "#6366F1", // Color shown in content module sidebar
		"singleton": false, // Single-item collections (settings, globals)
		"hidden": false, // Hide from navigation
		"accountability": "all", // Track who activity and revisions (`"all"`, `"activity"`, `null`)
		"sort_field": "sort", // Default sorting field (auto-creates if needed)
		"archive_app_filter": true, // Enable soft delete in the app
		"archive_field": "status", // Field used for archiving (status, deleted_at, etc.)
		"archive_value": "archived", // Value that marks items as archived
		"unarchive_value": "published", // Value that marks items as active
		"display_template": "{{name}} - ${{price}}",
		"versioning": false, // Enable content versioning for this collection
		"sort": 2, // Sort order for this collection
		"group": null, // Parent collection (use to group and nest collections in data model)
		"collapse": "open" // Default collection to expanded or collapsed if child collections
		"preview_url": "https://store.example.com/products/{{slug}}", // Live preview URL to view items within collection - supports using template variables
		"translations": [
			{
				"language": "en-US",
				"translation": "Products",
				"singular": "product",
				"plural": "products"
			},
			{
				"language": "es-ES",
				"translation": "Productos",
				"singular": "producto",
				"plural": "productos"
			}
		],
	}
}
```

</collection_structure>

<creating_collections>

- **Primary Keys**: Use UUID primary keys (see `fields` tool `<primary_keys>` section for detailed guidance)
- ALWAYS show the collection URL to the user if it is present in the result.
- When creating a new collection, include both collection settings and initial fields (see `fields` tool for complete
  examples).

```json
{
	"action": "create",
	"data": {
		"collection": "organizations",
		"fields": [
			{
				"field": "id",
				"type": "uuid",
				"meta": { "special": ["uuid"] },
				"schema": { "is_primary_key": true }
			},
			{
				"field": "status",
				"type": "string",
				"meta": {
					"width": "full",
					"options": {
						"choices": [
							{ "text": "$t:published", "value": "published", "color": "var(--theme--primary)" },
							{ "text": "$t:draft", "value": "draft", "color": "var(--theme--foreground)" },
							{ "text": "$t:archived", "value": "archived", "color": "var(--theme--warning)" }
						]
					},
					"interface": "select-dropdown",
					"display": "labels",
					"display_options": {
						"showAsDot": true,
						"choices": [
							{
								"text": "$t:published",
								"value": "published",
								"color": "var(--theme--primary)",
								"foreground": "var(--theme--primary)",
								"background": "var(--theme--primary-background)"
							},
							{
								"text": "$t:draft",
								"value": "draft",
								"color": "var(--theme--foreground)",
								"foreground": "var(--theme--foreground)",
								"background": "var(--theme--background-normal)"
							},
							{
								"text": "$t:archived",
								"value": "archived",
								"color": "var(--theme--warning)",
								"foreground": "var(--theme--warning)",
								"background": "var(--theme--warning-background)"
							}
						]
					}
				},
				"schema": { "default_value": "draft", "is_nullable": false }
			}
		],
		"schema": {},
		"meta": {
			"sort_field": "sort",
			"archive_field": "status",
			"archive_value": "archived",
			"unarchive_value": "draft",
			"singleton": false,
			"translations": null,
			"display_template": "{{name}} ({{status}})"
		}
	}
}
```

</creating_collections>

<translations>
For collection name translations, check for `languages` collection first, then provide collection names in available languages (similar to field translations - see `fields` tool `<translations>` section for translation workflow).

```json
{
	"meta": {
		"translations": [
			{ "language": "en-US", "translation": "Products", "singular": "product", "plural": "products" },
			{ "language": "es-ES", "translation": "Productos", "singular": "producto", "plural": "productos" }
		]
	}
}
```

</translations>

<display_templates>

Control how collection items appear in relationships and lists:

```json
{
	"meta": {
		"display_template": "{{name}} - {{category}} ({{status}})"
	}
}
```

**Template Variables:**

- `{{field_name}}` - Any field from the collection
- `{{field_name.nested}}` - Access nested object properties </display_templates>
