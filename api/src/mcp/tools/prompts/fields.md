Perform CRUD operations on Directus Fields.

### ⚙️ Actions

- create: Add new fields
- read: Retrieve available fields
- update: Modify existing fields
- delete: Remove fields

### 📘 Creating Fields

Add fields to existing collections:

```json
{
	"action": "create",
	"data": {
		"collection": "organizations",
		"field": "notes",
		"type": "text",
		"meta": {
			"interface": "input-rich-text-md",
			"special": null,
			"note": "Internal notes about the organization. Supports markdown formatting.",
			"translations": [
				{
					"language": "en-US",
					"translation": "Notes"
				}
			],
			"options": {
				"placeholder": null,
				"customSyntax": null
			},
			"display": "formatted-value",
			"display_options": { "format": true }
		}
	}
}
```

#### Primary Key Recommendations

**🎯 Always use UUID primary keys for new collections:**

**Benefits of UUID Primary Keys:**

- **Security**: Non-sequential, unpredictable values prevent enumeration attacks
- **Scalability**: No database locking/coordination needed for ID generation
- **Distribution**: Safe for distributed systems, merging databases, replication
- **Privacy**: Don't reveal record counts or creation order
- **Integration**: Better for APIs, webhooks, and external system integration

**UUID Primary Key Template:**

```json
{
	"field": "id",
	"type": "uuid",
	"meta": { "hidden": true, "readonly": true, "interface": "input", "special": ["uuid"] },
	"schema": { "is_primary_key": true, "length": 36, "has_auto_increment": false }
}
```

**When to use Integer IDs:**

- Only when integrating with legacy systems that require integer keys
- When you specifically need sequential numbering (invoice numbers, etc.)
- For high-performance scenarios where UUID overhead matters

#### Field Types & Recommended Interfaces

| Group          | Field Type   | Description                      | Recommended Interface                                                        | Use Cases                                 |
| -------------- | ------------ | -------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| **Text**       | `string`     | Variable text (max 255 chars)    | `input`,`translations`                                                       | Names, titles, short descriptions         |
| **Text**       | `text`       | Long text content                | `input-multiline`,`input-rich-text-md`,`input-rich-text-html`,`translations` | Articles, descriptions, content           |
| **Text**       | `uuid`       | **Preferred** unique identifiers | `input` (manual), auto for relations                                         | **Primary keys** (recommended), relations |
| **Text**       | `hash`       | Hashed values                    | `input-hash`                                                                 | Passwords, secure tokens                  |
| **Text**       | `alias`      | Virtual/computed fields          | Various                                                                      | Presentational, relational                |
| **Numeric**    | `integer`    | Whole numbers                    | `input`                                                                      | Counts, IDs, quantities                   |
| **Numeric**    | `bigInteger` | Large numbers                    | `input`                                                                      | Large IDs, timestamps                     |
| **Numeric**    | `float`      | Decimal numbers                  | `input`,`slider`                                                             | Prices, measurements, ratings             |
| **Numeric**    | `decimal`    | Precise decimals                 | `input`                                                                      | Financial data, precise calculations      |
| **Boolean**    | `boolean`    | True/false values                | `boolean`,`toggle`                                                           | Flags, toggles, yes/no                    |
| **Date/Time**  | `timestamp`  | Date and time                    | `datetime`                                                                   | Created/updated dates, events             |
| **Date/Time**  | `dateTime`   | Date and time                    | `datetime`                                                                   | Appointments, schedules                   |
| **Date/Time**  | `date`       | Date only                        | `datetime` (date mode)                                                       | Birthdays, deadlines                      |
| **Date/Time**  | `time`       | Time only                        | `datetime` (time mode)                                                       | Opening hours, schedules                  |
| **Binary**     | `binary`     | Binary data                      | `file`                                                                       | File uploads, blobs                       |
| **Structured** | `json`       | Structured data                  | `input-code` (JSON mode),`group-raw`                                         | Settings, complex config                  |
| **Structured** | `csv`        | Comma-separated values           | `tags`                                                                       | Tags, categories, lists                   |
| **Geospatial** | `point`      | Geographic point                 | `map`                                                                        | Locations, coordinates                    |
| **Geospatial** | `lineString` | Geographic line                  | `map`                                                                        | Routes, paths                             |
| **Geospatial** | `polygon`    | Geographic area                  | `map`                                                                        | Regions, boundaries                       |

#### Essential Interface Configurations

**Text Interfaces:**

- `input` - Basic text input with `placeholder`, `trim`, `slug`, `font` options
- `input-multiline` - Textarea with `rows`, `placeholder` options
- `input-rich-text-md` - Markdown editor with `placeholder`, `customSyntax`, `imageToken` options
- `input-rich-text-html` - WYSIWYG editor with toolbar configuration and `tinymce_options`
- `input-hash` - Password input with hashing (for hash fields)
- `translations` - Multi-language input for string/text fields (not JSON!)

**Selection Interfaces:**

- `select-dropdown` - Single choice with `choices` array, `allowOther`, `placeholder` options
- `select-multiple-dropdown` - Multiple choices with `choices`, `placeholder` options
- `select-radio` - Radio buttons with `choices`, `iconOn`, `iconOff` options
- `select-multiple-checkbox` - Checkboxes with `choices`, `iconOn`, `iconOff` options
- `tags` - Tag input for CSV fields with `placeholder`, `alphabetize`, `allowCustom` options
- `boolean` - Toggle switch with `labelOn`, `labelOff`, `iconOn`, `iconOff` options
- `slider` - Numeric slider with `min`, `max`, `step`, `alwaysShowValue` options

**Date & Time Interfaces:**

- `datetime` - Date/time picker with `includeSeconds`, `use24` options
- `date` - Date picker
- `time` - Time picker

**Relational Interfaces:**

- `select-dropdown-m2o` - Many-to-one dropdown with `template`, `enableLink` options
- `list-o2m` - One-to-many list with `template`, `enableCreate`, `enableSelect` options
- `list-m2m` - Many-to-many with junction table configuration
- `list-m2a` - Many-to-any (polymorphic) relationships with collection selection

**File & Media Interfaces:**

- `file` - Single file upload with `folder`, `accept` options
- `files` - Multiple file uploads with folder and type restrictions
- `file-image` - Image-specific with crop/resize and `crop` options

**Advanced Interfaces:**

- `input-code` - Code editor with `language`, `template`, `lineNumber` options
- `map` - Geographic map interface for geospatial fields
- `group-raw` - Raw JSON object editor with nested fields
- `group-detail` - Nested object interface with accordion display

#### Layout & Width Options

Directus provides flexible layout control for field presentation:

**Width Options (`width` property):**

- `"half"` - Takes up half width, max 380px (great for paired fields like first/last name)
- `"full"` - Takes full width, max 760px (default for most fields)
- `"fill"` - Expands to fill all available space (ideal for wide content)

**Field Configuration Sections:**

**Schema Properties:**

- `default_value` - Default value for new items
- `is_nullable` - Whether field can be null
- `is_unique` - Whether values must be unique across collection
- `length` - Maximum character/byte length for string fields

**Field Properties:**

- `readonly` - Field cannot be edited after creation
- `hidden` - Field is hidden from forms (but still accessible via API)
- `required` - Field must have a value when creating items
- `group` - Organize related fields into collapsible sections
- `sort` - Order of fields in forms

**Validation Rules:**

- Add validation rules in `validation` array to ensure data quality
- Include custom error messages for failed validations
- Validations apply to Directus input, not database-level constraints

**Conditional Logic:**

- Use `conditions` array to show/hide fields based on other field values
- Can conditionally set: `hidden`, `readonly`, `required`, and interface options
- Example: Show "other_reason" field only when reason equals "other"

**Field Notes & Context:** Add `note` property for non-obvious fields to provide context:

- **Good**: `"Internal reference only - not displayed to end users"`
- **Good**: `"SEO meta description (recommended 150-160 characters)"`
- **Good**: `"Webhook URL for payment notifications - must be HTTPS"`
- **Good**: `"Upload resolution should be at least 1200x800px"`
- **Avoid**: `"First name of the customer"` (obvious from field name)

**Translations Support:**

**IMPORTANT**: Always check for a `languages` collection first to determine available languages.

**Workflow for Adding Translations:**

1. **Check schema**: Use `schema` tool to see if a `languages` collection exists
2. **Read languages**: If found, get the language codes from that collection
3. **Apply translations**: Use those codes in your field translation objects
4. **Fallback**: If no languages collection, use common codes like `en-US`, `es-ES`

Add field name translations in different languages:

```json
{
	"field": "title",
	"type": "string",
	"meta": {
		"interface": "input",
		"translations": [
			{
				"language": "en-US",
				"translation": "Title"
			},
			{
				"language": "es-ES",
				"translation": "Título"
			},
			{
				"language": "fr-FR",
				"translation": "Titre"
			}
		]
	}
}
```

**Field Translation Structure:**

- `language`: Language code (from languages collection if available)
- `translation`: Field label/name in that language

**Display Templates:**

Use display templates to customize how relational data appears:

```json
{
	"field": "author",
	"type": "uuid",
	"meta": {
		"interface": "select-dropdown-m2o",
		"display": "related-values",
		"display_options": {
			"template": "{{first_name}} {{last_name}} ({{email}})"
		},
		"options": {
			"template": "{{first_name}} {{last_name}}"
		}
	}
}
```

Templates support:

- `{{field_name}}` - Display field values
- `{{field_name.nested_field}}` - Access nested object properties
- `{{$t:key}}` - Localized text from translation keys
- Conditional logic and filters for advanced formatting

#### Display Options

Always specify appropriate `display` options:

- `raw` - Show raw value
- `formatted-value` - Format based on field type
- `labels` - Show labels for choice fields with color coding
- `datetime` - Format dates with `relative` option
- `user` - Display user info for user fields
- `file` - Display file info and thumbnails

#### Example with Layout & Context

```json
{
	"field": "internal_notes",
	"type": "text",
	"meta": {
		"interface": "input-rich-text-md",
		"width": "full",
		"group": "admin_fields",
		"note": "Internal team notes - not visible to customers or public API",
		"conditions": [
			{
				"name": "status",
				"rule": {
					"_eq": "review"
				}
			}
		]
	}
}
```
