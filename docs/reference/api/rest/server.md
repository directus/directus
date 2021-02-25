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

```
GET /server/specs/oas
```

```json
// Response
{
	"openapi": "3.0.1",
	"info": {
		"title": "Dynamic API Specification",
		"description": "This is a dynamically generated API specification for all endpoints existing on the current .",
		"version": "9.0.0-rc.34"
	},
	"servers": [
		{
			"url": "http://localhost:8055",
			"description": "Your current Directus instance."
		}
	]
	// etc
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

```
GET /server/ping
```

```json
// Returns
pong
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

```
GET /server/info
```

```json
// Response

// Non-admin
{
	"data": {
		"project": {
			"project_name": "Directus",
			"project_logo": null,
			"project_color": null,
			"public_foreground": null,
			"public_background": null,
			"public_note": null,
			"custom_css": null
		}
	}
}

// Admin
{
  "data": {
    "project": {
      "project_name": "Directus",
      "project_logo": null,
      "project_color": null,
      "public_foreground": null,
      "public_background": null,
      "public_note": null,
      "custom_css": null
    },
    "directus": {
      "version": "9.0.0-rc.34"
    },
    "node": {
      "version": "15.5.1",
      "uptime": 77586
    },
    "os": {
      "type": "macOS",
      "version": "Big Sur (11)",
      "uptime": 180836,
      "totalmem": 34359738368
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

The health check response structure is based on the
[Health Check Response Format for HTTP APIs Draft Specification](https://tools.ietf.org/id/draft-inadarei-api-health-check-05.html).

::: tip Permissions

Admin users get a wide range of information, including database connection speed, email connection status etc.

:::

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

```
GET /server/health
```

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

</div>
</div>

---
