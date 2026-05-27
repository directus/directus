Perform CRUD operations on Directus Fields.

<actions>
- `create`: Add one or multiple fields to a collection
- `read`: View field configurations
- `update`: Update one or multiple fields
- `delete`: Remove fields
</actions>

<field_types>

- **Text**: `string` (max 255 chars), `text` (unlimited), `uuid` (relations/IDs), `hash` (passwords)
- **Numeric**: `integer`, `bigInteger`, `float`, `decimal` (for financial precision)
- **Date/Time**: `timestamp`, `datetime`, `date`, `time`
- **Boolean**: `boolean` for toggles/flags
- **Structured**: `json` (complex data), `csv` (tags/lists)
- **Alias**: Virtual fields for relations (`o2m`, `m2m`, `m2a`, `files`, `translations`)
- **Geospatial**: `point`, `lineString`, `polygon` for maps </field_types>

<adding_fields>

**Important**: When using the `fields` tool, `data` must always be an array of field objects, even for single fields.
Make sure you include `meta` and `schema` objects for each field.

Add fields to existing collections:

```json
{
	"action": "create",
	"collection": "articles",
	"data": [
		{
			"field": "excerpt",
			"type": "text",
			"meta": {
				"interface": "input-rich-text-md",
				"special": null,
				"note": "Article excerpt for previews and SEO. Supports markdown formatting.",
				"translations": [
					{
						"language": "en-US",
						"translation": "Excerpt"
					}
				],
				"options": {
					"placeholder": null,
					"customSyntax": null
				},
				"display": "formatted-value",
				"display_options": { "format": true }
			},
			"schema": {
				"name": "test",
				"table": "random_collection",
				"data_type": "text"
			}
		}
	]
}
```

**Multiple Fields Example:**

```json
{
	"action": "create",
	"collection": "articles",
	"data": [
		{
			"field": "title",
			"type": "string"
			// Rest of field data
		},
		{
			"field": "content",
			"type": "text"
			// Rest of field data
		}
	]
}
```

**Note**: You can omit `null` or `false` values from the schema object. </adding_fields>

<relationship_fields>

**CRITICAL**: Field type and meta.special determine relationship behavior.

- **M2O**: `type: "uuid"`, `special: ["m2o"]`, interface: `select-dropdown-m2o` → then create relation
- **O2M**: `type: "alias"`, `special: ["o2m"]`, interface: `list-o2m` → auto-created with M2O
- **M2M**: `type: "alias"`, `special: ["m2m"]`, interface: `list-m2m` → needs junction collection
- **M2A**: `type: "alias"`, `special: ["m2a"]`, interface: `list-m2a` → polymorphic, needs junction
- **File**: `type: "uuid"`, `special: ["file"]`, interface: `file` or `file-image` → single file relation
- **Files**: `type: "alias"`, `special: ["files"]`, interface: `files` → multiple files via M2M
- **Translations**: `type: "alias"`, `special: ["translations"]`, interface: `translations` → special M2M

### M2O Field Example

```json
{
	"collection": "posts",
	"field": "author",
	"type": "uuid",
	"schema": {
		"name": "author",
		"table": "posts",
		"data_type": "uuid",
		"is_nullable": true,
		"foreign_key_schema": "public",
		"foreign_key_table": "team",
		"foreign_key_column": "id"
	},
	"meta": {
		"collection": "posts",
		"field": "author",
		"special": ["m2o"],
		"interface": "select-dropdown-m2o",
		"options": {
			"template": "{{image.$thumbnail}} {{name}}"
		},
		"display": "related-values",
		"display_options": {
			"template": "{{image.$thumbnail}} {{name}}"
		},
		"sort": 15,
		"width": "half"
	}
}
```

### O2M Field Example

```json
{
	"collection": "posts",
	"field": "comments",
	"type": "alias",
	"schema": null,
	"meta": {
		"collection": "posts",
		"field": "comments",
		"special": ["o2m"],
		"interface": "list-o2m",
		"options": {
			"template": "{{author}} - {{content}} ({{status}})"
		},
		"display": "related-values",
		"display_options": {
			"template": "{{author}} - {{content}} ({{status}})"
		},
		"sort": 10,
		"width": "full",
		"required": false,
		"group": null
	}
}
```

### M2M Field Example

```json
{
	"collection": "posts",
	"field": "categories",
	"type": "alias",
	"schema": null,
	"meta": {
		"collection": "posts",
		"field": "categories",
		"special": ["m2m"],
		"interface": "list-m2m",
		"options": {
			"template": "{{categories_id.name}} ({{categories_id.slug}})"
		},
		"display": "related-values",
		"display_options": {
			"template": "{{categories_id.name}} ({{categories_id.slug}})"
		},
		"sort": 9,
		"width": "full"
	}
}
```

### M2A Field Example

```json
{
	"collection": "pages",
	"field": "blocks",
	"type": "alias",
	"schema": null,
	"meta": {
		"collection": "pages",
		"field": "blocks",
		"special": ["m2a"],
		"interface": "list-m2a",
		"options": {},
		"display": "related-values",
		"display_options": {
			"template": "{{collection}}"
		},
		"sort": 8,
		"width": "full"
	}
}
```

### File Field Example

```json
{
	"collection": "posts",
	"field": "featured_image",
	"type": "uuid",
	"schema": {
		"name": "featured_image",
		"table": "posts",
		"data_type": "uuid",
		"is_nullable": true,
		"foreign_key_schema": "public",
		"foreign_key_table": "directus_files",
		"foreign_key_column": "id"
	},
	"meta": {
		"collection": "posts",
		"field": "featured_image",
		"special": ["file"],
		"interface": "file-image",
		"options": {
			"folder": "post-images"
		},
		"display": "image",
		"display_options": null,
		"sort": 1,
		"width": "half",
		"required": false,
		"group": "media"
	}
}
```

### Files Field Example

```json
{
	"collection": "posts",
	"field": "gallery",
	"type": "alias",
	"schema": null,
	"meta": {
		"collection": "posts",
		"field": "gallery",
		"special": ["files"],
		"interface": "files",
		"options": null,
		"display": "related-values",
		"display_options": null,
		"sort": 4,
		"width": "full"
	}
}
```

### Translations Field Example

```json
{
	"collection": "posts",
	"field": "translations",
	"type": "alias",
	"schema": null,
	"meta": {
		"collection": "posts",
		"field": "translations",
		"special": ["translations"],
		"interface": "translations",
		"options": {
			"userLanguage": true,
			"defaultOpenSplitView": true
		},
		"display": "translations",
		"display_options": {
			"template": "{{title}}", // Field to display from the translated collection (ie post title)
			"languageField": "name" // Name of the language field from the languages collection
		},
		"sort": 22,
		"width": "full"
	}
}
```

**Note**: Alias fields don't need a schema object since they're virtual. </relationship_fields>

<primary_keys> **🎯 ALWAYS use UUID as primary keys for new collections unless integers or manually entered strings ares
specifically requested by the user.**

**UUID Primary Key Template:**

```json
{
	"field": "id",
	"type": "uuid",
	"meta": { "hidden": true, "readonly": true, "interface": "input", "special": ["uuid"] },
	"schema": { "is_primary_key": true, "length": 36, "has_auto_increment": false }
}
```

</primary_keys>

<interfaces>
## Common Interfaces

**Text**: `input`, `input-multiline`, `input-rich-text-md`, `input-rich-text-html`, `input-hash`, `translations`
**Selection**: `select-dropdown`, `select-multiple-dropdown`, `select-radio`, `select-multiple-checkbox`, `tags`,
`boolean`, `slider` **Date/Time**: `datetime`, `date`, `time` **Relational**: `select-dropdown-m2o`, `list-o2m`,
`list-m2m`, `list-m2a` **Files**: `file`, `files`, `file-image` **Advanced**: `input-code`, `map`, `group-raw`,
`group-detail` </interfaces>

<field_configuration>

### Layout

- **width**: `"half"` (380px max), `"full"` (760px max, default), `"fill"` (no limit)
- **sort**: Field order in forms
- **group**: Group related fields into collapsible sections (must be used with `alias` group fields)

### Schema Properties

- **default_value**: Default for new items
- **is_nullable**: Can be null
- **is_unique**: Must be unique
- **length**: Max length for strings

### Meta Properties

- **required**: Must have value
- **readonly**: Cannot edit after creation
- **hidden**: Hidden from UI (still in API)
- **validation**: Custom validation rules
- **validation_message**: Custom error messages
- **note**: Context for non-obvious fields

### Conditions

Dynamically control field behavior based on other field values:

```json
{
	"conditions": [
		{
			"name": "Hide If Author Is Null",
			"rule": {
				"_and": [
					{
						"author": {
							"_null": true
						}
					}
				]
			},
			"hidden": true
		},
		{
			"name": "Required If Published",
			"rule": {
				"status": {
					"_eq": "published"
				}
			},
			"required": true
		}
	]
}
```

**Condition Properties**:

- `name`: Description of the condition
- `rule`: Filter rules using Directus filter syntax
- Can set: `hidden`, `readonly`, `required`, or interface-specific options

**Common Rules**:

- `_null`: Check if field is null
- `_eq`: Equals specific value
- `_neq`: Not equals
- `_in`: Value in array
- `_and`/`_or`: Combine multiple conditions

### Special Fields

- `special: ["uuid"]`: Auto-generate UUID
- `special: ["user-created"]`: Track creating user
- `special: ["date-created"]`: Track creation time
- `special: ["user-updated"]`: Track last editor
- `special: ["date-updated"]`: Track last edit time
- `special: ["cast-json"]`: Cast JSON strings to objects </field_configuration>

<translations>
Field names can (and should be) translated for editors using the app.
Check for `languages` collection first, then add field translations based on which languages are stored in DB. IF not 99% sure, confirm with user first.

```json
"translations": [
  {"language": "en-US", "translation": "Title"},
  {"language": "es-ES", "translation": "Título"}
]
```

</translations>

<display_templates> Display templates can be customized used to enhance the UX for editors.

```json
"display": "related-values",
"display_options": {
  "template": "{{first_name}} {{last_name}}"
}
```

**Display types**: `raw`, `formatted-value`, `labels`, `datetime`, `user`, `file`, `related-values` </display_templates>

<complete_example>

#### Complete Field Example with Advanced Features

This shows a real field configuration with validation, conditions, and all metadata (as returned from a read operation):

```json
{
	"collection": "block_button",
	"field": "url",
	"type": "string",
	"schema": {
		"name": "url",
		"table": "block_button",
		"data_type": "character varying", // Database-specific type
		"default_value": null,
		"generation_expression": null,
		"max_length": 255, // String length limit
		"numeric_precision": null,
		"numeric_scale": null,
		"is_generated": false,
		"is_nullable": true,
		"is_unique": false,
		"is_indexed": false,
		"is_primary_key": false,
		"has_auto_increment": false,
		"foreign_key_schema": null, // Would contain relation info for M2O fields
		"foreign_key_table": null,
		"foreign_key_column": null,
		"comment": null
	},
	"meta": {
		"id": 811, // Auto-generated field ID (not used in create)
		"collection": "block_button",
		"field": "url",
		"special": null, // No special behavior for this field
		"interface": "input",
		"options": {
			"iconLeft": "link", // Icon displayed in the input
			"trim": true // Remove whitespace on save
		},
		"display": "formatted-value",
		"display_options": {
			"format": true // Apply auto formatting based on field type
		},
		"readonly": false,
		"hidden": true, // Hidden by default, shown conditionally
		"sort": 11, // Field order in forms
		"width": "half",
		"translations": null, // No field name translations
		"note": "The URL to link to. Could be relative (ie `/my-page`) or a full external URL (ie `https://docs.directus.io`)",
		"conditions": [
			{
				"hidden": false, // Show field when condition is met
				"name": "If type = external",
				"options": {
					"clear": false,
					"font": "sans-serif",
					"masked": false,
					"slug": false,
					"trim": false
				},
				"rule": {
					"_and": [
						{
							"type": {
								// Show when 'type' field equals 'url'
								"_eq": "url"
							}
						}
					]
				}
			}
		],
		"required": false,
		"group": null,
		"validation": {
			"_and": [
				{
					"url": {
						"_regex": "^(?:\\/[A-Za-z0-9\\-._~%!$&'()*+,;=:@\\/]*|https?:\\/\\/[^\\s/$.?#].[^\\s]*)$"
					}
				}
			]
		}, // Regex validation for URLs (relative or absolute)
		"validation_message": "Invalid URL. Check your URL and try again. Properly formatted relative URLs (`/pages/test` ) and absolute URLs (`https://example.com`) are supported."
	}
}
```

</complete_example>

<related_tools>

## Related Tools

- `collections`: Create containers for fields
- `relations`: Connect fields between collections </related_tools>
