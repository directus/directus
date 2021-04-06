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

```
POST /utils/hash/generate
```

```json
// Request

{
	"string": "Hello World!"
}
```

```json
// Response

{
	"data": "$arg...fEfM"
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

```
POST /utils/hash/verify
```

```json
// Request

{
	"string": "Hello World!",
	"hash": "$arg...fEfM"
}
```

```json
// Response

{
	"data": true
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

```
POST /utils/sort/:collection
```

```json
// Request

{
	"item": 16,
	"to": 51
}
```

```json
// Empty Response
```

</div>
</div>

---
