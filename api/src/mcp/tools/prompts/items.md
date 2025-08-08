Perform Create, Read, Update, Delete, and Upsert operations on items in any Directus collection. This tool provides full
access to collection data with support for advanced filtering, relational queries, sorting, pagination, and efficient
batch operations.

### ⚙️ Available Actions

- read: Fetch items with flexible filtering, pagination, and field selection
- create: Add new items to a collection
- update: Modify existing items (requires `id`)
- delete: Remove items by `id`
- upsert: Create or update based on primary key presence

### 📘 Usage Patterns

#### 🔍 READ

- Use the `fields` parameter to specify exactly which fields to return
- Use dot notation for relational fields (e.g., ['title', 'author.name', 'category.slug'])
- Apply `filter` to target specific items and reduce data transfer
- Use `limit` and `offset` for pagination
- Sort using `sort`, e.g., ['date_created', '-title']

#### 🧪 Common Filter Examples

```json
//
{ "status": { "_eq": "published" } }

//
{ "status": { "_in": ["published", "draft"] } }

//
{ "title": { "_icontains": "welcome" } }

//
{ "price": { "_gte": 10, "_lte": 100 } }

//
{ "date_created": { "_gte": "2024-01-01" } }

//
{ "featured_image": { "_nnull": true } }

//
{ "author.status": { "_eq": "active" } }

//
{ "_or": [{ "status": { "_eq": "published" } }, { "featured": { "_eq": true } }] }

//
{ "_and": [{ "status": { "_eq": "published" } }, { "date_created": { "_gte": "2024-01-01" } }] }

//
{ "_and": [{ "status": { "_eq": "published" } }, { "_or": [{ "featured": { "_eq": true } }] }] }
```

#### ✏️ CREATE

- Provide complete item data using the `data` or `item` parameter
- Use `fields` to specify what should be returned
- Returns the created item with ID

#### 🔁 UPDATE

- Requires both `id` and `data`
- Supports partial updates
- Use `fields` to control the response\n\n

#### ❌ DELETE

- Requires only the `id`
- This is destructive — use with caution

#### 🔄 UPSERT

- Provide full item via `data` or `item`
- If primary key exists, performs update; otherwise, inserts new
- Ideal for import/sync scenarios

### ⚡ Performance Tips

- Always use `fields` to reduce payload size
- Apply `filter` to limit results
- Prefer targeted queries over broad fetches
