---
description: API documentation on authentication in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Authentication

> All data within the platform is private by default. The
> [public role](/app/users-roles-permissions#configure-permissions) can be configured to expose data without
> authentication, or you can pass an access token to the API to access private data.

---

## Access Tokens

There are two types of tokens that can be used to authenticate within Directus.

**Temporary Token (JWT)** are returned by the [login](#login) endpoint/mutation. These tokens have a relatively short
expiration time, and are thus the most secure option to use. The tokens are returned with a `refresh_token` that can be
used to retrieve a new access token via the [refresh](#refresh) endpoint/mutation.

**Static Tokens** can be set for each platform user, and never expire. They are less secure, but quite useful for
server-to-server communication. They are saved as plain-text within `directus_users.token`.

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

---

## Login

Retrieve a temporary access token and refresh token.

### Request Body

`email` **Required**\
Email address of the user you're retrieving the access token for.

`password` **Required**\
Password of the user.

`otp`\
The user's one-time-password (if MFA is enabled).

`mode`\
Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` `secure` cookie. One of `json`, `cookie`.
Defaults to `json`.

### Response Attributes

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

### REST API

```
POST /auth/login
```

```
POST /auth/login/:provider
```

```json
{
	"email": "admin@example.com",
	"password": "d1r3ctu5"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
mutation {
	auth_login(email: "admin@example.com", password: "d1r3ctu5") {
		access_token
		refresh_token
	}
}
```

---

## Refresh

Retrieve a new access token using a refresh token.

### Request Body

`refresh_token`\
The refresh token to use. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have to submit
it here.

`mode`\
Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` `secure` cookie. One of `json`, `cookie`.

### Response Attributes

`access_token` **string**\
Temporary access token to be used in follow-up requests.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.

### REST API

```
POST /auth/refresh
```

```json
{
	"refresh_token": "gmPd...8wuB",
	"mode": "json"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
mutation {
	auth_refresh(refresh_token: "abc...def", mode: json) {
		access_token
		refresh_token
	}
}
```

---

## Logout

Invalidate the refresh token thus destroying the user's session.

### Request Body

`refresh_token`\
The refresh token to invalidate. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have
to submit it here.

### REST API

```
POST /auth/logout
```

```json
{
	"refresh_token": "gmPd...8wuB"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
mutation {
	auth_logout(refresh_token: "gmPd...8wuB")
}
```

---

## Request Password Reset

Request a password reset email to be sent to the given user.

### Request Body

`email` **Required**\
Email address of the user you're requesting a password reset for.

`reset_url`\
Provide a custom reset url which the link in the email will lead to. The reset token will be passed as a parameter.\
**Note**: You need to configure the
[`PASSWORD_RESET_URL_ALLOW_LIST` environment variable](/self-hosted/config-options#security) to enable this feature.

### REST API

```
POST /auth/password/request
```

```json
{
	"email": "admin@example.com"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
mutation {
	auth_password_request(email: "admin@example.com")
}
```

---

## Reset a Password

The request a password reset endpoint sends an email with a link to the admin app (or a custom route) which in turn uses
this endpoint to allow the user to reset their password.

### Request Body

`token` **Required**\
Password reset token, as provided in the email sent by the request endpoint.

`password` **Required**\
New password for the user.

### REST API

```
POST /auth/password/reset
```

```json
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
mutation {
	auth_password_reset(token: "eyJh...KmUk", password: "d1r3ctu5")
}
```

---

## List Auth Providers

List all the configured auth providers.

::: tip Configuring auth providers

To learn more about setting up auth providers, see
[Configuring auth providers](/self-hosted/config-options#authentication).

:::

### Response Attributes

`data` **Array**\
Array of configured auth providers.

`disableDefault` **boolean**\
Whether or not the default authentication provider is disabled.

```
GET /auth
```

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

---

## Login Using SSO Providers

Will redirect to the configured SSO provider for the user to login.

```
GET /auth/login/:provider
```

---
