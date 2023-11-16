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

Various services are available within Directus including `ItemsService`, `CollectionService`, `FilesService`.

To get started to create endpoints with any service, extract it from `services`.

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { ItemsService } = services;

})
```

This allows each endpoint implementations to initialize an instance of that service and leverage its methods to perform
CRUD operations.

## Commonly Used Services

Below is a list of commonly used services you would find handy:

- **ItemsService:** Provides access to perform CRUD operations on items in a database. Nearly all other services extend
  from ItemsService.
- **CollectionsService:** Provides access to perform CRUD operations on database collections.
- **FilesService:** Provides access to upload, import and perform other CRUD operations on files in Directus Files.
- **UsersService:** Extends ItemsService and adds authentication methods for user login as well as retrieving profile
  details.
- **FieldsService:** Provides access to perform CRUD operations to fields used in collections and item records.

Majority of the services extend the `ItemsService`, providing a unified approach to manipulating data. However, there
are also standalone services. It's important to use the matching service for core collections data type. For example,
user passwords are only hashed when used with `UsersService` and not `ItemsService`.

::: tip List of Available Services

Directus provides a number of built-in services. Refer to the full list
[here](https://github.com/directus/directus/tree/main/api/src/services).

:::
