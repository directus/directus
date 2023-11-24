---
description: Learn about the Services in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Using Services in API Extensions

Directus has a number of internal services that perform operations on system or user-created collections. These services
can be used when building collections and automatically provide additional functionality like permission checks and
password hashing.

When using REST or GraphQL endpoints, Directus uses services to perform operations. When building extensions, you should
use the services directly.

## Available Services

Various services are available within Directus including `ItemsService`, `CollectionsService`, `FilesService`.

Services are available as part of an extension's `context`. It is common to destructure the specific service you need as
shown below in an example of an [endpoint extension](/extensions/endpoints).

```js
export default defineEndpoint(async (router, context) => {
  const { services, getSchema } = context;
  const { ItemsService } = services;
	
  const schema = await getSchema();
  const itemsService = new ItemsService({ schema });
})
```

With each endpoint implementation, you can create an instance of a service and use its methods to perform operations.

## Commonly Used Services

- **ItemsService:** Provides access to perform operations on items in a collection.
- **CollectionsService:** Provides access to perform operations on collections.
- **FilesService:** Provides access to upload, import and perform other operations on files.
- **UsersService:** Provides access to manage user accounts and perform operations on user profiles.
- **FieldsService:** Provides access to perform operations on fields used in collections and items.

All system collections have a dedicated service which often extend the `ItemsService`. If you are working with system
collections, use the dedicated service as they may implement additional functionality. For example, user passwords are
hashed when used with the `UsersService`, but not with the `ItemsService`.

::: tip List of Available Services

Directus provides a number of built-in services.
[Refer to the full list of services in our codebase](https://github.com/directus/directus/tree/main/api/src/services).

:::
