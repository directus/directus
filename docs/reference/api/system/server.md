---
pageClass: page-reference
---

# Server

<div class="two-up">
<div class="left">

> Provides detailed information about the project server, its schema, and its health.
> [Learn more about Projects](/concepts/projects/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## Get OpenAPI Specification

Retrieve the OpenAPI spec for the current project.

<div class="two-up">
<div class="left">

::: tip Permissions

This OAS spec is based on the read permissions of the currently authenticated user.

:::

### Returns

Object conforming to [the OpenAPI Specification](https://swagger.io/specification/)

</div>
<div class="right">

### REST API

```
GET /server/specs/oas
```

### GraphQL

```graphql
type Query {
	server_specs_oas: String
}
```

##### Example

```graphql
query {
	server_specs_oas
}
```

</div>
</div>

---

## Get GraphQL SDL

Retrieve the GraphQL SDL for the current project.

<div class="two-up">
<div class="left">

::: tip Permissions

The SDL is based on the permissions of the currently authenticated user.

:::

### Returns

GraphQL SDL file.

```graphql
type about_us {
  id: Int
  introduction: String
  our_process: String
  sales_email: String
  general_email: String
  primary_color: String
  secondary_color: String
  logo: directus_files
  mark: directus_files
}

type articles {
  id: Int
  status: String
	...
# etc
```

</div>
<div class="right">

### REST API

```
GET /server/specs/graphql/
GET /server/specs/graphql/system
```

### GraphQL

```graphql
type Query {
	server_specs_graphql(scope: graphql_sdl_scope): String
}
```

##### Example

```graphql
query {
	server_specs_graphql(scope: "system")
}
```

</div>
</div>

---

## Ping

Ping... pong! 🏓

<div class="two-up">
<div class="left">

### Returns

Pong.

</div>
<div class="right">

### REST API

```
GET /server/ping
```

### GraphQL

```graphql
type Query {
	server_ping: String
}
```

##### Example

```graphql
query {
	server_ping
}
```

</div>
</div>

---

## Info

Information about the current installation.

<div class="two-up">
<div class="left">

::: tip Permissions

The public information is returned for everybody. Admin users get additional information (see below).

:::

### Returns

<div class="definitions">

`project` **object**\
Public information about the project. Used to render the Admin App public pages.

See [the settings object](/reference/api/settings/#the-settings-object) for more information on the individual
properties of the `project` object.

</div>

Admin users also get the following information:

<div class="definitions">

`directus.version` **string**\
Current version of Directus used.

`node.version` **string**\
Current version of Node used.

`node.uptime` **integer**\
How long the current process has been running.

`os.type` **string**\
What type of operation system is used.

`os.version` **string**\
What version of the operation system is used.

`os.uptime` **string**\
How long the operating system has been up.

`os.totalmem` **string**\
How much memory is available on the operating system.

</div>

</div>
<div class="right">

### REST API

```
GET /server/info
```

### GraphQL

```graphql
type Query {
	server_info: server_info
}
```

##### Example

```graphql
query {
	server_info {
		directus {
			version
		}
	}
}
```

</div>
</div>

---

## Health

Get the current health status of the server.

<div class="two-up">
<div class="left">

The `/server/health` endpoint shows you a general health status for the server and all connected (third party) services,
such as Redis or S3.

The output is based on the "Health Check Response for HTTP APIs" draft spec:
[Health Check Response Format for HTTP APIs Draft Specification](https://tools.ietf.org/id/draft-inadarei-api-health-check-05.html).

This endpoint can be used to ensure a healthy system when running in a horizontally scaled setup, like Kubernetes or AWS
Elastic Beanstalk.

By default, the endpoint only returns a `status` of `ok`, `warn` or `error`. By authenticating as an admin, it will
return more in-depth information about the current health status of the system.

```json
// Response

// Non-admin
{
  "status": "ok"
}

// Admin
{
  "status": "ok",
  "releaseId": "9.0.0",
  "serviceId": "3292c816-ae02-43b4-ba91-f0bb549f040c",
  "checks": {
    "pg:responseTime": [
      {
        "status": "ok",
        "componentType": "datastore",
        "observedUnit": "ms",
        "observedValue": 0.489
      }
    ],
    "pg:connectionsAvailable": [
      {
        "status": "ok",
        "componentType": "datastore",
        "observedValue": 2
      }
    ],
    "pg:connectionsUsed": [
      {
        "status": "ok",
        "componentType": "datastore",
        "observedValue": 0
      }
    ],
    "storage:local:responseTime": [
      {
        "status": "ok",
        "componentType": "objectstore",
        "observedValue": 1.038,
        "observedUnit": "ms"
      }
    ],
    "email:connection": [
      {
        "status": "ok",
        "componentType": "email"
      }
    ]
  }
}
```

### Returns

<div class="definitions">

`status` **string**\
One of `ok`, `warn`, `error`.

</div>

Authenticated admin users also get the following information:

<div class="definitions">

`releaseId` **string**\
Directus version in use.

`serviceId` **string**\
UUID of the current Directus instance.

`checks` **array**\
Array with the status of all individually connected services.

</div>

</div>
<div class="right">

### REST API

```
GET /server/health
```

### GraphQL

```graphql
type Query {
	server_health: JSON
}
```

##### Example

```graphql
query {
	server_health
}
```

</div>
</div>

---
