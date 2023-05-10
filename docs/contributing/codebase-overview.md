---
description:
  The core concepts behind Directus are simple, however the problems that must be solved to honor them can be remarkably
  complex. We strive to design and engineer the most elegant solutions possible, so that our codebase remains
  accessible.
readTime: 3 min read
---

# Codebase Overview

> **The core concepts behind Directus are simple, however the problems that must be solved to honor them can be
> remarkably complex.** We strive to design and engineer the most elegant solutions possible, so that our codebase
> remains accessible.

## Monorepo

The primary Directus repository is located at [`directus/directus`](https://github.com/directus/directus) and houses the
Admin App (Vue.js 3 w/ Composition API), API (Node.js), API Specification (OpenAPI), and other smaller packages used
internally. Directus follows a monorepo design similar to React or Babel — this page will outline our monorepo's design
and structure.

## The API (`/api`)

Contains the Directus API (REST+GraphQL), written in Node.js. The source code is located in `/api/src` and the below folders are inside there.

| Folder         | Content                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/cli`         | The CLI commands and matching functions that the `directus` package ships with.                                                                                                                 |
| `/controllers` | Route handler controllers for the endpoints in the API.                                                                                                                                         |
| `/database`    | Database manipulation abstraction, system migrations, and system data. Also where you'd find the main query runner.                                                                             |
| `/exceptions`  | Classes for the different errors the API is expected to throw. Used to set the HTTP status and error codes.                                                                                     |
| `/middleware`  | Various (express) routing middleware. Includes things like cache-checker, authenticator, etc.                                                                                                   |
| `/services`    | Internal services. The main abstraction for interfacing with the data in the database. Both GraphQL and REST requests are "translated" to use these services as the main logic in the platform. |
| `/types`       | TypeScript types that are shared between the different parts of the API.                                                                                                                        |
| `/utils`       | Various utility functions.                                                                                                                                                                      |

## The Data Studio App (`/app`)

Contains the Directus Data Studio App, written in Vue.js 3 w/ the Composition API.

| Folder    | Content                                                 |
| --------- | ------------------------------------------------------- |
| `/public` | Assets that are included with the app, but not bundled. |
| `/src`    | App source code.                                        |

The source code is located in `/api/src` and the below folders are inside there.

| Folder         | Content                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/assets`      | Files that are included within the app. Are bundled / optimized in the build step.                                                                           |
| `/components`  | (Base) components that are used across the platform. Contains "basic building blocks" like button, input, etc.                                               |
| `/composables` | Reusable parts of reactive logic that can be used between Vue components. Includes things reactively calculating time from now, fetching a single item, etc. |
| `/directives`  | Custom Vue directives (e.g. `v-tooltip`).                                                                                                                    |
| `/displays`    | Components to display of data within the app.                                                                                                                |
| `/interfaces`  | The core-included interfaces that allow editing and viewing individual pieces of data.                                                                       |
| `/lang`        | Translations abstraction, and language files. The language yaml files are maintained through [Crowdin](https://locales.directus.io).                         |
| `/layouts`     | The core-included layouts that change the way items are represented inside the collection view                                                               |
| `/modules`     | The core-included modules that structure major parts the app.                                                                                                |
| `/operations`  | Operations are steps in a flow                                                                                                                               |
| `/panels`      | Panels display data in the insight dashboards                                                                                                                |
| `/routes`      | The routes in the app. Modules define their own routes, so this only includes the "system" things that don't belong to module, like login.                   |
| `/stores`      | [Pinia](https://pinia.esm.dev) based stores used for global state tracking.                                                                                  |
| `/styles`      | All general styles, css-vars, mixins and themes are stored inside here. Every component has their own component styles, these are just the global styles.    |
| `/types`       | TypeScript types that are shared between the different parts of the App.                                                                                     |
| `/utils`       | Utility functions used in various parts of the app.                                                                                                          |
| `/views`       | The (two) main views used in the app: public / private. Also contains "internal" coupled components for those two views.                                     |

::: tip  Component Library

Directus comes shipped with it's own [Vue Component Library and Storybook]((https://components.directus.io)) that you can use to enrich your extensions or when developing locally.
These components can be used in any of the "app extensions", including Interfaces, Displays, Modules, Layouts, and Panels.

:::

## Additional Packages (`/packages`)

The various sub-packages of the platform. Including the file-storage adapters, schema, specs, etc.

| Folder                       | Package Name                                                                                                             | Description                                                  |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| `/composables`               | [@directus/composables](https://github.com/directus/directus/tree/main/packages/composables)                             | Shared Vue composables for Directus use                      |
| `/constants`                 | [@directus/constants](https://github.com/directus/directus/tree/main/packages/constants)                                 | Shared constants for Directus                                |
| `/create-directus-extension` | [create-directus-extension](https://github.com/directus/directus/tree/main/packages/create-directus-extension)           | A small util that will scaffold a Directus extension         |
| `/data-driver-postgres`      | [@directus/data-driver-postgres](https://github.com/directus/directus/tree/main/packages/data-driver-postgres)           | Data abstraction for Postgres                                |
| `/data`                      | [@directus/data](https://github.com/directus/directus/tree/main/packages/data)                                           | Data abstraction for Directus                                |
| `/exceptions`                | [@directus/exceptions](https://github.com/directus/directus/tree/main/packages/exceptions)                               | Shared exceptions in Directus                                |
| `/extensions-sdk`            | [@directus/extensions-sdk](https://github.com/directus/directus/tree/main/packages/extensions-sdk)                       | A toolkit to develop extensions to extend Directus           |
| `/pressure`                  | [@directus/pressure](https://github.com/directus/directus/tree/main/packages/pressure)                                   | Pressure based rate limiter                                  |
| `/random`                    | [@directus/random](https://github.com/directus/directus/tree/main/packages/random)                                       | Set of random-utilities for use in tests                     |
| `/schema`                    | [@directus/schema](https://github.com/directus/directus/tree/main/packages/schema)                                       | Utility for extracting information about the database schema |
| `/specs`                     | [@directus/specs](https://github.com/directus/directus/tree/main/packages/specs)                                         | OpenAPI Specification of the Directus API                    |
| `/storage-driver-azure`      | [@directus/storage-driver-azure](https://github.com/directus/directus/tree/main/packages/storage-driver-azure)           | Azure file storage abstraction for `@directus/storage`       |
| `/storage-driver-cloudinary` | [@directus/storage-driver-cloudinary](https://github.com/directus/directus/tree/main/packages/storage-driver-cloudinary) | Cloudinary file storage abstraction for `@directus/storage`  |
| `/storage-driver-gcs`        | [@directus/storage-driver-gcs](https://github.com/directus/directus/tree/main/packages/storage-driver-gcs)               | GCS file storage abstraction for `@directus/storage`         |
| `/storage-driver-local`      | [@directus/storage-driver-local](https://github.com/directus/directus/tree/main/packages/storage-driver-local)           | Local file storage abstraction for `@directus/storage`       |
| `/storage-driver-s3`         | [@directus/storage-driver-s3](https://github.com/directus/directus/tree/main/packages/storage-driver-s3)                 | S3 file storage abstraction for `@directus/storage`          |
| `/storage`                   | [@directus/storage](https://github.com/directus/directus/tree/main/packages/storage)                                     | Object storage abstraction layer for Directus                |
| `/types`                     | [@directus/types](https://github.com/directus/directus/tree/main/packages/types)                                         | Shared types for Directus                                    |
| `/update-check`              | [@directus/update-check](https://github.com/directus/directus/tree/main/packages/update-check)                           | Check if an update is available for a given package          |
| `/utils`                     | [@directus/utils](https://github.com/directus/directus/tree/main/packages/utils)                                         | Utilities shared between the Directus packages               |

## Tests (`/tests`)

Tests are maintained on a per-package base. This folder contains the platform-wide (end-to-end) tests like [Blackbox](https://github.com/directus/directus/tree/main/tests/blackbox).
