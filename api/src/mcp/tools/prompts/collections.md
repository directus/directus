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
			"singleton": false,
			"translations": [
				{
					"language": "en-US",
					"translation": "Organizations",
					"singular": "organization",
					"plural": "organizations"
				},
				{
					"language": "es-ES",
					"translation": "Organizaciones", 
					"singular": "organización",
					"plural": "organizaciones"
				}
			],
			"display_template": "{{name}} ({{status}})"
		}
	}
}
```

## 🌐 Internationalization & Display

### Workflow for Adding Translations
1. **Check for languages collection**: Use `schema` tool to see if a `languages` collection exists
2. **Get available languages**: If found, read the languages collection to get language codes
3. **Apply translations**: Use those language codes in your translation objects
4. **Fallback**: If no languages collection exists, use common codes like `en-US`, `es-ES`, etc.

Example workflow:
```json
// Step 1: Check schema for languages collection
{ "action": "read", "keys": ["languages"] }

// Step 2: If found, read languages to get codes  
{ "type": "collection", "action": "read", "keys": ["languages"] }

// Step 3: Use those language codes in translations
```

### Collection Translations
**IMPORTANT**: Always check for a `languages` collection first to determine available languages.

Provide collection names in multiple languages:
```json
{
  "meta": {
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
      },
      {
        "language": "fr-FR",
        "translation": "Produits",
        "singular": "produit",
        "plural": "produits"  
      }
    ]
  }
}
```

**Translation Structure:**
- `language`: Language code (from languages collection if available)
- `translation`: Display name for the collection
- `singular`: Singular form (lowercase)
- `plural`: Plural form (lowercase)

### Display Templates
Control how collection items appear in relationships and lists:
```json
{
  "meta": {
    "display_template": "{{name}} - {{category}} ({{status}})",
    "preview_url": "https://example.com/{{slug}}"
  }
}
```

**Template Variables:**
- `{{field_name}}` - Any field from the collection
- `{{field_name.nested}}` - Access nested object properties
- `{{$t:key}}` - Localized translation strings
- `{{$now}}` - Current timestamp
- Supports filters and conditional logic

### Collection Settings
Key collection metadata options:
- `singleton`: Single-item collections (settings, globals)
- `hidden`: Hide from navigation (system collections)
- `icon`: Collection icon (`"mdi:account"`, `"mdi:store"`)
- `color`: Theme color for the collection
- `note`: Description shown in collection overview
- `sort_field`: Default sorting field (auto-creates if needed)
- `archive_field`: Field used for archiving (status, deleted_at, etc.)
- `archive_value`: Value that marks items as archived
- `unarchive_value`: Value that marks items as active
- `accountability`: Track who created/modified items (`"all"`, `"activity"`, `null`)

### Example Complete Collection
```json
{
  "collection": "products",
  "schema": {
    "comment": "Product catalog with multilingual support"
  },
  "meta": {
    "icon": "inventory_2",
    "color": "#6366F1", 
    "singleton": false,
    "hidden": false,
    "accountability": "all",
    "sort_field": "sort",
    "archive_field": "status",
    "archive_value": "archived",
    "unarchive_value": "published",
    "display_template": "{{name}} - ${{price}}",
    "preview_url": "https://store.example.com/products/{{slug}}",
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
    "note": "Main product catalog with inventory tracking"
  }
}
```
