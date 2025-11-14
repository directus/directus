Retrieve essential Directus schema information to understand the data structure - collections, fields, and
relationships. This is a **READ-ONLY discovery tool** designed to help you explore and comprehend existing schema. It is
for schema exploration and understanding only. For schema modifications, use the dedicated `collections`, `fields`, and
`relations` tools.

**Note**: This tool provides an extremly curated response optimized for LLM understanding, not the raw Directus API
schema response.

## Operation Modes

### Discovery Mode (Default)

**Usage**: Call without parameters or with empty `keys` array

```json
{}
```

**Returns**: Lightweight schema overview

- `collections`: Alphabetically sorted array of real collection names (database tables)
- `collection_folders`: Alphabetically sorted array of folder names (UI-only, not real tables). Distinct from file
  folders. They are used for grouping different collections together in the UI.
- `notes`: Descriptions for both collections and folders (where available)

**Important**: Folders share the same namespace as collections. Before creating a new collection, check the `folders`
array to avoid naming conflicts (e.g., can't create a 'website' collection if a 'website' folder exists).

**Sample Response**:

```json
{
	"collections": ["categories", "contacts", "organizations", "pages", "posts", "products"],
	"collection_folders": ["content", "marketing", "website"],
	"notes": {
		"contacts": "People at the organizations you work with",
		"organizations": "Your clients and customers",
		"pages": "Static pages with page builder blocks",
		"posts": "Blog posts and articles",
		"content": "Content management folder"
	}
}
```

**Use case**: Initial exploration, getting oriented with available data structures

### Detailed Mode

**Usage**: Specify collections to examine

```json
{ "keys": ["products", "categories", "users"] }
```

**Returns**: Object of collections with field and relation details

- Field definitions (type, validation, defaults)
- Relationship mappings (foreign keys, junction tables)
- Interface configurations and display options
- Field metadata and constraints
- **Nested field structures** for JSON fields with repeaters/lists (includes recursive nesting)

**Sample Response**:

```json
{
	"posts": {
		"id": {
			"type": "uuid",
			"primary_key": true,
			"readonly": true
		},
		"title": {
			"type": "string",
			"required": true
		},
		"status": {
			"type": "string",
			"interface": {
				"type": "select-dropdown",
				"choices": ["draft", "published", "archived"]
			}
		},
		"category": {
			"type": "uuid",
			"relation": {
				"type": "m2o",
				"related_collections": ["categories"]
			}
		}
	},
	"block_faqs": {
		"headline": {
			"type": "text",
			"interface": {
				"type": "input-rich-text-html"
			}
		},
		"faqs": {
			"type": "json",
			"interface": {
				"type": "list"
			},
			"fields": {
				"title": {
					"type": "text",
					"interface": {
						"type": "input-multiline"
					}
				},
				"answer": {
					"type": "text",
					"interface": {
						"type": "input-multiline"
					}
				}
			}
		}
	}
}
```

**Use case**: Deep-dive analysis of specific collections before working with data or schema.

## Recommended Workflow

1. **Discover**: Call without `keys` to see all available collections
2. **Analyze**: Based on user requirements, identify relevant collections
3. **Detail**: Call with specific collection names to understand field structures
4. **Implement**: Use appropriate CRUD tools with schema knowledge
