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

## Initializing Services

Various services are available within Directus including `ItemsService`, `CollectionsService`, `FilesService`. These
services are available as part of an extension's `context`.

To initialize a service, it is common to destructure the specific service as shown below, which is an example of an
[endpoint extension](/extensions/endpoints).

```js
export default defineEndpoint((router, context) => {
  const { services, getSchema } = context;
  const { ItemsService } = services;

  router.get('/', async (req, res) => {
    const itemsService = new ItemsService('collection_name', {
      schema: await getSchema(),
      accountability: req.accountability
    });

    // Your route handler logic
  });
});
```

- **Schema:** Schema refers to the underlying Knex database schema used within Directus. The `getSchema` function is
  provided in the context and is required for each service to work.

- **Accountability:** Accountability is used for authorization and auditing logs. When initializing a service, pass the
  desired accountability. If no accountability is provided, the service will default to using administrator
  permissions - you should be careful about this since endpoints are always publicly accessible. Setting accountability
  to `null` will use public permissions. Permissions are checked against the permissions in the accountability object
  (which gets populated by Directus on successful authentication).

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
