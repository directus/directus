---
description: REST and GraphQL API documentation to run queries in Directus.
readTime: 9 min read
pageClass: page-reference
---

# Global Query Parameters

> Most Directus API Endpoint operations can be manipulated with the following parameters. It is important to understand
> them to get the most out of the platform.

## Fields

Choose the fields that are returned in the current dataset. This parameter supports dot notation to request nested
relational fields. You can also use a wildcard (\*) to include all fields at a specific depth.

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

Seeing that Many-to-Any (M2A) fields have nested data from multiple collections, it's not always safe / wanted to fetch
the same field from every related collection. In M2A fields, you can use the following syntax to specify what fields to
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
GET /items/articles
	?fields[]=title
	&fields[]=sections.item:headings.title
	&fields[]=sections.item:headings.level
	&fields[]=sections.item:paragraphs.body
	&fields[]=sections.item:videos.source
```

</template>
<template #graphql>

```graphql
# Using native GraphQL Union types

query {
	articles {
		sections {
			item {
				... on headings {
					title
					level
				}

				... on paragraphs {
					body
				}

				... on videos {
					source
				}
			}
		}
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: [
			'title',
			{
				sections: [
					{
						item: {
							headings: ['title', 'level'],
							paragraphs: ['body'],
							videos: ['source'],
						}
					}
				]
			}
		],
	})
);
```

</template>
</SnippetToggler>

## Filter

Used to search items in a collection that matches the filter's conditions. The filter param follows
[the Filter Rules spec](/reference/filter-rules), which includes additional information on logical operators (AND/OR),
nested relational filtering, and dynamic variables.

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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?filter[first_name][_eq]=Rijk

// or

?filter={ "first_name": { "_eq": "Rijk" }}
```

</template>
<template #graphql>

```graphql
query {
	users(filter: { first_name: { _eq: "Rijk" } }) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		filter: {
			status: {
				_eq: 'draft',
			},
		},
	})
);
```

</template>
</SnippetToggler>

::: tip Filtering M2A fields

Because attribute names in GraphQL cannot contain the `:` character, you will need to replace it with a double
underscore. For example, instead of using `sections.item:heading` in your filter, you will need to use
`sections.item__heading` (see the full example below).

```graphql
query {
	articles(
		filter: {
			sections: {
				item__headings: {
					# Instead of: item:headings
					title: { _eq: "Section 1" }
				}
			}
		}
	) {
		id
	}
}
```

:::

## Search

The search parameter allows you to perform a search on textual and numeric type fields within a collection. It's an easy
way to search for an item without creating complex field filters – though it is far less optimized. It only searches the
root item's fields, related item fields are not included.

### Example

Find all items that mention Directus\
`Directus`

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`?search=Directus`

</template>
<template #graphql>

```graphql
query {
	articles(search: "Directus") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		search: 'foobar',
	})
);
```

</template>
</SnippetToggler>

## Sort

What field(s) to sort by. Sorting defaults to ascending, but a minus sign (`-`) can be used to reverse this to
descending order. Fields are prioritized by the order in the parameter. The dot-notation has to be used when sorting
with values of nested fields.

### Examples

Sort by creation date descending\
`-date_created`

Sort by a "sort" field, followed by publish date descending\
`sort,-publish_date`

Sort by a "sort" field, followed by a nested author's name\
`sort,-author.name`

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?sort=sort,-date_created,author.name

// or

?sort[]=sort
&sort[]=-date_created
&sort[]=-author.name
```

</template>
<template #graphql>

```graphql
query {
	articles(sort: ["sort", "-date_created", "author.name"]) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		sort: ['sort', '-date_created'], //Sort by sort field and creation date descending
	})
);
```

</template>
</SnippetToggler>

## Limit

Set the maximum number of items that will be returned. The default limit is set to `100`.

### Examples

Get the first 200 items\
`200`

Get the maximum allowed number of items\
`-1`

::: warning Maximum Items

Depending on the size of your collection, fetching the maximum amount of items may result in degraded performance or
timeouts, use with caution.

The maximum amount of items that can be requested on the API can be configured using the
[`QUERY_LIMIT_MAX` variable](/self-hosted/config-options.html#general).

:::

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`?limit=200`

</template>
<template #graphql>

```graphql
query {
	articles(limit: 200) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		limit: 3,
	})
);
```

</template>
</SnippetToggler>

## Offset

Skip the first `n` items in the response. Can be used for pagination.

### Examples

Get items 101—200\
`100`

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`?offset=100`

</template>
<template #graphql>

```graphql
query {
	articles(offset: 100) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		offset: 5,
	})
);
```

</template>
</SnippetToggler>

## Page

An alternative to `offset`. Page is a way to set `offset` under the hood by calculating `limit * page`. Page is
1-indexed.

### Examples

Get items 1-100\
`1`

Get items 101-200\
`2`

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`?page=2`

</template>
<template #graphql>

```graphql
query {
	articles(page: 2) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		page: 1,
	})
);
```

</template>
</SnippetToggler>

## Aggregation & Grouping

Aggregate functions allow you to perform calculations on a set of values, returning a single result.

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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?aggregate[count]=*
```

</template>
<template #graphql>

```graphql
query {
	articles_aggregated {
		countAll
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, aggregate } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	aggregate('articles', {
		aggregate: { count: '*' },
	})
);
```

</template>
</SnippetToggler>

### Grouping

By default, the above aggregation functions run on the whole dataset. To allow for more flexible reporting, you can
combine the above aggregation with grouping. Grouping allows for running the aggregation functions based on a shared
value. This allows for things like _"Average rating per month"_ or _"Total sales of items in the jeans category"_.

The `groupBy` query allows for grouping on multiple fields simultaneously. Combined with the [Functions](#functions),
this allows for aggregate reporting per year-month-date.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?aggregate[count]=views,comments
&groupBy[]=author
&groupBy[]=year(publish_date)
```

</template>
<template #graphql>

```graphql
query {
	articles_aggregated(groupBy: ["author", "year(publish_date)"]) {
		group
		count {
			views
			comments
		}
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, aggregate } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	aggregate('articles', {
		aggregate: {
			count: ['views', 'comments']
		},
		groupBy: ['authors', 'year(publish_date)'],
	})
);
```

</template>
</SnippetToggler>

## Deep

Deep allows you to set any of the other query parameters on a nested relational dataset.

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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?deep[translations][_filter][languages_code][_eq]=en-US

// or

?deep={ "translations": { "_filter": { "languages_code": { "_eq": "en-US" }}}}
```

</template>
<template #graphql>

` // Natively supported in GraphQL`

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

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		deep: {
			translations: {
				_filter: {
					languages_code: {
						_eq: 'en-US',
					},
				}
			},
		},
	})
);
```

</template>
</SnippetToggler>

## Aliases

Aliases allow you rename fields on the fly, and request the same nested data set multiple times using different filters.

::: warning Nested fields

It is only possible to alias same level fields.\
Alias for nested fields, f.e. `field.nested`, will not work.

:::

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?alias[all_translations]=translations
&alias[dutch_translations]=translations
&deep[dutch_translations][_filter][code][_eq]=nl-NL
```

</template>
<template #graphql>

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

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(staticToken()).with(rest());

const result = await client.request(
	readItems('articles', {
		alias: {
			all_translations: 'translations',
			dutch_translations: 'translations',
		},
		deep: {
			dutch_translations: {
				_filter: {
					code: {
						_eq: 'nl-NL',
					},
				},
			},
		},
	})
);
```

</template>
</SnippetToggler>

## Export

Save the current API response to a file.

Saves the API response to a file. Accepts one of `csv`, `json`, `xml`, `yaml`.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?export=csv
?export=json
?export=xml
?export=yaml
```

</template>
<template #graphql>

`// Not Applicable`

</template>
<template #sdk>

```js
// Not Applicable
```

</template>
</SnippetToggler>

## Functions

Functions allow for "live" modification of values stored in a field. Functions can be used in any query parameter you'd
normally supply a field key, including fields, aggregation, and filter.

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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?fields=id,title,weekday(date_published)
&filter[year(date_published)][_eq]=2021
```

</template>
<template #graphql>

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

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: ['month(date_created)'],
	})
);
```

</template>
</SnippetToggler>

## Metadata

Metadata allows you to retrieve some additional information about the items in the collection you're fetching. `*` can
be used as a wildcard to retrieve all metadata.

::: warning DEPRECATED

The `metadata` parameter will be removed in the future in favor of [Aggregation](#aggregation-grouping). To receive the
previous `total_count` and `filter_count` values, please use the `aggregation[count]` parameter instead - either with or
without an additional `filter` parameter respectively.

:::

### Total Count

Returns the total item count of the collection you're querying.

### Filter Count

Returns the item count of the collection you're querying, taking the current filter/search parameters into account.

::: warning GraphQL

GraphQL does not have meta fields like the REST API.  
As an alternative, you can retrieve the count using Aggregation.

For more details, see: [Aggregation & Grouping](#aggregation-grouping)

:::

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
?meta=total_count

?meta=filter_count

?meta=*
```

</template>
<template #graphql>

```graphql
query {
	articles_aggregated {
		count {
			id
		}
	}
}
```

</template>
<template #sdk>

```js
// Not applicable, use aggregate()
```

</template>
</SnippetToggler>
