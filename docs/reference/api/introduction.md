# API Reference

> Directus offers both a RESTful and GraphQL API to manage the data in the database. The API has predictable
> resource-oriented URLs, relies on standard HTTP status codes, and uses JSON for input and output.

::: tip Dynamic I/O

Since most endpoints return data based on your specific schema and configured permissions, the input/output of the API
differs greatly for individual installations.

:::

[[toc]]

## REST vs. GraphQL

**There is no difference in the functionality available between the REST and GraphQL endpoints.** The functionality
available in both is mapped to same set of core services, meaning that you don't lose any performance or capabilities by
choosing one or the other.

Which one you choose is ultimately up to you.

## Authentication

By default, all data in the system is off limits for unauthenticated users. To gain access to protected data, you must
[include an access token with every request](/reference/api/authentication/), or
[configure permissions for the public role](/concepts/roles/#public-role).

Useful references:

- [Authenticating into the API](/reference/api/authentication/)
- [Login endpoint reference](/reference/api/system/authentication/)

## Relational Data

Directus only retrieves the fields in your items that explicitly have been requested. Relational data can be retrieved
nested by using the [the `fields` parameter](/reference/api/query/#fields) in REST, or regular nested queries in
GraphQL. This allows you to retrieve the author of your article included in the articles data, or fetch related log
entry points for your app's analytics data for example.

### Creating / Updating / Deleting

Similarly to fetching, relational content can be modified deeply as well.

#### Many-to-One

Many-to-One relationships are fairly straightforward to manage relationally. You can simply submit the changes you want
as an object under the relational key in your collection. For example, if you wanted to create a new featured article on
your page, you could submit:

```json
{
	"featured_article": {
		"title": "This is my new article!"
	}
}
```

This will create a new record in the related collection, and save its primary key in the `featured_article` field for
this item. To update an existing item, simply provide the primary key with the updates, and Directus will treat it as an
update instead of a creation:

```json
{
	"featured_article": {
		"id": 15,
		"title": "This is an updated title for my article!"
	}
}
```

Seeing that the Many-to-One relationship stores the foreign key on the field itself, removing the item can be done by
nullifying the field:

```json
{
	"featured_article": null
}
```

#### One-to-Many (/ Many-to-Many)

One-to-Many, and therefore Many-to-Many and Many-to-Any, relationships can be updated in one of two ways:

**Basic**

The API will return one-to-many fields as an array of nested keys or items (based on the `fields` parameter). You can
use this same structure to select what the related items are:

```json
{
	"children": [2, 7, 149]
}
```

You can also provide an object instead of a primary key in order to create new items nested on the fly, or an object
with a primary key included to update an existing item:

```json
{
	"children": [
		2, // assign existing item 2 to be a child of the current item
		{
			"name": "A new nested item"
		},
		{
			"id": 149,
			"name": "Assign and update existing item 149"
		}
	]
}
```

To remove items from this relationship, simply omit them from the array:

```json
{
	"children": [2, 149]
}
```

This method of updating a one-to-many is very useful for smaller relational datasets.

**"Detailed"**

Alternatively, you can provide an object detailing the changes as follows:

```json
{
	"children": {
		"create": [{ "name": "A new nested item" }],
		"update": [{ "id": 149, "name": "A new nested item" }],
		"delete": [7]
	}
}
```

This is useful if you need to have more tightly control on staged changes, or when you're working with a big relational
dataset.

::: warning Deleting Relational Data

Directus won't _delete_ relational data from the database. Instead, relational "deletions" will nullify the related
foreign key. This means that your data will never suddenly disappear, but it also means that you might end up with
orphaned items.

:::

#### Many-to-Any (Union Types)

Many-to-Any fields work very similar to a "regular" many-to-many, with the exception that the related field can pull in
the fields from any of the related collections, for example:

```json
{
	"sections": [
		{
			"collection": "headings",
			"item": {
				/* headings fields */
			}
		},
		{
			"collection": "paragraphs",
			"item": {
				/* paragraphs fields */
			}
		}
	]
}
```

##### REST API

To scope the fields that are returned per collection type, you can use the `<field>:<scope>` syntax in the fields
parameter as follows:

```
GET /items/pages
	?fields[]=sections.item:headings.id
	&fields[]=sections.item:headings.title
	&fields[]=sections.item:paragraphs.body
	&fields[]=sections.item:paragraphs.background_color
```

##### GraphQL

In GraphQL, you can use nested fragments on the Union Type to select the fields:

```graphql
query {
	pages {
		sections {
			item {
				... on headings {
					id
					title
				}

				... on paragraphs {
					body
					background_color
				}
			}
		}
	}
}
```

::: tip Updating

Updating records in a many-to-any is identical to the other relationship types.

:::

## SEARCH HTTP Method

When using the REST API to read multiple items by (very) advanced filters, you might run into the issue where the URL
simply can't hold enough data to include the full query structure. In those cases, you can use the SEARCH http method as
a drop-in replacement for GET, where you're allowed to put the query into the request body as follows:

**Before:**

```
GET /items/articles?filter[title][_eq]=Hello World
```

**After:**

```json
SEARCH /items/articles

{
	"query": {
		"filter": {
			"title": {
				"_eq": "Hello World"
			}
		}
	}
}
```

There's a lot of discussion around whether or not to put a body in a GET request, to use POSTs to create search queries,
or to rely on a different method altogether. As of right now, we've chosen
[to align with IETF's _HTTP SEARCH Method_ specification](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/).
While we recognize this is still a draft spec, the SEARCH method has been used extensively before in the WebDAV world
([spec](https://tools.ietf.org/html/rfc5323)), and compared to the other available options, it feels like the "cleanest"
and most correct to handle this moving forward. As with everything else, if you have any ideas, opinions, or concerns,
[we'd love to hear your thoughts](http://github.com/directus/directus/discussions/new).

Useful reading:

- [_HTTP SEARCH Method_ (IETF, 2021)](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/)
- [_Defining a new HTTP method: HTTP SEARCH_ (Tim Perry, 2021)](https://httptoolkit.tech/blog/http-search-method/)
- [_HTTP GET with request body_ (StackOverflow, 2009 and ongoing)](https://stackoverflow.com/questions/978061/http-get-with-request-body)
- [_Elastic Search GET body usage_ (elastic, n.d.)](https://www.elastic.co/guide/en/elasticsearch/guide/current/_empty_search.html)
- [_Dropbox starts using POST, and why this is poor API design._ (Evert Pot, 2015)](https://evertpot.com/dropbox-post-api/)
