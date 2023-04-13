---
description:
  This recipe explains how to construct a documentation content hierarchy by using Tree View, the M2O alias for creating
  recursive relationships.
tags: []
skill_level:
directus_version: 9.18.1
author_override:
author: Eron Powell
---

# Build a Content Hierarchy

> {{ $frontmatter.description }}

:::tip Author: {{$frontmatter.author}}

<!-- **Skill Level:** {{$frontmatter.skill_level}}\ -->

**Directus Version:** {{$frontmatter.directus_version}}

<!-- **Tags:** {{$frontmatter.tags.join(", ")}} -->

:::

## Explanation

<!--
See the VitePress docs to learn about its markdown options:
https://vitepress.vuejs.org/guide/markdown
-->

In documentation, it is incredibly common _(if not the standard)_ to have a hierarchy of content or data: _a parent
page, with child pages._

<!-- ![Parent Child Hierarchy](image.webp) -->

If you're working with markdown files or an SSG, content hierarchies are created easily with files and folders. If your
content is in a database, you can create a hierarchy of nested items with a recursive O2M relationship, which is the
focus of this recipe.

In Directus, there is a special O2M [alias field](/getting-started/glossary.html#alias) called Tree View, which makes it
easier to create and manage this type of recursive relationship.

For this recipe, we'll use Tree View to build a simple content hierarchy for documentation:

- `App Overview`
- `Configuration`
  - `Flows`
  - `Data Model`
    - `Collections`
    - `Fields`

Here's the general outline of what's to come:

- Use Tree View to create a recursive relationship in a collection called `docs`.
- Add `parent` <-> `child` items to the collection, using that recursive relationship.
- Give the public role read permissions on `docs` , so users can access them.

At the end, in [Final Tips](#final-tips), we'll point out some additional steps you can take to make your content
hierarchy easier to work with in a frontend.

## The Recipe

:::tip Requirements

You'll need to be familiar with [permissions](/configuration/users-roles-permissions.md).

:::

<!-- <video autoplay playsinline muted loop controls>
	<source src="" type="video/mp4" />
</video> -->

<!--
VIDEO IS OPTIONAL: delete if not needed
-->

1. [Create a collection](/configuration/data-model/collections.md#create-a-collection) and
   [add fields](/configuration/data-model/fields.md#create-a-field-standard) as follows:

```
docs
- id
- title (a STRING input field)
- parent_id (an integer input field)
- children (a Tree View O2M alias field, configured with docs.parent_id as the foreign key and the O2M Interface)
- body (optional: a text input field with a Markdown interface)
```

2. Configure the public role with
   [read permissions](/configuration/users-roles-permissions/permissions.md#configure-permissions) for the `docs`
   collection.

3. Create nested items on the `docs` collection as desired:

   - To create top-level parent items, [create an item](/app/content/items.md#create-an-item) as usual.
   - To add a nested child, [edit the parent item](/app/content/items.md#edit-an-item) and click **Create New** or **Add
     Existing**.

4. Optional: [manually sort items](/app/content/collections.md#manually-sort-items) into desired order.

## Final Tips

Now that your nested content is created, you'll need to access and use it in the frontend. Here are two key points to
consider.

### Fetch Nested Data

A basic api call to [get items](/reference/items.md), such as `/items/docs/`, returns flat data:

:::details Toggle open to view flat data.

```json
{
	"data": [
		{
			"id": 1,
			"title": "App Overview",
			"parent_id": null,
			"body": "# App Overview\n\nGeneral info about the app.",
			"sort": 1,
			"children": []
		},
		{
			"id": 2,
			"title": "Config Overview",
			"parent_id": null,
			"body": "# Config Overview\n\nThere are many config options available",
			"sort": 2,
			"children": [3]
		},
		{
			"id": 3,
			"title": "Data Model",
			"parent_id": 2,
			"body": "# How the Data Model Works\n\n",
			"sort": 3,
			"children": [4, 5]
		},
		{
			"id": 4,
			"title": "Fields",
			"parent_id": 3,
			"body": "# How Fields Work",
			"sort": 4,
			"children": []
		},
		{
			"id": 5,
			"title": "Collections",
			"parent_id": 3,
			"body": "# Collections\n\nThey're data tables.",
			"sort": 5,
			"children": []
		}
	]
}
```

:::

To fix this, you _could_ write an algorithm that iterates through each item in the data array and re-nests it on the
frontend. But that may be a bit resource intensive, depending on your collection's data. Alternatively, we can add
[query parameters](/reference/query.md) on the Directus API call to nest it for us. In this case, we could make an api
call like this:

```
/items/docs?
	filter[parent_id][_null]=true
	&fields=id,title,body,sort,
		children.id,children.body,children.title,children.sort,
			children.children.id,children.children.title,children.children.body,children.children.sort, children.children.children
```

Which will return data properly nested as seen here:

:::details Toggle open to view nested data

```json
{
	"data": [
		{
			"id": 1,
			"name": "App Overview",
			"body": "# App Overview\n\nGeneral info about the app.",
			"sort": 1,
			"nest": []
		},
		{
			"id": 2,
			"name": "Config Overview",
			"body": "# Config Overview\n\nMany config options available",
			"sort": 2,
			"nest": [
				{
					"id": 3,
					"body": "# How the Data Model Works",
					"name": "Data Model",
					"sort": 3,
					"nest": [
						{
							"id": 4,
							"name": "Fields",
							"body": "# How Fields Work",
							"sort": 4,
							"nest": []
						},
						{
							"id": 5,
							"name": "Collections",
							"body": "# Collections\n\nThey're data tables.",
							"sort": 5,
							"nest": []
						}
					]
				}
			]
		}
	]
}
```

:::

In the call above, the `filter[parent_id][_null]=true` query parameter serves to [filter](/reference/query.md#filter)
non-parents at the first level. The [fields](/reference/query.md#fields) query parameters let us extract specific
fields, including nested relational fields. There are two key things to note with this type of query:

- _We knew our content hierarchy was three levels deep._ You'll also need to be aware of _(and account for)_ the depth
  of your content hierarchy and make the api call accordingly.
- The `parent_id` foreign key field was not added, as it would re-nest parent item data under its own child items, which
  is duplicate and useless.

### Create Relative Paths

Nested content by itself is nice, but it would be helpful if we could create a path for each item, for routing in
frontend navigation. To do this, you could use [flows](/configuration/flows.md) to create a path dynamically. Here's one
general approach:

- Add a `path` field to the `docs` collection and configure it so edits are turned off on the item detail page.
- [Configure a flow](/configuration/flows.md#configure-a-flow) with an `Event Hook` trigger, which runs on
  `items.create` and `items.update` for the `docs` collection.
- Add operations to the flow to read the parent's path of the item being created or updated, append the item's title,
  write the new path into the present item's `path` field value, then update the paths of its children _(if it has any
  children)_.

:::tip

In this recipe, for the sake of a clean visual example, we created a `body` field directly on the `docs` collection.
However, you may find it more user-friendly to keep the markdown content in another relationally-linked collection, then
just use Tree View to store the path and/or keep track of the content hierarchy.

:::
