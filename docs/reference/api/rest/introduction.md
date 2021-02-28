---
pageClass: page-reference
---

# REST API

<div class="two-up">
<div class="left">

> The Directus dynamic REST API includes a comprehensive set of endpoints that covers every feature of the platform.
> Along with the GraphQL API, it is the primary way to interact with the content of your database.

::: tip API Authentication

To access any of these REST API endpoints, you'll first need to [authenticate](/reference/api/authentication/) or
request data that has been set to [public](/guides/permissions/#configuring-public-permissions).

:::

::: tip Items Endpoint

Chances are you're looking for how to interact with **Items**, the atomic content unit within Directus. If so, please
jump ahead to the [Items Endpoint](/reference/api/rest/items/) section of the API Reference.

:::

</div>
<div class="right">

- [Activity](/reference/api/rest/activity/)
- [Authentication](/reference/api/rest/authentication/)
- [Collections](/reference/api/rest/collections/)
- [Extensions](/reference/api/rest/extensions/)
- [Fields](/reference/api/rest/fields/)
- [Files](/reference/api/rest/files/)
- [Folders](/reference/api/rest/folders/)
- [Items](/reference/api/rest/items/)
- [Permissions](/reference/api/rest/permissions/)
- [Presets](/reference/api/rest/presets/)
- [Relations](/reference/api/rest/relations/)
- [Revisions](/reference/api/rest/revisions/)
- [Roles](/reference/api/rest/roles/)
- [Server](/reference/api/rest/server/)
- [Settings](/reference/api/rest/settings/)
- [Users](/reference/api/rest/users/)
- [Utilities](/reference/api/rest/utilities/)
- [Webhooks](/reference/api/rest/webhooks/)

</div>
</div>

---

## Relational Data

<div class="two-up">
<div class="left">

### Fetching

By default, Directus only retrieves the "root level" of an item. Relational data can be nested by using
[the `fields` parameter](/reference/api/query/#fields).

You can use a wildcard (_) to fetch all items in a given level, use _.\* to fetch everything on the next relational
level, and so on, to any depth required.

::: tip Performance & Size

While the fields wildcard is very useful for debugging purposes, we recommend only requesting _specific_ fields for
production use. By only requesting the fields you really need, you can drastically speed up the request, and reduce the
overall output size.

:::

### Creating / Updating / Deleting

##### Many-to-One

Many-to-One relationships are fairly straightforward to manage relationally. You can simply submit the changes you want
as an object under the relational key in your collection. For example, if you wanted to create a new featured article on
your page, you could submit:

```json
PATCH /items/pages/about

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
PATCH /items/pages/about

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
PATCH /items/pages/about

{
	"featured_article": null
}
```

##### One-to-Many (/ Many-to-Many / Many-to-Any)

One-to-Many, and therefore Many-to-Many and Many-to-Any, relationships can be updated in one of two ways:

**Basic**

The API will return one-to-many fields as an array of nested keys or items (based on the `fields` parameter). You can
use this same structure to select what the related items are:

```json
PATCH /items/menu_items

{
	"children": [2, 7, 149]
}
```

You can also provide an object instead of a primary key in order to create new items nested on the fly, or an object
with a primary key included to update an existing item:

```json
PATCH /items/menu_items

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
PATCH /items/menu_items

{
	"children": [2, 149]
}
```

This method of updating a one-to-many is very useful for smaller relational datasets.

**"Detailed"**

Alternatively, you can provide an object detailing the changes as follows:

```json
PATCH /items/menu_items

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

Directus won't _delete_ relational data from the database. Instead, relational deletions will nullify the related
foreign key. This means that your data will never suddenly disappear, but it also means that you might end up with
orphaned items.

:::

</div>
<div class="right">

```json
GET /items/articles/1

{
	"id": 1,
	"status": "published",
	"title": "Hello, world!",
	"body": "This is my first article",
	"author": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"
}
```

```json
GET /items/articles/1?fields=*,author.first_name

{
	"id": 1,
	"status": "published",
	"title": "Hello, world!",
	"body": "This is my first article",
	"author": {
		"first_name": "Rijk"
	}
}
```

</div>
</div>
