---
pageClass: page-reference
---

# Authentication

<div class="two-up">
<div class="left">

> By default, all data in the system is off limits for unauthenticated users. To gain access to protected data, you must
> include an access token with every request, or
> [configure permissions for the public role](/guides/roles-and-permissions).

</div>

<div class="right">

[[toc]]

</div>
</div>

---

## Login

Retrieve a temporary access token and refresh token.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`email` **Required**\
Email address of the user you're retrieving the access token for.

`password` **Required**\
Password of the user.

`otp`\
The user's one-time-password (if MFA is enabled).

`mode`\
Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` `secure` cookie. One of `json`, `cookie`.

</div>

### Response Attributes

<div class="definitions">

`access_token` **string**\
Temporary access token to be used in follow-up requests.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.

</div>

::: tip Expiry time

The token's expiration time can be configured through
[the `ACCESS_TOKEN_TTL` environment variable](/reference/environment-variables).

:::

</div>
<div class="right">

### REST API

```
POST /auth/login
```

```json
{
	"email": "admin@example.com",
	"password": "d1r3ct5us"
}
```

### GraphQL

```graphql
mutation {
	auth_login(email: "admin@example.com", password: "d1r3ctu5") {
		access_token
		refresh_token
	}
}
```

</div>
</div>

---

## Refresh

Retrieve a new access token using a refresh token.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`refresh_token`\
The refresh token to use. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have to submit
it here.

</div>

### Response Attributes

<div class="definitions">

`access_token` **string**\
Temporary access token to be used in follow-up requests.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.

</div>

</div>
<div class="right">

### REST API

```
POST /auth/refresh
```

```json
{
	"refresh_token": "gmPd...8wuB"
}
```

### GraphQL

```graphql
mutation {
	auth_refresh(refresh_token: "abc...def") {
		access_token
		refresh_token
	}
}
```

</div>
</div>

---

## Logout

Invalidate the refresh token thus destroying the user's session.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`refresh_token`\
The refresh token to invalidate. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have
to submit it here.

</div>

</div>
<div class="right">

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

```graphql
mutation {
	auth_logout(refresh_token: "gmPd...8wuB")
}
```

</div>
</div>

---

## Request Password Reset

Request a password reset email to be sent to the given user.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`email` **Required**\
Email address of the user you're requesting a password reset for.

`reset_url`\
Provide a custom reset url which the link in the email will lead to. The reset token will be passed as a parameter.\
**Note**: You need to configure the
[`PASSWORD_RESET_URL_ALLOW_LIST` environment variable](/reference/environment-variables/#security) to enable this
feature.

</div>

</div>
<div class="right">

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

```graphql
mutation {
	auth_password_request(email: "admin@example.com")
}
```

</div>
</div>

---

## Reset a Password

The request a password reset endpoint sends an email with a link to the admin app (or a custom route) which in turn uses
this endpoint to allow the user to reset their password.

<div class="two-up">
<div class="left">

### Request Body

<div class="definitions">

`token` **Required**\
Password reset token, as provided in the email sent by the request endpoint.

`password` **Required**\
New password for the user.

</div>

</div>
<div class="right">

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

```graphql
mutation {
	auth_password_reset(token: "eyJh...KmUk", password: "d1r3ctu5")
}
```

</div>
</div>

---

## List oAuth providers

List all the configured oAuth providers.

<div class="two-up">
<div class="left">

::: tip Configuring oAuth

To learn more about setting up oAuth providers, see
[Configuring SSO through oAuth](/guides/api-config/#oauth-single-sign-on-openid).

:::

### Response Attributes

<div class="definitions">

`data` **Array**\
Array of configured oAuth providers.

</div>

</div>
<div class="right">

```
GET /auth/oauth
```

```json
{
	"data": ["GitHub", "Google", "Okta"]
}
```

</div>
</div>

---

## Login using oAuth provider

Will redirect to the configured oAuth provider for the user to login.

<div class="two-up">
<div class="right">

```
GET /auth/oauth/:provider
```

</div>
</div>

---
