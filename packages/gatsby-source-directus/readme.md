# gatsby-source-directus

Source plugin for pulling data into Gatsby from a Directus API.

## Install

```
npm install --save @directus/gatsby-source-directus
```

## Usage

1. Go to `gatsby-config.js` on your Gatsby project
2. Add new entry to plugins properly configured with your settings

```js
module.exports = {
	// ... some gatsby configuration
	plugins: [
		// ... some gatsby plugins

		// You can take advantage of the following plugins with gatsby-source-directus

		// `gatsby-plugin-image`,
		// `gatsby-transformer-sharp`,
		// `gatsby-plugin-sharp`,

		// Finally our plugin
		{
			resolve: '@directus/gatsby-source-directus',
			options: {
				url: `https://myproject.directus.cloud`, // Fill with your Directus instance address
				auth: {
					token: 'my_secret_token', // You can use a static token from an user

					// Or you can use the credentials of an user
					// email: "johndoe@directus.cloud",
					// password: "mysecretpassword",
				},
			},
		},
	],
};
```

3. Request your data

```graphql
query {
	# if you change `type.name`, remember to also rename following field
	directus {
		# the collection you want to query
		articles {
			# the fields you want to query from above collection
			title
			files {
				# since this is a M2M relationship, we need to reference the junction field
				directus_files_id {
					# `id` is required to be fetched in order to be used with `gatsby-transformer-sharp`
					id
					imageFile {
						# when using the plugin 'gatsby-transformer-sharp', you can query images with transformations
						childImageSharp {
							gatsbyImageData(width: 200)
						}
					}
				}
			}
		}
	}

	# it's also possible to query system collections
	directus_system {
		users {
			email
		}
		files {
			id
			imageFile {
				childImageSharp {
					gatsbyImageData(width: 200)
				}
			}
		}
	}
}
```

**Note**: When using with `gatsby-transformer-sharp` you will need to query `id` of the asset (specified on
`DirectusData_directus_files` type).

## Options

- `url` [*Required*] - should be a valid URL to your Directus instance

- `auth` [*Optional*] - defines if requests will have authentication or not. You should define this if you want access
  to non-public content.
  [View more about permissions](https://docs.directus.io/configuration/users-roles-permissions/#users-roles-permissions)

  - `auth.token` [*Optional*] - should be the static token of the user which will make the requests. You can define one
    on user detail page.

  - `auth.email` [*Optional, but required with password and ignored if `auth.token` defined*] - should be the email of
    the user which will make the requests.

  - `auth.password` [*Optional, but required with email and ignored if `auth.token` defined\*] - should be the password
    of the user which will make the requests.

- `type` [*Optional*] - defines the type and field name to be used on GraphQL. If you are using multiple instances of
  Directus, please ensure you have unique type and field names per instance.

  - `type.name` [*Optional, defaults to `DirectusData`*] - defines the GraphQL type name to be used for user defined
    collections

  - `type.field` [*Optional*, defaults to `directus`] - defines the GraphQL field name to query user defined
    collections. If you change this property, remember to query the proper field inside `query`.

  - `type.system_name` [*Optional, defaults to `DirectusSystemData`*] - defines the GraphQL type name to be used for
    Directus defined collections, i.e., `directus_users`, `directus_files`, etc.

  - `type.system_field` [*Optional*, defaults to `directus_system`] - defines the GraphQL field name to query Directus
    defined collections.

- `dev` [*Optional*] - defines options for development environments

  - `dev.refresh` [*Optional, defaults to 15s*] - tells the refresh rate in seconds of the schema. Should be a number in
    seconds or a string supported by [ms](https://github.com/vercel/ms)

- `graphql` [*Optional*] - defines extra options to be passed into `gatsby-source-graphql`. Useful for advanced use
  cases.

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

If you specify the `type.field`, you must query from that field instead.

```graphql
query {
	# In this case `type.field` is "blog"
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
	# While in this case `type.field` is "portal"
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

[View more about Directus](https://docs.directus.io/)
