---
pageClass: page-reference
---

# Utilities

<div class="two-up">
<div class="left">

> Utilities are the various helper endpoints located within the API.

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## Generate a Hash

Generate a hash for a given string.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`string` **Required**\
String to hash.

</div>

### Returns

Hashed string.

</div>
<div class="right">

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

</div>
</div>

---

## Verify a Hash

Verify a string with a hash.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`string` **Required**\
Source string.

`hash` **Required**\
Hash you want to verify against.

</div>

### Returns

Boolean.

</div>
<div class="right">

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

```graphql
type Mutation {
	utils_hash_verify(hash: String!, string: String!): Boolean
}
```

</div>
</div>

---

## Manually Sort Items in Collection

If a collection has a sort field, this util can be used to move items in that manual order.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`item` **Required**\
Primary key of the item you're moving in the collection.

`to` **Required**\
Primary key of the item you're moving the source item too.

</div>

### Returns

Empty body.

</div>
<div class="right">

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

</div>
</div>

---
