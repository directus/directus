# Authentication

> By default, all data in the system is off limits for unauthenticated users. To gain access to protected data, you must include an access token with every request, or [configure permissions for the public role](/concepts/roles/#public-role).

## Authenticating with Tokens

In order to authenticate to the API, you have to pass an authentication token. The token can be passed in two ways:

### Query Parameter

Pass the token in the `access_token` query parameter: `?access_token=<token>`

```
?access_token=eyJh...KmUk
```

### Authorization Header

Pass the token in the Authorization header: `Authorization: Bearer <token>`

```
Authorization: Bearer eyJh...KmUk
```

## Types of Tokens

There are two types of tokens that can be used to authenticate within Directus:

### Temporary Token (JWT)

These are the tokens as returned by the [/auth/login](/reference/api/rest/authentication/#login) endpoint. These tokens
have a relatively short expiration time, and are thus the most secure option to use. The tokens are returned with a
`refresh_token` that can be used to retrieve a new access token via the [/auth/refresh](/reference/api/rest/authentication/#refresh) endpoint.

### Static Token

Each user can have one static token that will never expire. This is useful for server-to-server communication, but is
also less secure than the JWT token. This token is saved to the database (`directus_users.token`) in plain-text and can be retrieved through the [/auth/login](/reference/api/rest/authentication/#login) endpoint.
