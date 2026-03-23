Create and manage relationships between Directus Collections.

<prerequisites>
Before creating relations:
✓ Collections must exist (use `collections` tool)
✓ Fields must be created with correct types (use `fields` tool)
✓ Junction collections must exist for M2M/M2A relationships
✓ Optional system user fields (`user_created`/`user_updated`) require relations to `directus_users` (see `collections` tool `<system_fields>` section)
</prerequisites>

<actions>
- `create`: Establish relationship between collections
- `read`: View existing relationships
- `update`: Modify relationship settings (only schema.on_delete/on_update and meta can be updated)
- `delete`: Remove relationships
</actions>

<basic_relation> After creating relational fields, define the relationship:

```json
{
	"action": "create",
	"data": {
		"collection": "articles",
		"field": "author",
		"related_collection": "directus_users",
		"meta": { "sort_field": null },
		"schema": { "on_delete": "SET NULL" }
	}
}
```

</basic_relation>

<relationship_types> <m2o_workflow>

### M2O (Many-to-One)

Multiple items in one collection relate to one item in another.

**Example**: Many articles → one author

**Complete M2O Workflow**:

1. **Add M2O field** to the "many" collection → Use `fields` tool with `type: "uuid"` and
   `interface: "select-dropdown-m2o"` (see `fields` tool `<relationship_fields>` M2O example)

2. **Create relation** (use `relations` tool):

```json
{
	"action": "create",
	"collection": "articles",
	"field": "author",
	"data": {
		"collection": "articles",
		"field": "author",
		"related_collection": "directus_users",
		"schema": { "on_delete": "SET NULL" }
	}
}
```

</m2o_workflow>

<o2m_workflow>

### O2M (One-to-Many)

One item in a collection relates to many items in another collection.

**Example**: One author → many articles

**Complete O2M Workflow**:

1. **Add O2M field** to the "one" collection → Use `fields` tool with `type: "alias"`, `special: ["o2m"]`, and
   `interface: "list-o2m"`

2. **Create relation** connecting to existing M2O field (use `relations` tool):

```json
{
	"action": "create",
	"collection": "articles",
	"field": "author",
	"data": {
		"collection": "articles",
		"field": "author",
		"related_collection": "authors",
		"meta": {
			"one_field": "articles",
			"sort_field": null
		},
		"schema": {
			"on_delete": "SET NULL"
		}
	}
}
```

</o2m_workflow>

<m2m_workflow>

### M2M (Many-to-Many)

Items in both collections can relate to multiple items in the other.

**Example**: Articles ↔ Tags

**Complete M2M Workflow**:

1. **Create junction collection** → Use `collections` tool to create `article_tags` with UUID primary key

2. **Add alias fields** to both collections → Use `fields` tool with `type: "alias"`, `special: ["m2m"]`, and
   `interface: "list-m2m"` (see `fields` tool `<relationship_fields>` M2M example)

3. **Add junction fields** → Use `fields` tool to add `article_id` (UUID), `tag_id` (UUID), and optional `sort`
   (integer) fields to junction collection

4. **Create bidirectional relations** (use `relations` tool with CASCADE):

```json
// First relation
{
  "action": "create",
  "collection": "article_tags",
  "field": "article_id",
  "data": {
    "collection": "article_tags",
    "field": "article_id",
    "related_collection": "articles",
    "meta": {
      "one_field": "tags",
      "junction_field": "tag_id",
      "sort_field": "sort"
    },
    "schema": {"on_delete": "CASCADE"}
  }
}

// Second relation
{
  "action": "create",
  "collection": "article_tags",
  "field": "tag_id",
  "data": {
    "collection": "article_tags",
    "field": "tag_id",
    "related_collection": "tags",
    "meta": {
      "one_field": "articles",
      "junction_field": "article_id"
    },
    "schema": {"on_delete": "CASCADE"}
  }
}
```

</m2m_workflow>

<m2a_workflow>

### M2A (Many-to-Any)

Items can relate to items from multiple different collections.

**Example**: Page blocks (hero, text, gallery)

**Complete M2A Workflow**:

1. **Create block collections** → Use `collections` tool to create each block type (e.g., `block_hero`, `block_text`,
   `block_gallery`) with UUID primary keys and specific fields

2. **Create junction collection** → Use `collections` tool to create `page_blocks` junction (hidden collection with UUID
   primary key)

3. **Add M2A field** → Use `fields` tool with `type: "alias"`, `special: ["m2a"]`, and `interface: "list-m2a"`

4. **Add junction fields** → Use `fields` tool to add `page` (UUID), `item` (string), `collection` (string), and `sort`
   (integer) fields to junction

5. **Create relations** (use `relations` tool):

```json
// Item relation (polymorphic)
{
  "action": "create",
  "collection": "page_blocks",
  "field": "item",
  "data": {
    "collection": "page_blocks",
    "field": "item",
    "related_collection": null,
    "meta": {
      "one_allowed_collections": ["block_hero", "block_text", "block_gallery"],
      "one_collection_field": "collection",
      "junction_field": "page_id"
    }
  }
}

// Page relation
{
  "action": "create",
  "collection": "page_blocks",
  "field": "page_id",
  "data": {
    "collection": "page_blocks",
    "field": "page_id",
    "related_collection": "pages",
    "meta": {
      "one_field": "blocks",
      "junction_field": "item",
      "sort_field": "sort"
    },
    "schema": {"on_delete": "CASCADE"}
  }
}
```

</m2a_workflow>

<file_relationships>

### File/Files Relationships

**Single File (M2O)**:

1. **Add file field** → Use `fields` tool with `type: "uuid"`, `special: ["file"]`, and `interface: "file"`

2. **Create relation** (use `relations` tool):

```json
{
	"action": "create",
	"collection": "articles",
	"field": "cover_image",
	"data": {
		"collection": "articles",
		"field": "cover_image",
		"related_collection": "directus_files",
		"schema": { "on_delete": "SET NULL" }
	}
}
```

**Multiple Files (M2M)**:

**Complete Files Workflow**:

1. **Create junction collection** → Use `collections` tool to create junction with UUID primary key

2. **Add files field** to main collection → Use `fields` tool with `type: "alias"`, `special: ["files"]`, and
   `interface: "files"` (see `fields` tool `<relationship_fields>` Files example)

3. **Add junction fields** → Use `fields` tool to add hidden `article_id` and `directus_files_id` (both UUID) fields to
   junction

4. **Create relations** (use `relations` tool):

```json
// Article relation
{
  "action": "create",
  "collection": "article_images",
  "field": "article_id",
  "data": {
    "collection": "article_images",
    "field": "article_id",
    "related_collection": "articles",
    "meta": {
      "one_field": "images",
      "junction_field": "directus_files_id"
    },
    "schema": {"on_delete": "CASCADE"}
  }
}

// File relation
{
  "action": "create",
  "collection": "article_images",
  "field": "directus_files_id",
  "data": {
    "collection": "article_images",
    "field": "directus_files_id",
    "related_collection": "directus_files",
    "meta": {
      "junction_field": "article_id"
    },
    "schema": {"on_delete": "CASCADE"}
  }
}
```

</file_relationships>

<translations_workflow>

### Translations

Special M2M relationship with `languages` collection.

**Complete Translations Workflow**:

1. **Ensure languages collection exists** (use `schema` tool to check)

2. **Create translations junction** → Use `collections` tool to create junction with UUID primary key

3. **Add translations field** → Use `fields` tool with `type: "alias"`, `special: ["translations"]`, and
   `interface: "translations"` (see `fields` tool `<relationship_fields>` Translations example)

4. **Configure junction fields and relations** → Follow M2M pattern with languages collection </translations_workflow>
   </relationship_types>

<relation_settings>

## Relation Settings

### Schema Options

- `on_delete`:
  - `CASCADE` (default for M2M) - Delete related items
  - `SET NULL` (default for M2O) - Set field to null
  - `NO ACTION` - Prevent deletion
  - `RESTRICT` - Prevent if related items exist
  - `SET DEFAULT` - Set to default value

- `on_update`:
  - Same options as `on_delete`

### Meta Options

- `one_field`: Field name in related collection (for O2M side)
- `junction_field`: Opposite field in junction table
- `sort_field`: Enable manual sorting (typically an integer field)
- `one_deselect_action`: `nullify` or `delete`
- `one_allowed_collections`: Array of collection names for M2A
- `one_collection_field`: Field that stores collection name in M2A </relation_settings>

<common_patterns>

## Common Patterns

### Blog System

1. `articles` M2O `directus_users` (author)
2. `articles` M2M `tags`
3. `articles` M2O `directus_files` (cover_image)
4. `articles` M2M `directus_files` (gallery)
5. `articles` O2M `comments`
6. `comments` M2O `directus_users` (author)

### E-commerce

1. `products` M2M `categories`
2. `products` M2O `brands`
3. `products` O2M `reviews`
4. `products` M2M `directus_files` (gallery)
5. `orders` O2M `order_items`
6. `order_items` M2O `products`
7. `orders` M2O `directus_users` (customer)
8. `reviews` M2O `directus_users` (reviewer)

### Page Builder

- `pages` M2A `blocks` field (`page_blocks` junction collection)
- Collections: `block_hero`, `block_text`, `block_gallery` </common_patterns>

<naming_conventions>

## Naming Conventions

- Junction collections: `{singular}_{plural}` (e.g., `product_categories`)
- Junction fields: Singular form of related collection (e.g., `product_id`, `category_id`)
- Alias fields: Plural form for many relations (e.g., `tags`, `categories`)
- M2O fields: Singular form (e.g., `author`, `brand`) </naming_conventions>

<related_tools>

## Related Tools

- `collections`: Create collections and junctions first
- `fields`: Add relational fields before creating relations
- `schema`: View complete relationship structure </related_tools>
