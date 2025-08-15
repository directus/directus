Perform CRUD operations on relations

### 📘 Creating Relations

After creating relational fields (fields with type uuid), define the relationship:

```json
{
	"action": "create",
	"data": {
		"collection": "organizations",
		"field": "assigned_to",
		"related_collection": "directus_users",
		"meta": { "sort_field": null },
		"schema": { "on_delete": "SET NULL" }
	}
}
```

#### Relation Types:

**Many-to-One (M2O)**: Field with special: ["m2o"], type: "uuid" **One-to-Many (O2M)**: Field with special: ["o2m"]
**Many-to-Many (M2M)**: Requires junction collection **Many-to-Any (M2A)**: Polymorphic relationships with special:
["m2a"] **Files**: Field with special: ["file"] for single, ["files"] for multiple

#### Many-to-Any (M2A) Relationships

M2A relationships allow a field to reference items from multiple different collections:

```json
{
	"action": "create",
	"data": {
		"collection": "comments",
		"field": "item",
		"type": "json",
		"meta": {
			"interface": "list-m2a",
			"special": ["m2a"],
			"options": {
				"template": "{{collection}} - {{item.title || item.name}}"
			}
		}
	}
}
```

Then create the M2A relation:

```json
{
	"action": "create",
	"data": {
		"collection": "comments",
		"field": "item",
		"meta": {
			"one_field": "item",
			"one_collection_field": "collection",
			"one_allowed_collections": ["articles", "products", "events"]
		}
	}
}
```
