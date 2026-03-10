Perform CRUD operations on items within Directus collections

## Actions

- `read`: Query items with filtering/pagination/field selection
- `create`: Add items with nested relations
- `update`: Modify items with partial data
- `delete`: Remove items by primary keys

## Essential Query Patterns

### Field Selection (Always Use)

```json
{ "fields": ["title", "status", "author.name", "categories.*"] }
```

For M2A relations: `"sections.item:headings.title", "sections.item:paragraphs.body"`

### Filtering Operators

Core: `_eq`, `_neq`, `_in`, `_nin`, `_null`, `_nnull`, `_lt`, `_lte`, `_gt`, `_gte`, `_between`, `_contains`,
`_icontains`, `_starts_with`, `_ends_with`, `_empty`, `_nempty` Relations: `_some`, `_none` (O2M only) Logic: `_and`,
`_or`

```json
{"status": {"_eq": "published"}}
{"title": {"_icontains": "keyword"}}
{"categories": {"_some": {"name": {"_eq": "News"}}}}
{"_or": [{"status": {"_eq": "published"}}, {"featured": {"_eq": true}}]}
```

### Deep Queries (Nested Relations)

```json
{
	"fields": ["title", "comments.text", "comments.author.name"],
	"deep": {
		"comments": {
			"_filter": { "status": { "_eq": "approved" } },
			"_sort": ["-date_created"],
			"_limit": 5
		}
	}
}
```

## Create/Update/Delete Best Practices

- ALWAYS show the item URL if it is present in the result for create or update

### Creating Items

- ALWAYS make sure you fully understand the collection's schema before trying to create items.

**✅ GOOD - Single with Relations:**

```json
{
	"action": "create",
	"collection": "posts",
	"data": [
		{
			"title": "New Post",
			"author": { "name": "John Doe", "email": "john@example.com" }, // Creates nested
			"categories": [1, 2, { "name": "New Category" }], // Mix existing + new
			"status": "draft"
		}
	]
}
```

**✅ GOOD - Batch Create:**

```json
{
	"action": "create",
	"collection": "posts",
	"data": [
		{ "title": "Post 1", "author_id": 1 },
		{ "title": "Post 2", "author_id": 2 }
	]
}
```

**❌ BAD - Missing Required Fields:**

```json
// Don't create without checking schema first
{ "title": "Post" } // Missing required fields like status
```

### Updating Items

**✅ GOOD - Update with Keys:**

```json
{
	"action": "update",
	"collection": "posts",
	"keys": ["uuid-1", "uuid-2"],
	"data": { "status": "published" }
}
```

**✅ GOOD - Batch Update (Different Data):**

```json
{
	"action": "update",
	"collection": "posts",
	"data": [
		{ "id": "uuid-1", "title": "Updated Title 1" },
		{ "id": "uuid-2", "title": "Updated Title 2" }
	]
}
```

**✅ GOOD - Relational Updates:**

```json
{
	"action": "update",
	"collection": "posts",
	"keys": ["uuid-1"],
	"data": {
		"categories": {
			"create": [{ "name": "New Category" }],
			"update": [{ "id": 3, "name": "Renamed" }],
			"delete": [5]
		}
	}
}
```

**❌ BAD - Update Without Keys:**

```json
// Don't update without specifying which items
{
	"action": "update",
	"data": [{ "status": "published" }] // Will fail - no keys provided
}
```

### Deleting Items

- ALWAYS get written confirmation with the user before deleting any items.

**✅ GOOD - Delete by Keys:**

```json
{
	"action": "delete",
	"collection": "posts",
	"keys": ["uuid-1", "uuid-2"]
}
```

**❌ BAD - Delete All (Dangerous):**

```json
// Never delete without keys - use query to get keys first
{
	"action": "delete",
	"collection": "posts" // Will fail - keys required
}
```

### Singleton Collections

**✅ GOOD - Singleton Read:**

```json
{
	"action": "read",
	"collection": "settings", // Singleton collection
	"query": { "fields": ["site_name", "logo"] }
}
```

**✅ GOOD - Singleton Update:**

```json
{
	"action": "update",
	"collection": "settings",
	"data": { "site_name": "New Name" } // No keys needed for singleton
}
```

## Advanced Relationship Patterns

### Many-to-One (M2O)

```json
// Create with nested author
{"title": "Article", "author": {"name": "New Author"}}
// Link existing author
{"title": "Article", "author": "existing-uuid"}
// Remove relation
{"author": null}
```

### One-to-Many (O2M)

```json
// Link to existing comments
{"comments": [1, 5, 9]}
// Create/update/delete operations
{
  "comments": {
    "create": [{"text": "New comment"}],
    "update": [{"id": 5, "text": "Updated"}],
    "delete": [1, 9]
  }
}
```

### Many-to-Any (M2A)

```json
{
	"sections": [
		{ "collection": "headings", "item": { "text": "Title", "level": 1 } },
		{ "collection": "paragraphs", "item": { "content": "Body text" } }
	]
}
```

### Translations

```json
// Create with multiple languages
{
  "title": "Main Title",
  "translations": [
    {"languages_code": "en-US", "title": "English Title", "content": "English content"},
    {"languages_code": "fr-FR", "title": "Titre Français", "content": "Contenu français"}
  ]
}

// Read specific language
{
  "fields": ["title", "translations.title", "translations.content"],
  "deep": {
    "translations": {
      "_filter": {"languages_code": {"_eq": "fr-FR"}}
    }
  }
}
```

## LLM Decision Rules

### Schema-First Pattern (Critical)

1. **Always call `schema()` first** to discover collections
2. **Examine specific schemas**: `schema(keys: ["collection"])` for field details based on users query
3. **Follow relation chains**: Check `relation.related_collections` in field definitions when it's relevant to your task
4. **IMPORTANT: Never guess field names** - Always use exact names from schema. If you're not 100% sure, ask the user

### Before Creating Items

1. **Check required fields** in schema
2. **Validate field types** match schema definitions
3. **Check for singleton collections** (`collection.singleton: true`)
4. **Verify relation targets exist** before linking. You can also create new relation items by nesting

### Before Updating Items

1. **Use keys parameter** for bulk updates with same data
2. **Use data array** for batch updates with different data per item
3. **Include primary key in data** when using batch update
4. **Check field permissions** - some fields may be read-only

### Before Deleting Items

1. **Always require explicit keys** - never delete by query alone
2. **Check for related data** that might be affected
3. **Validate cascade behavior** for relationships
4. **Consider soft delete** if collection has status field

### Performance & Safety

- **Use `fields`** to minimize payload size
- **Apply `limit`** for large result sets (default: no limit)
- **Batch operations** are transactional - all succeed or all fail
- **Primary keys returned** from create/update operations for chaining
- **Validation errors** are thrown before database operations

### Error Patterns to Avoid

- Creating without checking required fields through `scehma(keys: ["collection"])`
- Updating without keys or with invalid primary keys
- Deleting system collections (directus\_\*)
- Assuming field names without schema verification
- Missing foreign key references in relations
- Exceeding mutation limits in batch operations

### Singleton vs Regular Collections

**Regular Collections**: Require keys for update/delete, return arrays **Singleton Collections**: No keys needed, return
single objects, auto-upsert behavior

## Functions & Aggregation

Date: `year(field)`, `month(field)`, `day(field)`, `hour(field)` Aggregate: `count`, `sum`, `avg`, `min`, `max`

```json
{"filter": {"year(date_created)": {"_eq": 2024}}}
{"aggregate": {"count": ["*"], "sum": ["price"]}, "groupBy": ["category"]}
```

## Restrictions

- Cannot operate on `directus_*` collections
- Respects user permissions/RBAC
- Delete operations may be environment-disabled
