---
description: REST and GraphQL API documentation on the Dashboards collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Dashboards

> Dashboards within the Insights module organize different Panels into an at-a-glance view. They can be used to group
> data based on department, objective, business process or anything you choose.
> [Learn more about Dashboards](/app/insights).

---

## The Dashboard Object

`id` **uuid**\
Primary key of the dashboard.

`name` **string**\
Name of the dashboard.

`icon` **string**\
Material icon for dashboard.

`note` **string**\
Descriptive text about the dashboard.

`date_created` **Date**\
When the dashboard was created

`user_created` **many-to-one**\
User that created the dashboard. Many-to-one to [users](/reference/system/users).

`color` **string**\
Accent color for the dashboard.

`panels` **one-to-many**\
Panels that are in this dashboard. One-to-may to [panels](/reference/system/panels).

```json
{
	"id": "a79bd1b2-beb2-49fc-8a26-0b3eec0e2697",
	"name": "My Dashboard",
	"icon": "dashboard",
	"note": "Test",
	"date_created": "2023-01-05T19:03:15.051Z",
	"user_created": "fd066644-c8e5-499d-947b-fe6c6e1a1473",
	"color": "#6644FF",
	"panels": ["22640672-eef0-4ee9-ab04-591f3afb2883"]
}
```

---

## List Dashboards

List all dashboards that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [dashboard objects](#the-dashboard-object). If no items are available,
data will be an empty array.

### REST API

```
GET /dashboards
SEARCH /dashboards
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	dashboards: [directus_dashboards]
}
```

##### Example

```graphql
query {
	dashboards {
		id
		name
	}
}
```

---

## Retrieve a Dashboard

List an existing dashboard by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [dashboard object](#the-dashboard-object).

### REST API

```
GET /dashboards/:id
```

##### Example

```
GET /dashboards/2fc325fb-299b-4d20-a9e7-a34349dee8b2
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	dashboards_by_id(id: ID!): directus_dashboards
}
```

##### Example

```graphql
query {
	dashboards_by_id(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2") {
		id
		name
	}
}
```

---

## Create a Dashboard

Create a new dashboard.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [dashboard object](#the-dashboard-object).

### Returns

Returns the [dashboard object](#the-dashboard-object) for the created dashboard.

### REST API

```
POST /dashboards
```

##### Example

```json
// POST /dashboards

{
	"name": "My Dashboard",
	"icon": "dashboard"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_dashboards_item(data: create_directus_dashboards_input!): directus_dashboards
}
```

##### Example

```graphql
mutation {
	create_dashboards_item(data: { name: "My Dashboard", icon: "dashboards" }) {
		id
		name
	}
}
```

---

## Create Multiple Dashboards

Create multiple new dashboards.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [dashboard objects](#the-dashboard-object).

### Returns

Returns the [dashboard object](#the-dashboard-object) for the created dashboard.

### REST API

```
POST /dashboards
```

##### Example

```json
// POST /dashboards

[
	{
		"name": "My Dashboard",
		"icon": "dashboard"
	},
	{
		"name": "Another Dashboard",
		"icon": "person"
	}
]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_dashboards_items(data: [create_directus_dashboards_input!]!): [directus_dashboards]
}
```

##### Example

```graphql
mutation {
	create_dashboards_items(
		data: [
			{
				"name": "My Dashboard",
				"icon": "dashboard"
			},
			{
				"name": "Another Dashboard",
				"icon": "person"
			}
		]
	) {
		id
		name
	}
}
```

---

## Update a Dashboard

Update an existing dashboard.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [dashboard object](#the-dashboard-object).

### Returns

Returns the [dashboard object](#the-dashboard-object) for the updated dashboard.

### REST API

```
PATCH /dashboards/:id
```

##### Example

```json
// PATCH /dashboards/2fc325fb-299b-4d20-a9e7-a34349dee8b2

{
	"name": "My Updated Dashboard"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_dashboards_item(id: ID!, data: update_directus_dashboards_input): directus_dashboards
}
```

##### Example

```graphql
mutation {
	update_dashboards_item(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2", data: { name: "My Updated Dashboard" }) {
		id
		name
	}
}
```

---

## Update Multiple Dashboards

Update multiple existing dashboards.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the dashboards you'd like to update.

`data` **Required**\
Any of [the dashboard](#the-dashboard-object)'s properties.

### Returns

Returns the [dashboard objects](#the-dashboard-object) for the updated dashboards.

### REST API

```
PATCH /dashboards
```

##### Example

```json
// PATCH /dashboards

{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"color": "#6644FF"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_dashboards_items(ids: [ID!]!, data: update_directus_dashboards_input): [directus_dashboards]
}
```

##### Example

```graphql
mutation {
	update_dashboards_items(
		ids: ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"]
		data: { "color": "#6644FF" }
	) {
		id
		name
	}
}
```

---

## Delete a Dashboard

Delete an existing dashboard.

### Returns

Empty body.

### REST API

```
DELETE /dashboards/:id
```

##### Example

```
DELETE /dashboards/12204ee2-2c82-4d9a-b044-2f4842a11dba
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_dashboards_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_dashboards_item(id: "12204ee2-2c82-4d9a-b044-2f4842a11dba") {
		id
	}
}
```

---

## Delete Multiple Dashboards

Delete multiple existing dashboards.

### Request Body

An array of dashboards primary keys

### Returns

Empty body.

### REST API

```
DELETE /dashboards
```

##### Example

```json
// DELETE /dashboards
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_dashboards_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_dashboards_items(
		ids: [
			"25821236-8c2a-4f89-8fdc-c7d01f35877d"
			"02b9486e-4273-4fd5-b94b-e18fd923d1ed"
			"7d62f1e9-a83f-407b-84f8-1c184f014501"
		]
	) {
		ids
	}
}
```
