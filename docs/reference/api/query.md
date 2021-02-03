---
pageClass: page-reference
---

# Global Query Parameters

Most operations within Directus can be manipulated with the following parameters:

- [Fields](#fields)
- [Filter](#filter)
- [Search](#search)
- [Sort](#sort)
- [Limit](#limit)
- [Offset](#offset)
- [Deep](#deep)
- [Meta](#meta)
  - [Total Count](#total-count)
  - [Filter Count](#filter-count)

---

## Fields

<div class="two-up">
<div class="left">

Choose the fields that are returned in the current dataset. This parameter supports dot notation to request nested
relational fields. You can also use a wildcard (\*) to include all fields at a specific depth.

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Get all top-level fields\
`*`

Get all top-level fields and all second-level relational fields\
`*.*`

Get all top-level fields and second-level relational fields within images\
`*,images.*`

Get only the first_name and last_name fields\
`first_name,last_name`

Get all top-level and second-level relational fields, and third-level fields within images.thumbnails\
`*.*,images.thumbnails.*`

</div>
<div class="right">

### REST API

```
?fields=title,body,featured_image.*

// or

?fields[]=title
&fields[]=body
&fields[]=featured_image.*
```

### GraphQL

n/a

</div>
</div>

---

## Filter

<div class="two-up">
<div class="left">

Used to search items in a collection that matches the filter's conditions. The filter param follows
[the Filter Rules spec](/reference/filter-rules/).

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Retrieve all items where `first_name` equals "Rijk"

```json
{
	"first_name": {
		"_eq": "Rijk"
	}
}
```

Retrieve all items in one of the following categories: "vegetables", "fruit"

```json
{
	"categories": {
		"_in": ["vegetables", "fruit"]
	}
}
```

Retrieve all items where the author's "vip" flag is true

```json
{
	"author": {
		"vip": {
			"_eq": true
		}
	}
}
```

::: tip Nested Filters

The above example will filter the _top level_ items based on a condition _in_ the related item. If you're looking to
filter the related items themselves, take a look at [the `deep` parameter](#deep)!

:::

</div>
<div class="right">

### REST API

```
?filter[first_name][_eq]=Rijk

// or

?filter={ "first_name": { "_eq": "Rijk" }}
```

### GraphQL

```graphql
query {
	items {
		users(filter: { first_name: { _eq: "Rijk" } }) {
			id
		}
	}
}
```

</div>
</div>

---

## Search

<div class="two-up">
<div class="left">

The search parameter allows you to perform a search on all string and text type fields within a collection. It's an easy
way to search for an item without creating complex field filters – though it is far less optimized. It only searches the
root item's fields, related item fields are not included.

</div>
</div>

<div class="two-up">
<div class="left">

### Example

Find all items that mention Directus\
`Directus`

</div>
<div class="right">

### REST API

```
?search=Directus
```

### GraphQL

```graphql
query {
	items {
		articles(search: "Directus") {
			id
		}
	}
}
```

</div>
</div>

---

## Sort

<div class="two-up">
<div class="left">

What field(s) to sort by. Sorting defaults to ascending, but a minus sign (`-`) can be used to reverse this to
descending order. Fields are prioritized by the order in the parameter.

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Sort by creation date descending\
`-date_created`

Sort by a "sort" field, followed by publish date descending\
`sort, -publish_date`

</div>
<div class="right">

### REST API

```
?sort=sort,-date_created

// or

?sort[]=sort
&sort[]=-date_created
```

### GraphQL

```graphql
query {
	items {
		articles(sort: ["sort", "-date_created"]) {
			id
		}
	}
}
```

</div>
</div>
