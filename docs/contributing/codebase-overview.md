# Codebase Overview

> **The core concepts behind Directus are simple, however the problems that must be solved to honor them can be
> remarkably complex.** We strive to design and engineer the most elegant solutions possible, so that our codebase
> remains accessible.

## Monorepo

The primary Directus repository is located at [`directus/directus`](https://github.com/directus/directus) and houses the
Admin App (Vue.js 2 w/ Composition API), API (Node.js), project documentation (Markdown), API Specification (OpenAPI),
and other smaller packages used internally. Directus follows a monorepo design similar to React or Babel — this page
will outline our monorepo's design and structure.

## `/api`

Contains the Directus API (REST+GraphQL), written in Node.js.

#### `/api/src/cli`

The CLI commands and matching functions that the `directus` package ships with.

#### `/api/src/controllers`

Route handler controllers for the endpoints in the API.

#### `/api/src/database`

Database manipulation abstraction, system migrations, and system data. Also where you'd find the main query runner.

#### `/api/src/exceptions`

Classes for the different errors the API is expected to throw. Used to set the HTTP status and error codes.

#### `/api/src/mail`

Mail abstraction. Allows Directus to send emails. (Note: this is planned to be moved into a MailService. See below)

#### `/api/src/middleware`

Various (express) routing middleware. Includes things like cache-checker, authenticator, etc.

#### `/api/src/services`

Internal services. The main abstraction for interfacing with the data in the database. Both GraphQL and REST requests
are "translated" to use these services as the main logic in the platform.

#### `/api/src/types`

TypeScript types that are shared between the different parts of the API.

#### `/api/src/utils`

Utility functions

## `/app`

Contains the Directus Admin App, written in Vue.js 2 w/ the Composition API.

## `/app/public`

Assets that are included with the app, but not bundled.

#### `/app/src/assets`

Files that are included within the app. Are bundled / optimized in the build step.

#### `/app/src/components`

(Base) components that are used across the platform. Contains "basic building blocks" like button, input, etc.

#### `/app/src/composables`

Reusable parts of reactive logic that can be used between Vue components. Includes things reactively calculating time
from now, fetching a single item, etc.

#### `/app/src/directives`

Custom Vue directives (e.g. `v-tooltip`)

#### `/app/src/interfaces`

The core-included interfaces.

#### `/app/src/lang`

Translations abstraction, and language files. The language yaml files are maintained through
[Crowdin](https://locales.directus.io)

#### `/app/src/layouts`

The core-included layouts.

#### `/app/src/modules`

The core-included modules.

#### `/app/src/routes`

The routes in the app. Modules define their own routes, so this only includes the "system" things that don't belong to
module, like login.

#### `/app/src/stores`

[Pinia](https://pinia.esm.dev) based stores used for global state tracking.

#### `/app/src/styles`

Global styles in the app. Every component has their own component styles, these are just the global styles.

#### `/app/src/types`

TypeScript types that are shared between the different parts of the API.

#### `/app/src/utils`

Utility functions used in various parts of the app.

#### `/app/src/views`

The (two) main views used in the app: public / private. Also contains "internal" coupled components for those two views.

## `/docs`

Contains all the platform's documentation, written in markdown with additional VuePress formatting.

## `/packages`

The various sub-packages of the platform. Including the SDK, the file-storage adapters, title formatter, etc.

## `/tests`

Tests are maintained on a per-package base. This folder contains the platform-wide (end-to-end) tests.
