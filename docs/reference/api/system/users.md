---
pageClass: page-reference
---

# Users

<div class="two-up">
<div class="left">

> Directus Users are the individual accounts that let you authenticate into the API and App. Each user belongs to a Role
> which defines its granular Permissions. [Learn more about Users](/concepts/users/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The User Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the user.

`first_name` **string**\
First name of the user.

`last_name` **string**\
Last name of the user.

`email` **string**\
Email address of the user.

`password` **hash**\
Password of the user.

`location` **string**\
Location of the user.

`title` **string**\
Title of the user.

`description` **string**\
Description of the user.

`tags` **csv**\
Tags for the user.

`avatar` **many-to-one**\
Avatar file. Many-to-one to [files](/reference/api/rest/files/).

`language` **string**\
Language the Admin App is rendered in. See [our Crowdin page](https://locales.directus.io) for all available languages and
translations.

`theme` **string**\
One of `auto`, `light`, `dark`.

`tfa_secret` **string**\
When TFA is enabled, this holds the

</div>
</div>
<div class="right">

```json
{
	"id": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07",
	"first_name": "Admin",
	"last_name": "User",
	"email": "admin@example.com",
	"password": "**********",
	"location": "New York City",
	"title": "CTO",
	"description": null,
	"tags": null,
	"avatar": null,
	"language": "en-US",
	"theme": "auto",
	"tfa_secret": null,
	"status": "active",
	"role": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"token": null,
	"last_access": "2021-02-05T10:18:13-05:00",
	"last_page": "/settings/roles/653925a9-970e-487a-bfc0-ab6c96affcdc"
}
```

</div>
</div>

---

## List Users

List all users that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [user objects](#the-user-object). If no items are available, data
will be an empty array.

</div>
<div class="right">

```
GET /users
```

```json
// Response

{
	"data": [
		{
			"id": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07",
			"first_name": "Admin",
			"last_name": "User",
			"email": "admin@example.com",
			"password": "**********",
			"location": "New York City",
			"title": "CTO",
			"description": null,
			"tags": null,
			"avatar": null,
			"language": "en-US",
			"theme": "auto",
			"tfa_secret": null,
			"status": "active",
			"role": "653925a9-970e-487a-bfc0-ab6c96affcdc",
			"token": null,
			"last_access": "2021-02-05T10:18:13-05:00",
			"last_page": "/settings/roles/653925a9-970e-487a-bfc0-ab6c96affcdc"
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve a User

List an existing user by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [user object](#the-user-object).

</div>
<div class="right">

```
GET /users/:id
```

```json
// Response

{
	"data": {
		"id": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07",
		"first_name": "Admin",
		"last_name": "User",
		"email": "admin@example.com",
		"password": "**********",
		"location": "New York City",
		"title": "CTO",
		"description": null,
		"tags": null,
		"avatar": null,
		"language": "en-US",
		"theme": "auto",
		"tfa_secret": null,
		"status": "active",
		"role": "653925a9-970e-487a-bfc0-ab6c96affcdc",
		"token": null,
		"last_access": "2021-02-05T10:18:13-05:00",
		"last_page": "/settings/roles/653925a9-970e-487a-bfc0-ab6c96affcdc"
	}
}
```

</div>
</div>

---

## Retrieve the Current User

Retrieve the currently authenticated user.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the [user object](#the-user-object) for the currently authenticated user.

</div>
<div class="right">

```
GET /users/me
```

```json
// Response

{
	"data": {
		"id": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07",
		"first_name": "Admin",
		"last_name": "User",
		"email": "admin@example.com",
		"password": "**********",
		"location": "New York City",
		"title": "CTO",
		"description": null,
		"tags": null,
		"avatar": null,
		"language": "en-US",
		"theme": "auto",
		"tfa_secret": null,
		"status": "active",
		"role": "653925a9-970e-487a-bfc0-ab6c96affcdc",
		"token": null,
		"last_access": "2021-02-05T10:18:13-05:00",
		"last_page": "/settings/roles/653925a9-970e-487a-bfc0-ab6c96affcdc"
	}
}
```

</div>
</div>

---

## Create a User

Create one or more new user(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [user object](#the-user-object) or an array of partial [user objects](#the-user-object).

`email` and `password` are required.

### Returns

Returns the [user object(s)](#the-user-object) for the created user(s).

</div>
<div class="right">

```
POST /users
```

```json
// Request

{
	"email": "another@example.com",
	"password": "d1r3ctu5",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"
}
```

```json
// Response

{
	"data": {
		"id": "b917be29-e326-4597-ad73-ff892be35aac",
		"first_name": null,
		"last_name": null,
		"email": "another@example.com",
		"password": "**********",
		"location": null,
		"title": null,
		"description": null,
		"tags": null,
		"avatar": null,
		"language": "en-US",
		"theme": "auto",
		"tfa_secret": null,
		"status": "active",
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"token": null,
		"last_access": null,
		"last_page": null
	}
}
```

</div>
</div>

---

## Update a User

Update an existing user.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [user object](#the-user-object).

### Returns

Returns the [user object](#the-user-object) for the created user.

</div>
<div class="right">

```
PATCH /users/:id
```

```json
// Request

{
	"title": "CTO"
}
```

```json
// Response

{
	"data": {
		"id": "b917be29-e326-4597-ad73-ff892be35aac",
		"first_name": null,
		"last_name": null,
		"email": "another@example.com",
		"password": "**********",
		"location": null,
		"title": "CTO",
		"description": null,
		"tags": null,
		"avatar": null,
		"language": "en-US",
		"theme": "auto",
		"tfa_secret": null,
		"status": "active",
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"token": null,
		"last_access": null,
		"last_page": null
	}
}
```

</div>
</div>

---

## Delete a User

Delete an existing user.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /users/:id
```

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple Users

Delete multiple existing users.

<div class="two-up">
<div class="left">

### Request Body

An array of user primary keys

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /users
```

```json
// Request
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

```json
// Empty Response
```

</div>
</div>

---

## Invite a new User

Invite a new user by email.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`email` **Required**\
User email to invite.

`role` **Required**\
Role of the new user.

`invite_url`\
Provide a custom invite url which the link in the email will lead to. The invite token will be passed as a parameter.\
**Note**: You need to configure the
[`USER_INVITE_URL_ALLOW_LIST` environment variable](/reference/environment-variables/#security) to enable this feature.

</div>

### Returns

Empty body.

</div>
<div class="right">

```
POST /users/invite
```

```json
// Request

{
	"email": "another@example.com",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"
}
```

```json
// Empty Response
```

</div>
</div>

---

## Accept User Invite

Accept your invite. The [invite user endpoint](#invite-a-new-user) sends the email a link to the Admin App.

This link includes a token, which is then used to activate the invited user.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`token` **Required**\
Accept invite token.

`password` **Required**\
Password for the user.

</div>

### Returns

Empty body.

</div>
<div class="right">

```
POST /users/invite/accept
```

```json
// Request

{
	"token": "eyJh...KmUk",
	"password": "d1r3ctu5"
}
```

```json
// Empty Response
```

</div>
</div>

---

## Enable Two-Factor Authentication

Generates a secret and returns the URL to be used in an authenticator app.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`password` **Required**\
The user's password.

</div>

### Returns

<div class="definitions">

`secret` **string**\
OTP secret to be saved in the authenticator app.

`otpauth_url` **string**\
`otpauth://` formatted URL. Can be rendered as QR code and used in most authenticator apps.

</div>

</div>
<div class="right">

```
POST /users/me/tfa/enable
```

```json
// Request
{
	"password": "d1r3ctu5"
}
```

```json
// Response

{
	"data": {
		"secret": "PUITSOZFEEPXABIG",
		"otpauth_url": "otpauth://totp/Directus:null%20null?secret=PUITSOZFEEPXABIG&period=30&digits=6&algorithm=SHA1&issuer=Directus"
	}
}
```

</div>
</div>

---

## Disable Two-Factor Authentication

Disables two-factor authentication by removing the OTP secret from the user.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`otp` **Required**\
One-time password generated by the authenticator app.

</div>

### Returns

Empty response.

</div>
<div class="right">

```
POST /users/me/tfa/disable
```

```json
// Request
{
	"otp": "859014"
}
```

```json
// Empty Response
```

</div>
</div>
