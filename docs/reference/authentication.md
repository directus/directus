---
description: API documentation on authentication in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Authentication

> All data within the platform is private by default. The
> [public role](/user-guide/user-management/users-roles-permissions#configure-permissions) can be configured to expose
> data without authentication, or you can pass an access token to the API to access private data.

## Access Tokens

There are two types of tokens that can be used to authenticate within Directus.

**Temporary Token (JWT)** are returned by the [login](#login) endpoint/mutation. These tokens have a relatively short
expiration time, and are thus the most secure option to use. The tokens are returned with a `refresh_token` that can be
used to retrieve a new access token via the [refresh](#refresh) endpoint/mutation.

**Static Tokens** can be set for each platform user, and never expire. They are less secure, but quite useful for
server-to-server communication. They are saved as plain-text within `directus_users.token`. Static Tokens are created in
user settings inside of the Directus Data Studio User Module, or by updating the user's `token` value via API.

Once you have your access token, there are two ways to pass it to the API, via the `access_token` query parameter, or in
the request's Authorization Header.

### Query Parameter

```
?access_token=<token>
```

### Authorization Header

```
Authorization: Bearer <token>
```

## Login

Retrieve a temporary access token and refresh token.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/login`

`POST /auth/login/:provider`

```json
{
	"email": user_email,
	"password": user_password
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_login(email: "user_email", password: "user_password") {
		access_token
		refresh_token
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, authentication, rest, login } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(authentication()).with(rest());

// login using the authentication composable
const result = await client.login(email, password);

// login http request
const result = await client.request(login(email, password));
```

</template>
</SnippetToggler>

#### Request Body

`email` **Required**\
Email address of the user you're retrieving the access token for.

`password` **Required**\
Password of the user.

`otp`\
The user's one-time-password (if MFA is enabled).

`mode`\
Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` `secure` cookie. One of `json`, `cookie`.
Defaults to `json`.

### Response

`access_token` **string**\
Temporary access token to be used in follow-up requests.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.

::: tip Expiry time

The token's expiration time can be configured through
[the `ACCESS_TOKEN_TTL` environment variable](/self-hosted/config-options#general).

:::

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/login`

`POST /auth/login/:provider`

```json
{
	"email": "admin@example.com",
	"password": "d1r3ctu5"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_login(email: "admin@example.com", password: "d1r3ctu5") {
		access_token
		refresh_token
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, authentication, rest, login } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(authentication()).with(rest());

// login using the authentication composable
const result = await client.login('admin@example.com', 'd1r3ctu5');

// login http request
const result = await client.request(login('admin@example.com', 'd1r3ctu5'));
```

</template>
</SnippetToggler>

## Refresh

Retrieve a new access token using a refresh token.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/refresh`

```json
{
	"refresh_token": refresh_token_string,
	"mode": refresh_mode
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_refresh(refresh_token: "abc...def", mode: json) {
		access_token
		refresh_token
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, authentication, rest, refresh } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(authentication()).with(rest());

// refresh using the authentication composable
const result = await client.refresh();

// refresh http request using a cookie
const result = await client.request(refresh('cookie'));

// refresh http request using json
const result = await client.request(refresh('json', refresh_token));
```

</template>
</SnippetToggler>

#### Request Body

`refresh_token`\
The refresh token to use. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have to submit
it here.

`mode`\
Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` `secure` cookie. One of `json`, `cookie`.

### Response

`access_token` **string**\
Temporary access token to be used in follow-up requests.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/refresh`

```json
{
	"refresh_token": "gmPd...8wuB",
	"mode": "json"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_refresh(refresh_token: "abc...def", mode: json) {
		access_token
		refresh_token
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, authentication, rest, refresh } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(authentication()).with(rest());

// refresh using the authentication composable
const result = await client.refresh();

// refresh http request using a cookie
const result = await client.request(refresh('cookie'));

// refresh http request using json
const result = await client.request(refresh('json', 'gmPd...8wuB'));
```

</template>
</SnippetToggler>

## Logout

Invalidate the refresh token thus destroying the user's session.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/logout`

```json
{
	"refresh_token": refresh_token
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_logout(refresh_token: "refresh_token")
}
```

</template>
<template #sdk>

```js
import { createDirectus, authentication, rest, logout } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(authentication()).with(rest());

// logout using the authentication composable
const result = await client.logout();

// logout http request
const result = await client.request(logout(refresh_token));
```

</template>
</SnippetToggler>

#### Request Body

`refresh_token`\
The refresh token to invalidate. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have
to submit it here.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/logout`

```json
{
	"refresh_token": "gmPd...8wuB"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_logout(refresh_token: "gmPd...8wuB")
}
```

</template>
<template #sdk>

```js
import { createDirectus, authentication, rest, logout } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(authentication()).with(rest());

// logout using the authentication composable
const result = await client.logout();

// logout http request
const result = await client.request(logout('gmPd...8wuB'));
```

</template>
</SnippetToggler>

## Request Password Reset

Request a password reset email to be sent to the given user.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/password/request`

```json
{
	"email": user_email
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_password_request(email: "user_email")
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, passwordRequest } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(passwordRequest(user_email));
```

</template>
</SnippetToggler>

#### Request Body

`email` **Required**\
Email address of the user you're requesting a password reset for.

`reset_url`\
Provide a custom reset url which the link in the email will lead to. The reset token will be passed as a parameter.\
**Note**: You need to configure the
[`PASSWORD_RESET_URL_ALLOW_LIST` environment variable](/self-hosted/config-options#security) to enable this feature.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/password/request`

```json
{
	"email": "admin@example.com"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_password_request(email: "admin@example.com")
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, passwordRequest } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(passwordRequest('admin@example.com'));
```

</template>
</SnippetToggler>

## Reset a Password

The request a password reset endpoint sends an email with a link to the admin app (or a custom route) which in turn uses
this endpoint to allow the user to reset their password.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/password/reset`

```json
{
	"token": password_reset_token,
	"password": password
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_password_reset(token: "password_reset_token", password: "password")
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, passwordReset } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(passwordReset(reset_token, new_password));
```

</template>
</SnippetToggler>

#### Request Body

`token` **Required**\
Password reset token, as provided in the email sent by the request endpoint.

`password` **Required**\
New password for the user.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /auth/password/reset`

```json
{
	"token": "eyJh...KmUk",
	"password": "d1r3ctu5"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	auth_password_reset(token: "eyJh...KmUk", password: "d1r3ctu5")
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, passwordReset } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(passwordReset('reset_token', 'new_password'));
```

</template>
</SnippetToggler>

## List Auth Providers

List all the configured auth providers.

::: tip Configuring auth providers

To learn more about setting up auth providers, see
[Configuring auth providers](/self-hosted/config-options#authentication).

:::

### Request

<SnippetToggler :choices="['REST', 'SDK']" group="api">
<template #rest>

`GET /auth`

</template>
<template #sdk>

```js
import { createDirectus, rest, readProviders } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readProviders());
```

</template>
</SnippetToggler>

### Response

```json
{
	"data": [
		{
			"name": "GitHub",
			"driver": "oauth2",
			"icon": "github"
		},
		{
			"name": "Google",
			"driver": "openid",
			"icon": "google"
		},
		{
			"name": "Okta",
			"driver": "openid"
		}
	],
	"disableDefault": false
}
```

`data` **Array**\
Array of configured auth providers.

`disableDefault` **boolean**\
Whether or not the default authentication provider is disabled.

### Example

<SnippetToggler :choices="['REST', 'SDK']" group="api">
<template #rest>

`GET /auth`

</template>
<template #sdk>

```js
import { createDirectus, rest, readProviders } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readProviders());
```

</template>
</SnippetToggler>

## Login Using SSO Providers

Will redirect to the configured SSO provider for the user to login.

### Request

```
GET /auth/login/:provider
```
