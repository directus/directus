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

- [`POST /auth/login`](#login)
- [`POST /auth/refresh`](#refresh)
- [`POST /auth/logout`](#logout)
- [`POST /auth/password/request`](#request)
- [`POST /auth/password/reset`](#reset)
- [`GET /auth/oauth`](#oauth)
- [`GET /auth/oauth/{provider}`](#oauth-provider)

</div>
</div>

---

## Tokens

<div class="two-up">
<div class="left">

In order to authenticate to the API, you have to pass an authentication token. The token can be passed in two ways:

#### Query Parameter

Pass the token in the `access_token` query parameter: `?access_token=<token>`

#### Authorization Header

Pass the token in the Authorization header: `Authorization: Bearer <token>`

### Types

There's two types of tokens that can be used within Directus:

#### Temporary Token (JWT)

These are the tokens as returned by the [/auth/login](#login) endpoint (below). These tokens have a relatively short
expiration time, and are thus the most secure option to use. The tokens are returned with a `refresh_token` that can be
used to retrieve a new access token through the [`/auth/refresh`](#refresh) endpoint.

#### Static Token

Each user can have one static token that will never expire. This is useful for server-to-server communication, but is
also less secure than the JWT token.

</div>
<div class="right">

```
// Query Param
?access_token=abc.def.hij

// Header
Authorization: Bearer abc.def.hij
```

::: tip Retrieving a Token

This token can be retrieved through [the login endpoint](#login).

:::

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
		"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJkMzIxOTQwLTY5ZjUtNDQ1Zi1iZTZiLWM3NzNmYTU4YTgyMCIsImlhdCI6MTYxMjMwNjAzMSwiZXhwIjoxNjEyMzA2OTMxfQ.3yhJKJmFtnBUQNdw-TRM2_Kcg_eQyavoGOwYZf7KmUk",
		"expires": 900000,
		"refresh_token": "gmPdgKbmJmVSPEBqz_a8vLRQWvaZ8MCxa1wb-wu3EW5w2LJ47VH2aFor3WSd8wuB"
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
	"refresh_token": "gmPdgKbmJmVSPEBqz_a8vLRQWvaZ8MCxa1wb-wu3EW5w2LJ47VH2aFor3WSd8wuB"
}
```

```json
// Response

{
	"data": {
		"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJkMzIxOTQwLTY5ZjUtNDQ1Zi1iZTZiLWM3NzNmYTU4YTgyMCIsImlhdCI6MTYxMjMwNjAzMSwiZXhwIjoxNjEyMzA2OTMxfQ.3yhJKJmFtnBUQNdw-TRM2_Kcg_eQyavoGOwYZf7KmUk",
		"expires": 900000,
		"refresh_token": "JAnU_kzLqyKvymKFXRPRPcu06fb6An3kWMmpsbnagXwkWycwGF0tfNpX7AADE-Gc"
	}
}
```

</div>
</div>
