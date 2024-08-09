---
description: REST and GraphQL API documentation on the Server collection in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Server

> Provides detailed information about the project server, its schema, and its health.
> [Learn more about Projects](/user-guide/overview/glossary#projects).

## Get OpenAPI Specification

Retrieve the OpenAPI spec for the current project.

::: tip Permissions

This OAS spec is based on the read permissions of the currently authenticated user.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/specs/oas`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	server_specs_oas: String
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readOpenApiSpec } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readOpenApiSpec());
```

</template>
</SnippetToggler>

### Response

Object conforming to [the OpenAPI Specification](https://swagger.io/specification)

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/specs/oas`

</template>
<template #graphql>

```graphql
query {
	server_specs_oas
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readOpenApiSpec } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readOpenApiSpec());
```

</template>
</SnippetToggler>

## Get GraphQL SDL

Retrieve the GraphQL SDL for the current project.

::: tip Permissions

The SDL is based on the permissions of the currently authenticated user.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/specs/graphql/`

`GET /server/specs/graphql/system`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	server_specs_graphql(scope: graphql_sdl_scope): String
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readGraphqlSdl } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readGraphqlSdl(scope));
```

</template>
</SnippetToggler>

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
	# ...
}

# etc
```

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/specs/graphql/`

`GET /server/specs/graphql/system`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	server_specs_graphql(scope: system)
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readGraphqlSdl } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readGraphqlSdl('item'));
```

</template>
</SnippetToggler>

## Ping

Ping... pong! 🏓

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/ping`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	server_ping: String
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, serverPing } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(serverPing());
```

</template>
</SnippetToggler>

### Returns

Pong.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/ping`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	server_ping
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, serverPing } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(serverPing());
```

</template>
</SnippetToggler>

## Info

Information about the current installation.

::: tip Permissions

The public information is returned for everybody. Admin users get additional information (see below).

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/info`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	server_info: server_info
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, serverInfo } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(serverInfo());
```

</template>
</SnippetToggler>

### Response

`project` **object**\
Public information about the project. Used to render the Data Studio public pages.

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

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/info`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	server_info {
		project {
			project_name
		}
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, serverInfo } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(serverInfo());
```

</template>
</SnippetToggler>

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

::: code-group

```json [Non-Admin Response]
{
	"status": "ok"
}
```

```json [Admin Response]
{
	"status": "ok",
	"releaseId": "10.0.0",
	"serviceId": "https://directus.example.com",
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

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/health`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	server_health: JSON
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, serverHealth } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(serverHealth());
```

</template>
</SnippetToggler>

### Returns

`status` **string**\
One of `ok`, `warn`, `error`.

Authenticated admin users also get the following information:

`releaseId` **string**\
Directus version in use.

`serviceId` **string**\
Public URL of the current Directus instance.

`checks` **array**\
Array with the status of all individually connected services.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /server/health`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	server_health
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, serverHealth } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(serverHealth());
```

</template>
</SnippetToggler>
