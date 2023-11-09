---
description: Learn about the Services in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Using Services in API Extensions

Directus exposes its internal services to enable API extensions communicate between your Directus instance and any
external service.

Using services helps to achieve a unified interface for your data in a way that is consistent, clean and predictable.

Services are designed to map directly to the REST and GraphQL endpoints, providing a seamless integration to extend the
core functionalities for your specific development needs.

## Available Services

Various services are available within Directus, such as `ItemsService`, `CollectionService`, `FilesService`, and others.

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
passwords are only hashed when used with `UsersService` and not `ItemsService`.

::: tip List of Available Services

Directus provides a number of built-in services. Refer to the full list
[here](https://github.com/directus/directus/tree/bbefc62ef4727edb0b25eaafb6bb44273f79f834/api/src/services).

:::
