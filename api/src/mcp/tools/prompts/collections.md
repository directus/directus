Perform CRUD operations on Directus Collections.

### ⚙️ Actions

- create: Add new collections
- read: Retrieve available collections
- update: Modify existing collections
- delete: Remove collections

### 📘 Creating Collections

When creating a new collection, include both collection settings and initial fields:

**⭐ Primary Key Best Practice: Always use UUID primary keys for better scalability, security, and distributed system
compatibility.**

```json
{
	"type": "collection",
	"action": "create",
	"data": {
		"collection": "organizations",
		"fields": [
			{
				"field": "id",
				"type": "uuid",
				"meta": { "hidden": true, "readonly": true, "interface": "input", "special": ["uuid"] },
				"schema": { "is_primary_key": true, "length": 36, "has_auto_increment": false }
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
			"singleton": false
		}
	}
}
```
