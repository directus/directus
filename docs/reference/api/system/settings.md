---
pageClass: page-reference
---

# Settings

<div class="two-up">
<div class="left">

> Settings are key-value pairs that are stored in the database, and control different aspects of the project. Only
> administrators have access to manage Settings.

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Settings Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the setting.

`project_name` **string**\
Name of the project, shown in the Admin App.

`project_url` **string**\
Link to the (public) website that goes with this project.

`project_color` **string**\
Brand color for the current project.

`project_logo` **many-to-one**\
Primary logo for the current project. Many-to-one to [files](/reference/api/system/files/).

`public_foreground` **many-to-one**\
Foreground image for the Admin App's public pages. Many-to-one to [files](/reference/api/system/files/).

`public_background` **many-to-one**\
Background image for the Admin App's public pages. Many-to-one to [files](/reference/api/system/files/).

`public_note` **string**\
Note shown on the Admin App's public pages. Supports Markdown.

`auth_login_attempts` **integer**\
How often a user is allowed to try to login. After which times the user will be suspended.

`auth_password_policy` **RegEx**\
What regex passwords must pass in order to be valid.

`storage_asset_transform` **string**\
If the transform endpoints are allowed to be used on [the assets endpoint](/reference/assets/). One of `all`, `none` or `presets`.

`storage_asset_presets` **array**\
What preset keys exist in [the assets endpoint](/reference/assets/).

</div>
</div>
<div class="right">

```json
{
	"data": {
		"id": 1,
		"project_name": "Directus",
		"project_url": null,
		"project_color": null,
		"project_logo": null,
		"public_foreground": null,
		"public_background": null,
		"public_note": null,
		"auth_login_attempts": 25,
		"auth_password_policy": null,
		"storage_asset_transform": "all",
		"storage_asset_presets": [
			{ "key": "small", "fit": "cover", "width": 200, "height": 161, "quality": 80, "withoutEnlargement": false }
		],
		"custom_css": null
	}
}
```

</div>
</div>

---

## Retrieve Settings

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the [settings object](#the-settings-object).

</div>
<div class="right">

### REST API

```
GET /settings
```

### GraphQL

```graphql
type Query {
	settings: directus_settings
}
```

##### Example

```graphql
query {
	settings {
		project_name
	}
}
```

</div>
</div>

---

## Update Settings

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [settings object](#the-settings-object).

### Returns

Returns the [settings object](#the-setting-object).

</div>
<div class="right">

### REST API

```
PATCH /settings
```

##### Example

```json
// PATCH /settings

{
	"project_url": "https://example.com/"
}
```

### GraphQL

```graphql
type Mutation {
	update_settings(data: update_directus_settings_input!): directus_settings
}
```

##### Example

```graphql
mutation {
	update_settings(data: { project_url: "https://example.com" }) {
		project_name
		project_url
	}
}
```

</div>
</div>
