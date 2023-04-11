---
description: REST and GraphQL API documentation on the Utilities collection in Directus.
readTime: 3 min read
pageClass: page-reference
---

# Utilities

> Utilities are the various helper endpoints located within the API.

---

## Generate a Hash

Generate a hash for a given string.

### Request Body

`string` **Required**\
String to hash.

### Returns

Hashed string.

### REST API

```
POST /utils/hash/generate
```

##### Example

```json
// POST /utils/hash/generate

{
	"string": "Hello World!"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	utils_hash_generate(string: String!): String
}
```

##### Example

```graphql
mutation {
	utils_hash_generate(string: "Hello World!")
}
```

---

## Verify a Hash

Verify a string with a hash.

### Request Body

`string` **Required**\
Source string.

`hash` **Required**\
Hash you want to verify against.

### Returns

Boolean.

### REST API

```
POST /utils/hash/verify
```

##### Example

```json
// POST /utils/hash/verify

{
	"string": "Hello World!",
	"hash": "$arg...fEfM"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	utils_hash_verify(hash: String!, string: String!): Boolean
}
```

---

## Manually Sort Items in Collection

If a collection has a sort field, this util can be used to move items in that manual order.

### Request Body

`item` **Required**\
Primary key of the item you're moving in the collection.

`to` **Required**\
Primary key of the item you're moving the source item too.

### Returns

Empty body.

### REST API

```
POST /utils/sort/:collection
```

##### Example

```json
// POST /utils/sort/articles

{
	"item": 16,
	"to": 51
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	utils_sort(collection: String!, item: ID!, to: ID!): Boolean
}
```

##### Example

```graphql
mutation {
	utils_sort(collection: "articles", item: 16, to: 51)
}
```

---

## Import Data from File

Import multiple records from a JSON or CSV file into a collection. Relies on a `multipart/form-data` encoded request,
just like regular file uploads. Check [Upload a File](/reference/files#upload-a-file) for more information.

The import endpoint expects the file structure to match [the export query parameter](/reference/query#export). For JSON,
this is an array of objects, where every object is an item. For CSV, the first line has to be the columns header.

### Request Body

Send the file in a `multipart/form-data` request. See [Upload a File](/reference/files#upload-a-file) for more
information.

### Returns

Empty body.

### REST API

```
POST /utils/import/:collection
```

##### Example

```
POST /utils/import/articles

Content-Type: multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__
Content-Length: 3442422

--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="articles.csv"
Content-Type: text/csv

"id","title","another","created_by"
1,"My First Articled","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
2,"My Second Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
3,"My Updated Third Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
4,"My Fourth Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
5,"My Fifth Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
...
```

### GraphQL

n/a

---

## Export Data to a File

Export a larger data set to a file in the File Library

### Query Parameters

Doesn't use any query parameters.

### Request Body

`format` **Required**\
What file format to save the export to. One of `csv`, `json`, `xml`, `yaml`.

`query` **Required**\
The query object to use for the export. Supports the [global query parameters](/reference/query).

`file` **File Object**\
Partial file object to tweak where / how the export file is saved.

### Returns

Empty body

### REST API

```
POST /utils/export/:collection
```

##### Example

```
POST /utils/export/articles
```

```json
{
	"query": {
		"filter": {
			"status": {
				"_eq": "published"
			}
		}
	},
	"file": {
		"folder": "34e95c19-cc50-42f2-83c8-b97616ac2390"
	}
}
```

### GraphQL

n/a

---

## Clear the Internal Cache

Resets both the data and schema cache of Directus. This endpoint is only available to admin users.

### Request Body

n/a

### Returns

Empty body

### REST API

```
POST /utils/cache/clear
```

### GraphQL

```graphql
mutation {
	utils_cache_clear
}
```
