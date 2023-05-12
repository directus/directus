---
description: REST and GraphQL API documentation on the Server collection in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Server

> Provides detailed information about the project server, its schema, and its health.
> [Learn more about Projects](/getting-started/glossary#projects).

---

## Get OpenAPI Specification

Retrieve the OpenAPI spec for the current project.

::: tip Permissions

This OAS spec is based on the read permissions of the currently authenticated user.

:::

### Returns

Object conforming to [the OpenAPI Specification](https://swagger.io/specification)

### REST API

```
GET /server/specs/oas
```

### GraphQL

```
POST /graphql/system
```

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

---

## Get GraphQL SDL

Retrieve the GraphQL SDL for the current project.

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

### REST API

```
GET /server/specs/graphql/
GET /server/specs/graphql/system
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	server_specs_graphql(scope: graphql_sdl_scope): String
}
```

##### Example

```graphql
query {
	server_specs_graphql(scope: system)
}
```

---

## Ping

Ping... pong! 🏓

### Returns

Pong.

### REST API

```
GET /server/ping
```

### GraphQL

```
POST /graphql/system
```

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

---

## Info

Information about the current installation.

::: tip Permissions

The public information is returned for everybody. Admin users get additional information (see below).

:::

### Returns

`project` **object**\
Public information about the project. Used to render the Admin App public pages.

See [the settings object](/reference/system/settings#the-settings-object) for more information on the individual
properties of the `project` object.

Logged in users also get the following information:

`rateLimit` **false | object**\
Whether or not the rate limiter is enabled.

`rateLimit.points` **number**\
If rate-limiter is enabled, amount of allowed points per duration

`rateLimit.duration` **number**\
If rate-limiter is enabled, duration in seconds in which points are counted

`queryLimit.default` **number**\
The default query limit used when not defined in the API request

`queryLimit.max` **number**\
The maximum query limit accepted on API requests

Admin users also get the following information:

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

### REST API

```
GET /server/info
```

### GraphQL

```
POST /graphql/system
```

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

---

## Health

Get the current health status of the server.

The `/server/health` endpoint shows you a general health status for the server and all connected (third party) services,
such as Redis or S3.

The output is based on the "Health Check Response for HTTP APIs" draft spec:
[Health Check Response Format for HTTP APIs Draft Specification](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06).

This endpoint can be used to ensure a healthy system when running in a horizontally scaled setup, like Kubernetes,
Google Cloud Platform or AWS Elastic Beanstalk.

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
  "releaseId": "10.0.0",
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

`status` **string**\
One of `ok`, `warn`, `error`.

Authenticated admin users also get the following information:

`releaseId` **string**\
Directus version in use.

`serviceId` **string**\
UUID of the current Directus instance.

`checks` **array**\
Array with the status of all individually connected services.

### REST API

```
GET /server/health
```

### GraphQL

```
POST /graphql/system
```

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

---
