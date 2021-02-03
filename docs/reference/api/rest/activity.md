---
pageClass: page-reference
---

# Activity

<div class="two-up">
<div class="left">

All events that happen within Directus are tracked and stored in the activities collection. This gives you full
accountability over everything that happens.

</div>
<div class="right">

- [GET /activity](#list-activity-actions)

</div>
</div>

---

## The Activity Object

<div class="two-up">
<div class="left">
<div class="definitions">

`action` **string**\
Action that was performed.

`collection` **string**\
Collection identifier in which the item resides.

`comment` **string**\
User comment. This will store the comments that show up in the right sidebar of the item edit page in the admin app.

`id` **integer**\
Unique identifier for the object.

`ip` **string**\
The IP address of the user at the time the action took place.

`item` **string**\
Unique identifier for the item the action applied to. This is always a string, even for integer primary keys.

`timestamp` **string**\
When the action happened.

`user` **many-to-one**\
The user who performed this action. Many-to-one to [users](/reference/api/rest/users/#the-users-object).

`user_agent` **string**\
User agent string of the browser the user used when the action took place.

`revisions` **one-to-many**\
Any changes that were made in this activity. One-to-many to [revisions](/reference/api/rest/revisions/#the-revisions-object).

</div>
</div>
<div class="right">

```json
{
	"action": "create",
	"collection": "articles",
	"comment": null,
	"id": 5,
	"ip": "139.178.128.0",
	"item": "1",
	"timestamp": "2021-02-02T12:50:26-05:00",
	"user": "2d321940-69f5-445f-be6b-c773fa58a820",
	"user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15",
	"revisions": [4]
}
```

</div>
</div>

---

## List Activity Actions

Returns a list of activity actions.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all global query parameters.

</div>
<div class="right">

```json
{}
```

</div>
</div>
