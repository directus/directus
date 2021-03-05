# Codebase Overview

> **The core concepts behind Directus are simple, however the problems that must be solved to honor them can be
> remarkably complex.** We strive to design and engineer the most elegant solutions possible, so that our codebase
> remains accessible.

## Node Monorepo

The primary Directus repository is located at [`directus/directus`](https://github.com/directus/directus) and houses the
Admin App (Vue.js 2 w/ Composition API), API (Node.js), project documentation (Markdown), API Specification (OpenAPI),
and other smaller packages used internally. Directus follows a monorepo design similar to React or Babel — this page
will outline our monorepo's design and structure.

## `/api`

Contains the Directus API (REST+GraphQL), written in node.js.

#### `/api/dist` — Does this look OK as a heading? Or should it be a description.

#### `/api/extensions`

#### `/api/src`

#### `/api/uploads`

## `/app`

Contains the Directus Admin App, written in Vue.js 3.

## `/docs`

Contains all the platform's documentation, written in markdown with additional VuePress formatting.

## `/packages`

TK

## `/`

The root of the project contains the following noteworthy files.

- **`.editorconfig`** — TK
- **`code_of_conduct.md`** — TK
