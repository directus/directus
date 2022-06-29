---
pageClass: page-reference
---

# Global Query Parameters

<div class="two-up">
<div class="left">

> Most Directus API Endpoint operations can be manipulated with the following parameters. It is important to understand
> them to get the most out of the platform.

</div>
<div class="right"><p></p>
<div class="table-of-contents">

- [Fields](#fields)
- [Filter](#filter)
- [Search](#search)
- [Sort](#sort)
- [Limit](#limit)
- [Offset](#offset) / [Page](#page)
- [Aggregation & Grouping](#aggregation-grouping)
- [Deep](#deep)
- [Aliases](#aliases)
- [Export](#export)
<p></p>
- [Functions](#functions)
<p></p>
- [Metadata](#metadata)
  - [Total Count](#total-count)
  - [Filter Count](#filter-count)

</div>
</div>
</div>

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

::: tip Performance & Size

While the fields wildcard is very useful for debugging purposes, we recommend only requesting _specific_ fields for
production use. By only requesting the fields you really need, you can speed up the request, and reduce the overall
output size.

:::

Get all top-level fields and second-level relational fields within images\
`*,images.*`

Get only the first_name and last_name fields\
`first_name,last_name`

Get all top-level and second-level relational fields, and third-level fields within images.thumbnails\
`*.*,images.thumbnails.*`

### Many-To-Any (Union Types)

Seeing that Many-to-Any (m2a) fields have nested data from multiple collections, it's not always safe / wanted to fetch
the same field from every related collection. In m2a fields, you can use the following syntax to specify what fields to
fetch from which related nested collection type:\
`?fields=<m2a-field>:<collection-scope>.<field>`.

Lets say we have a collection `pages` with a many-to-any field called `sections` that points to `headings`,
`paragraphs`, and `videos`. We only want to fetch `title` and `level` from `headings`, `body` from `paragraphs` and
`source` from `videos`. We can achieve that by using:

```
sections.item:headings.title
sections.item:headings.level
sections.item:paragraphs.body
sections.item:videos.source
```

In GraphQL, this can be achieved using Union Types.

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

_Natively supported in GraphQL_

</div>
</div>

---

## Filter

<div class="two-up">
<div class="left">

Used to search items in a collection that matches the filter's conditions. The filter param follows
[the Filter Rules spec](/reference/filter-rules), which includes additional information on logical operators (AND/OR),
nested relational filtering, and dynamic variables.

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

Retrieve all items that are published between two dates

```json
{
	"date_published": {
		"_between": ["2021-01-24", "2021-02-23"]
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
	users(filter: { first_name: { _eq: "Rijk" } }) {
		id
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
	articles(search: "Directus") {
		id
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
	articles(sort: ["sort", "-date_created"]) {
		id
	}
}
```

</div>
</div>

---

## Limit

<div class="two-up">
<div class="left">

Set the maximum number of items that will be returned. The default limit is set to `100`.

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Get the first 200 items\
`200`

Get all items\
`-1`

::: warning All Items

Depending on the size of your collection, fetching unlimited data may result in degraded performance or timeouts, use
with caution.

:::

</div>
<div class="right">

### REST API

```
?limit=200
```

### GraphQL

```graphql
query {
	articles(limit: 200) {
		id
	}
}
```

</div>
</div>

---

## Offset

<div class="two-up">
<div class="left">

Skip the first `n` items in the response. Can be used for pagination.

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Get items 101—200\
`100`

</div>
<div class="right">

### REST API

```
?offset=100
```

### GraphQL

```graphql
query {
	articles(offset: 100) {
		id
	}
}
```

</div>
</div>

---

## Page

<div class="two-up">
<div class="left">

An alternative to `offset`. Page is a way to set `offset` under the hood by calculating `limit * page`. Page is
1-indexed.

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Get items 1-100\
`1`

Get items 101-200\
`2`

</div>
<div class="right">

### REST API

```
?page=2
```

### GraphQL

```graphql
query {
	articles(page: 2) {
		id
	}
}
```

</div>
</div>

---

## Aggregation & Grouping

<div class="two-up">
<div class="left">

Aggregate functions allow you to perform calculations on a set of values, returning a single result.

</div>
</div>

<div class="two-up">
<div class="left">

The following aggregation functions are available in Directus:

| Name            | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `count`         | Counts how many items there are                               |
| `countDistinct` | Counts how many unique items there are                        |
| `sum`           | Adds together the values in the given field                   |
| `sumDistinct`   | Adds together the unique values in the given field            |
| `avg`           | Get the average value of the given field                      |
| `avgDistinct`   | Get the average value of the unique values in the given field |
| `min`           | Return the lowest value in the field                          |
| `max`           | Return the highest value in the field                         |
| `countAll`      | Equivalent to `?aggregate[count]=*` (GraphQL only)            |

### Grouping

By default, the above aggregation functions run on the whole dataset. To allow for more flexible reporting, you can
combine the above aggregation with grouping. Grouping allows for running the aggregation functions based on a shared
value. This allows for things like _"Average rating per month"_ or _"Total sales of items in the jeans category"_.

The `groupBy` query allows for grouping on multiple fields simultaneously. Combined with the [Functions](#functions),
this allows for aggregate reporting per year-month-date.

</div>
<div class="right">

### REST API

```
?aggregate[avg]=cost
&groupBy[]=author
&groupBy[]=year(publish_date)
```

### GraphQL

```graphql
query {
	articles_aggregated(groupBy: ["author", "year(publish_date)"]) {
		group
		sum {
			revenue
		}
	}
}
```

</div>
</div>

---

## Deep

<div class="two-up">
<div class="left">

Deep allows you to set any of the other query parameters on a nested relational dataset.

</div>
</div>

<div class="two-up">
<div class="left">

### Examples

Limit the nested related articles to 3

```json
{
	"related_articles": {
		"_limit": 3
	}
}
```

Only get 3 related articles, with only the top rated comment nested

```json
{
	"related_articles": {
		"_limit": 3,
		"comments": {
			"_sort": "rating",
			"_limit": 1
		}
	}
}
```

</div>
<div class="right">

### REST API

```
?deep[translations][_filter][languages_code][_eq]=en-US

// or

?deep={ "translations": { "_filter": { "languages_code": { "_eq": "en-US" }}}}
```

### GraphQL

_Natively supported in GraphQL:_

```graphql
query {
	members {
		favorite_games(filter: { name: { _eq: "Mariokart 8" } }) {
			id
			featured_image {
				filename_disk
			}
		}
	}
}
```

</div>
</div>

---

## Aliases

<div class="two-up">
<div class="left">

Aliases allow you rename fields on the fly, and request the same nested data set multiple times using different filters.

</div>
</div>
<div class="two-up">
<div class="left">

::: warning Nested fields

It is only possible to alias same level fields.\
Alias for nested fields, f.e. `field.nested`, will not work.

:::

</div>

<div class="right">

### REST API

```
?alias[all_translations]=translations
&alias[dutch_translations]=translations
&deep[dutch_translations][_filter][code][_eq]=nl-NL
```

### GraphQL

_Natively supported in GraphQL:_

```graphql
query {
	articles {
		dutch_translations: translations(filter: { code: { _eq: "nl-NL" } }) {
			id
		}

		all_translations: translations {
			id
		}
	}
}
```

</div>
</div>

---

## Export

Save the current API response to a file.

<div class="two-up">
<div class="left">

Saves the API response to a file. Accepts one of `json`, `csv`, `xml`.

</div>
<div class="right">

### REST API

```
?export=json
?export=csv
?export=xml
```

### GraphQL

n/a

</div>
</div>

---

## Functions

<div class="two-up">
<div class="left">

Functions allow for "live" modification of values stored in a field. Functions can be used in any query parameter you'd
normally supply a field key, including fields, aggregation, and filter.

</div>
</div>

<div class="two-up">
<div class="left">

Functions can be used by wrapping the field key in a JavaScript like syntax, for example:

`timestamp` -> `year(timestamp)`

### DateTime Functions

| Filter    | Description                                              |
| --------- | -------------------------------------------------------- |
| `year`    | Extract the year from a datetime/date/timestamp field    |
| `month`   | Extract the month from a datetime/date/timestamp field   |
| `week`    | Extract the week from a datetime/date/timestamp field    |
| `day`     | Extract the day from a datetime/date/timestamp field     |
| `weekday` | Extract the weekday from a datetime/date/timestamp field |
| `hour`    | Extract the hour from a datetime/date/timestamp field    |
| `minute`  | Extract the minute from a datetime/date/timestamp field  |
| `second`  | Extract the second from a datetime/date/timestamp field  |

### Array Functions

| Filter  | Description                                                       |
| ------- | ----------------------------------------------------------------- |
| `count` | Extract the number of items from a JSON array or relational field |

::: warning GraphQL

Names aren't allowed to include any special characters in GraphQL, preventing the `()` syntax from being used.

As an alternative, the above functions can be used by appending `_func` at the end of the field name, and using the
function name as the nested field (see the example that follows).

:::

</div>
<div class="right">

### REST API

```
?fields=id,title,weekday(date_published)
&filter[year(date_published)][_eq]=2021
```

### GraphQL

```graphql
query {
	articles(filter: { date_published_func: { year: { _eq: 2021 } } }) {
		id
		title
		date_published_func {
			weekday
		}
	}
}
```

</div>
</div>

---

## Metadata

<div class="two-up">
<div class="left">

Metadata allows you to retrieve some additional information about the items in the collection you're fetching. `*` can
be used as a wildcard to retrieve all metadata.

</div>
</div>

<div class="two-up">
<div class="left">

### Total Count

Returns the total item count of the collection you're querying.

### Filter Count

Returns the item count of the collection you're querying, taking the current filter/search parameters into account.

</div>
<div class="right">

### REST API

```
?meta=total_count

?meta=filter_count

?meta=*
```

### GraphQL

n/a

</div>
</div>
