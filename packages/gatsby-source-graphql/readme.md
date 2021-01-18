# gatsby-source-directus

Source plugin for pulling data into Gatsby from a Directus API.

## Install

```
npm install --save @directus/gatsby-source-directus
```

## Configure

### Public data

For pulling public data, you don't need to authenticate.

```js
// In your gatsby-config.js
plugins: [
	{
		resolve: `gatsby-source-directus`,
		options: {
			url: `https://my-project.directus.app`,
		},
	},
];
```

### Authentication

If you need data that is protected by permission rules, you need to authenticate.

#### With tokens

You can authenticate via user token.

```js
// In your gatsby-config.js
plugins: [
	{
		resolve: `gatsby-source-directus`,
		options: {
			url: `https://my-project.directus.app`,
			auth: {
				token: 'my-user-token',
			},
		},
	},
];
```

#### With email and password

You can authenticate via email and password.

```js
// In your gatsby-config.js
plugins: [
	{
		resolve: `gatsby-source-directus`,
		options: {
			url: `https://my-project.directus.app`,
			auth: {
				email: 'admin@example.com',
				password: 'password',
			},
		},
	},
];
```

### Multiple projects

You can se which type/field Directus should pull it's data into. This allows for usage with multiple projects and better
data organization.

```js
// In your gatsby-config.js
plugins: [
	{
		resolve: `gatsby-source-directus`,
		options: {
			url: `https://my-portal.directus.app`,
			type: {
				name: 'Portal',
				field: 'portal',
			},
		},
	},
	{
		resolve: `gatsby-source-directus`,
		options: {
			url: `https://my-blog.directus.app`,
			type: {
				name: 'Blog',
				field: 'blog',
			},
		},
	},
];
```

## How to query

The default way to query data is to fetch items from `directus` field.

```graphql
query {
	directus {
		items {
			my_collection {
				some_field
				other_field
			}
		}
	}
}
```

If you specify the field name, you must query from that field instead.

```graphql
query {
	blog {
		items {
			posts {
				id
				title
				slug
				status
			}
		}
	}
	portal {
		items {
			pages {
				id
				title
				slug
				status
			}
		}
	}
}
```

## Docs

See [the docs](https://docs.directus.io/)
