---
description: Learn about the Services in Directus and how to utilize them when building extensions.
contributors: Esther Agbaje
---

# Utilizing Services in Extensions

Directus exposes a "**Services**" feature that allows developers to access and communicate with external endpoints when
developing extensions. They provide a way to extend the Directus API functionality programmatically, making it easier to
work with Directus and perform CRUD operations on data.

## Understanding Services

Services are designed to map directly to the REST and GraphQL endpoints, providing a seamless integration to extend the
core functionalities for your specific development needs.

They provide a number of advantages over using the APIs directly, including:

- **Seamless Integration:** Since services map directly to the REST and GraphQL APIs under the hood, developers can
  easily integrate Directus functionality when developing extensions.

- **Unified Data Access:** Most services extend the base `ItemsService`, providing a consistent approach to CRUD
  operations on all Directus data types. This unified interface keeps code clean and predictable.

## Available Services

Various services are available within Directus, such as `ItemsService`, `UserService`, `RolesService`, and others. The
majority of these services extend the `ItemsService`, providing a unified approach to manipulating data. However, there
are also standalone services.

::: tip List of Available Services

Directus provides a number of built-in services. Check out the full list
[here](https://github.com/directus/directus/tree/bbefc62ef4727edb0b25eaafb6bb44273f79f834/api/src/services).

:::
