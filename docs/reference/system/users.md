---
pageClass: page-reference
---

# Users

<div class="two-up">
<div class="left">

> Directus Users are the individual accounts that let you authenticate into the API and App. Each user belongs to a Role
> which defines its granular Permissions. [Learn more about Users](/getting-started/glossary/#users/).

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
Avatar file. Many-to-one to [files](/reference/files/).

`language` **string**\
Language the Admin App is rendered in. See [our Crowdin page](https://locales.directus.io) for all available languages and
translations.

`theme` **string**\
One of `auto`, `light`, `dark`.

`tfa_secret` **string**\
When TFA is enabled, this holds the secret key for it.

`status` **string**\
Status of the user. One of `draft`, `invited`, `active`, `suspended`, `archived`.

`role` **uuid**\
Role of the user. Many-to-one to [roles](/reference/roles).

`token` **string**\
Static access token for the user.

`last_access` **date**\
Last time the user accessed the API.

`last_page` **string**\
Last page in the app the user used.

`provider` **string**\
What auth provider was used to register this user.

`external_identifier` **string**\
Primary key of the user in the third party authentication provider, if used.

`auth_data` **json**\
Required data about the user as provided by the third party auth provider, if used.

`email_notifications` **boolean**\
When this is enabled, the user will receive emails for notifications.

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

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query/#limit) [user objects](#the-user-object). If no items are available, data
will be an empty array.

</div>
<div class="right">

### REST API

```
GET /users
SEARCH /users
```

[Learn more about SEARCH ->](/reference/introduction/#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	users: [directus_users]
}
```

##### Example

```graphql
query {
	users {
		first_name
		last_name
		email
	}
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

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [user object](#the-user-object).

</div>
<div class="right">

### REST API

```
GET /users/:id
```

##### Example

```
GET /users/72a1ce24-4748-47de-a05f-ce9af3033727
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	users_by_id(id: ID!): directus_users
}
```

##### Example

```graphql
query {
	users_by_id(id: "72a1ce24-4748-47de-a05f-ce9af3033727") {
		first_name
		last_name
		email
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

Supports all [global query parameters](/reference/query).

### Returns

Returns the [user object](#the-user-object) for the currently authenticated user.

</div>
<div class="right">

### REST API

```
GET /users/me
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	users_me: directus_users
}
```

##### Example

```graphql
query {
	users_me {
		email
	}
}
```

</div>
</div>

---

## Update the Current User

Update the authenticated user.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the updated [user object](#the-user-object) for the authenticated user.

</div>
<div class="right">

### REST API

```
PATCH /users/me
```

```json
// PATCH /users/me

{
	"email": "new.email@example.com"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_users_me(data: update_directus_users_input!): directus_users
}
```

##### Example

```graphql
mutation {
	update_users_me(data: { email: "new.email@example.com" }) {
		email
	}
}
```

</div>
</div>

---

## Create a User

Create a new user

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [user object](#the-user-object).

`email` and `password` are required.

### Returns

Returns the [user object](#the-user-object) for the created user.

</div>
<div class="right">

### REST API

```
POST /users
```

##### Example

```json
// POST /users

{
	"email": "another@example.com",
	"password": "d1r3ctu5",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_users_item(data: create_directus_users_input!): directus_users
}
```

##### Example

```graphql
mutation {
	create_users_item(
		data: { email: "another@example.com", password: "d1r3ctu5", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7" }
	) {
		email
		role
	}
}
```

</div>
</div>

---

## Create Multiple Users

Create multiple new users

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [user objects](#the-user-object).

`email` and `password` are required.

### Returns

Returns the [user objects](#the-user-object) for the created users.

</div>
<div class="right">

### REST API

```
POST /users
```

##### Example

```json
// POST /users

[
	{
		"email": "admin@example.com",
		"password": "p455w0rd",
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"
	},
	{
		"email": "another@example.com",
		"password": "d1r3ctu5",
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"
	}
]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_users_items(data: [create_directus_users_input!]!): [directus_users]
}
```

##### Example

```graphql
mutation {
	create_users_items(
		data: [
			{ email: "admin@example.com", password: "p455w0rd", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7" }
			{ email: "another@example.com", password: "d1r3ctu5", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7" }
		]
	) {
		email
		role
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

Supports all [global query parameters](/reference/query).

### Request Body

A partial [user object](#the-user-object).

### Returns

Returns the [user object](#the-user-object) for the updated user.

</div>
<div class="right">

### REST API

```
PATCH /users/:id
```

##### Example

```json
// PATCH /users/72a1ce24-4748-47de-a05f-ce9af3033727

{
	"title": "CTO"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_users_item(id: ID!, data: update_directus_users_input!): directus_users
}
```

##### Example

```graphql
mutation {
	update_users_item(id: "72a1ce24-4748-47de-a05f-ce9af3033727", data: { title: "CTO" }) {
		first_name
		last_name
	}
}
```

</div>
</div>

---

## Update Multiple Users

Update multiple existing users.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

<div class="definitions">

`keys` **Required**\
Array of primary keys of the users you'd like to update.

`data` **Required**\
Any of [the user object](#the-user-object)'s properties.

</div>

### Returns

Returns the [user objects](#the-user-object) for the updated users.

</div>
<div class="right">

### REST API

```
PATCH /users
```

##### Example

```json
// PATCH /users

{
	"keys": ["72a1ce24-4748-47de-a05f-ce9af3033727", "9c3d75a8-7a5f-41a4-be0a-1488fd974511"],
	"data": {
		"title": "CTO"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_users_items(ids: [ID!]!, data: update_directus_users_input!): [directus_users]
}
```

##### Example

```graphql
mutation {
	update_users_items(
		ids: ["72a1ce24-4748-47de-a05f-ce9af3033727", "9c3d75a8-7a5f-41a4-be0a-1488fd974511"]
		data: { title: "CTO" }
	) {
		first_name
		last_name
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

### REST API

```
DELETE /users/:id
```

##### Example

```
DELETE /users/72a1ce24-4748-47de-a05f-ce9af3033727
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_users_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_users_item(id: "72a1ce24-4748-47de-a05f-ce9af3033727") {
		id
	}
}
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

### REST API

```
DELETE /users
```

##### Example

```json
// Request
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_users_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_users_items(ids: ["72a1ce24-4748-47de-a05f-ce9af3033727", "9c3d75a8-7a5f-41a4-be0a-1488fd974511"]) {
		ids
	}
}
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
[`USER_INVITE_URL_ALLOW_LIST` environment variable](/self-hosted/config-options/#security) to enable this feature.

</div>

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
POST /users/invite
```

##### Example

```json
// POST /users/invite

{
	"email": "another@example.com",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	users_invite(email: String!, role: String!, invite_url: String): Boolean
}
```

##### Example

```graphql
mutation {
	users_invite(email: "another@example.com", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7")
}
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

### REST API

```
POST /users/invite/accept
```

##### Example

```json
// POST /users/invite/accept

{
	"token": "eyJh...KmUk",
	"password": "d1r3ctu5"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	users_invite_accept(token: String!, password: String!): Boolean
}
```

##### Example

```graphql
mutation {
	users_invite_accept(token: "eyJh...KmUk", password: "d1r3ctu5")
}
```

</div>
</div>

---

## Generate Two-Factor Authentication Secret

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

### REST API

```
POST /users/me/tfa/generate
```

##### Example

```json
// POST /users/me/tfa/generate
{
	"password": "d1r3ctu5"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	users_me_tfa_generate(password: String!): users_me_tfa_generate_data
}
```

##### Example

```graphql
mutation {
	users_me_tfa_generate(password: "d1r3ctu5") {
		secret
		otpauth_url
	}
}
```

</div>
</div>

---

## Enable Two-Factor Authentication

Adds a TFA secret to the user account.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`secret` **Required**\
The TFA secret from tfa/generate.

`otp` **Required**\
OTP generated with the secret, to recheck if the user has a correct TFA setup

</div>

### Returns

<div class="definitions">

Empty response.

</div>

</div>
<div class="right">

### REST API

```
POST /users/me/tfa/enable
```

##### Example

```json
// POST /users/me/tfa/enable
{
	"otp": "123456",
	"secret": "3CtiutsNBmY3szHE"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	users_me_tfa_enable(otp: String!, secret: String!): Boolean
}
```

##### Example

```graphql
mutation {
	users_me_tfa_enable(otp: "123456", secret: "3CtiutsNBmY3szHE")
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

### REST API

```
POST /users/me/tfa/disable
```

##### Example

```json
// POST /users/me/tfa/disable

{
	"otp": "859014"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	users_me_tfa_disable(otp: String!): Boolean
}
```

##### Example

```graphql
mutation {
	users_me_tfa_disable(otp: "591763")
}
```

</div>
</div>
