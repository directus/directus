---
pageClass: page-reference
---

# Authentication

<div class="two-up">
<div class="left">

By default, all data in the system is off limits for unauthenticated users. To gain access to protected data, you must
include an access token with every request, or
[configure permissions for the public role](/guides/roles-and-permissions).

</div>

<div class="right">

- [POST /auth/login](#login)
- [POST /auth/refresh](#refresh)
- [POST /auth/logout](#logout)
- [POST /auth/password/request](#request-password-reset)
- [POST /auth/password/reset](#reset-a-password)
- [GET /auth/oauth](#list-oauth-providers)
- [GET /auth/oauth/:provider](#login-using-oauth-provider)

</div>
</div>

---

## Login

<div class="two-up">
<div class="left">

Retrieve a temporary access token and refresh token.

### Request Attributes

<div class="definitions">

`email` **Required**\
<small>Email address of the user you're retrieving the access token for.</small>

`password` **Required**\
<small>Password of the user.</small>

`otp`\
<small>The user's one-time-password (if MFA is enabled).</small>

`mode`\
<small>Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` `secure` cookie. One of `json`, `cookie`.</small>

</div>

### Response Attributes

<div class="definitions">

`access_token` **String**\
<small>Temporary access token to be used in follow-up requests.</small>

`expires` **Number**\
<small>How long before the access token will expire. Value is in milliseconds.</small>

`refresh_token` **String**\
<small>The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.</small>

</div>

::: tip Expiry time

The token's expiration time can be configured through
[the `ACCESS_TOKEN_TTL` environment variable](/reference/environment-variables).

:::

</div>
<div class="right">

### `POST /auth/login`

```json
// Request

{
	"email": "admin@example.com",
	"password": "d1r3ct5us"
}
```

```json
// Response

{
	"data": {
		"access_token": "eyJh...KmUk",
		"expires": 900000,
		"refresh_token": "gmPd...8wuB"
	}
}
```

</div>
</div>

---

## Refresh

<div class="two-up">
<div class="left">

Retrieve a new access token using a refresh token.

### Request Attributes

<div class="definitions">

`refresh_token`\
<small>The refresh token to use. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't have
to submit it here.</small>

</div>

### Response Attributes

<div class="definitions">

`access_token` **String**\
<small>Temporary access token to be used in follow-up requests.</small>

`expires` **Number**\
<small>How long before the access token will expire. Value is in milliseconds.</small>

`refresh_token` **String**\
<small>The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.</small>

</div>

</div>
<div class="right">

### `POST /auth/refresh`

```json
// Request

{
	"refresh_token": "gmPd...8wuB"
}
```

```json
// Response

{
	"data": {
		"access_token": "eyJh...KmUk",
		"expires": 900000,
		"refresh_token": "JAnU...E-Gc"
	}
}
```

</div>
</div>

---

## Logout

<div class="two-up">
<div class="left">

Invalidate the refresh token thus destroying the user's session.

### Request Attributes

<div class="definitions">

`refresh_token`\
<small>The refresh token to invalidate. If you have the refresh token in a cookie through [`/auth/login`](#login), you don't
have to submit it here.</small>

</div>

</div>
<div class="right">

### `POST /auth/logout`

```json
// Request

{
	"refresh_token": "gmPd...8wuB"
}
```

```json
// Empty Response
```

</div>
</div>

---

## Request Password Reset

<div class="two-up">
<div class="left">

Request a password reset email to be sent to the given user.

### Request Attributes

<div class="definitions">

`email` **Required**\
<small>Email address of the user you're requesting a password reset for.</small>

`reset_url`\
<small>Provide a custom reset url which the link in the email will lead to. The reset token will be passed as a parameter.</small>

</div>

</div>
<div class="right">

### `POST /auth/password/request`

```json
// Request

{
	"email": "admin@example.com"
}
```

```json
// Empty Response
```

</div>
</div>

---

## Reset a Password

<div class="two-up">
<div class="left">

The request a password reset endpoint sends an email with a link to the admin app (or a custom route) which in turn uses
this endpoint to allow the user to reset their password.

### Request Attributes

<div class="definitions">

`token` **Required**\
<small>Password reset token, as provided in the email sent by the request endpoint.</small>

`password` **Required**\
<small>New password for the user.</small>

</div>

</div>
<div class="right">

### `GET /auth/oauth`

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

## List oAuth providers

<div class="two-up">
<div class="left">

List all the configured oAuth providers.

::: tip Configuring oAuth

To learn more about setting up oAuth providers, see [Configuring SSO through oAuth](/guides/oauth).

:::

### Response Attributes

<div class="definitions">

`data` **Array**\
<small>Array of configured oAuth providers.</small>

</div>

</div>
<div class="right">

### `GET /auth/oauth`

```json
// Response

{
	"data": ["GitHub", "Google", "Okta"]
}
```

</div>
</div>

---

## Login using oAuth provider

<div class="two-up">
<div class="left">

Will redirect to the configured oAuth provider for the user to login.

</div>
<div class="right">

### `GET /auth/oauth/:provider`

```json
// Redirect to oAuth provider
```

</div>
</div>

---
