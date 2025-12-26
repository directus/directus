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

<organization>

### Organizing Collections

Use `meta.group` to organize collections into folders or nest under other collections.

```json
// Create folder (no schema)
{ "action": "create", "data": { "collection": "cms_content", "meta": { "icon": "folder", "color": "#6644FF" } } }

// Nest collection under folder or another collection
{ "action": "update", "key": "articles", "data": { "meta": { "group": "cms_content" } } }

// Remove from parent (move to root)
{ "action": "update", "key": "articles", "data": { "meta": { "group": null } } }
```

**Notes:**
- Folders have no `schema` property (just `meta`)
- Both folders and regular collections can be parents
- Use `sort` to control display order within a group
- Use `collapse` to set default expanded/collapsed state

</organization>

<creating_collections>

- **Primary Keys**: Use UUID primary keys (see `fields` tool `<primary_keys>` section for detailed guidance)
- **System Fields**: Include system fields for content collections (see `<system_fields>` section below for complete
  template) unless specifically asked by user to omit them.
- ALWAYS show the collection URL to the user if it is present in the result.
- When creating a new collection, include both collection settings and initial fields (see `fields` tool for complete
  examples).

### Basic Collection Example

```json
{
	"action": "create",
	"data": {
		"collection": "articles",
		"fields": [
			{
				"field": "id",
				"type": "uuid",
				"meta": { "special": ["uuid"], "hidden": true, "readonly": true, "interface": "input" },
				"schema": { "is_primary_key": true, "length": 36, "has_auto_increment": false }
			},
			{
				"field": "title",
				"type": "string",
				"meta": { "interface": "input", "required": true },
				"schema": { "is_nullable": false }
			}
		],
		"schema": {}, // Always send empty object for new collection unless creating a folder collection
		"meta": {
			"singleton": false,
			"display_template": "{{title}}"
		}
	}
}
```

</creating_collections>

<system_fields>

### Complete System Fields Template

For content collections (blogs, products, pages), include these optional system fields for full CMS functionality:

```json
{
	"action": "create",
	"data": {
		"collection": "articles",
		"fields": [
			{
				"field": "id",
				"type": "uuid",
				"meta": {
					"hidden": true,
					"readonly": true,
					"interface": "input",
					"special": ["uuid"]
				},
				"schema": {
					"is_primary_key": true,
					"length": 36,
					"has_auto_increment": false
				}
			},
			{
				"field": "status",
				"type": "string",
				"meta": {
					"width": "full",
					"options": {
						// You might choose to customize these options based on the users request
						"choices": [
							{
								"text": "$t:published",
								"value": "published",
								"color": "var(--theme--primary)"
							},
							{
								"text": "$t:draft",
								"value": "draft",
								"color": "var(--theme--foreground)"
							},
							{
								"text": "$t:archived",
								"value": "archived",
								"color": "var(--theme--warning)"
							}
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
				"schema": {
					"default_value": "draft",
					"is_nullable": false
				}
			},
			{
				"field": "sort",
				"type": "integer",
				"meta": {
					"interface": "input",
					"hidden": true
				},
				"schema": {}
			},
			{
				"field": "user_created",
				"type": "uuid",
				"meta": {
					"special": ["user-created"],
					"interface": "select-dropdown-m2o",
					"options": {
						"template": "{{avatar}} {{first_name}} {{last_name}}"
					},
					"display": "user",
					"readonly": true,
					"hidden": true,
					"width": "half"
				},
				"schema": {}
			},
			{
				"field": "date_created",
				"type": "timestamp",
				"meta": {
					"special": ["date-created"],
					"interface": "datetime",
					"readonly": true,
					"hidden": true,
					"width": "half",
					"display": "datetime",
					"display_options": {
						"relative": true
					}
				},
				"schema": {}
			},
			{
				"field": "user_updated",
				"type": "uuid",
				"meta": {
					"special": ["user-updated"],
					"interface": "select-dropdown-m2o",
					"options": {
						"template": "{{avatar}} {{first_name}} {{last_name}}"
					},
					"display": "user",
					"readonly": true,
					"hidden": true,
					"width": "half"
				},
				"schema": {}
			},
			{
				"field": "date_updated",
				"type": "timestamp",
				"meta": {
					"special": ["date-updated"],
					"interface": "datetime",
					"readonly": true,
					"hidden": true,
					"width": "half",
					"display": "datetime",
					"display_options": {
						"relative": true
					}
				},
				"schema": {}
			}
		],
		"schema": {}, // Always send empty object for new collection unless creating a folder collection
		"meta": {
			"sort_field": "sort",
			"archive_field": "status",
			"archive_value": "archived",
			"unarchive_value": "draft",
			"singleton": false
		}
	}
}
```

**System Fields Explained:**

- `status` - Content workflow (draft/published/archived) with visual indicators
- `sort` - Manual ordering capability (used with `sort_field` in collection meta)
- `user_created`/`user_updated` - Track content authors and editors (requires relations to `directus_users`)
- `date_created`/`date_updated` - Automatic timestamps for content lifecycle tracking

**Required Relations for User Fields:** After creating the collection, add relations for user tracking fields (use
`relations` tool):

```json
// User created relation
{
	"action": "create",
	"data": {
		"collection": "articles",
		"field": "user_created",
		"related_collection": "directus_users",
		"schema": {}
	}
}

// User updated relation
{
	"action": "create",
	"data": {
		"collection": "articles",
		"field": "user_updated",
		"related_collection": "directus_users",
		"schema": {}
	}
}
```

</system_fields>

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
