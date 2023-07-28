---
description: A breakdown of the Directus platform architecture.
readTime: 2 min read
---

# Architecture

> Directus is a wrapper for both your database and file asset storage system.

At first glance, it may be tempting to think of Directus as an app-centric platform. But that's not the case. The app is
just a GUI powered by the API, which allows developers, business users, and data analysts equal access to data and asset
storage, all in one place.

Here's how the platform architecture breaks down.

![Directus Architecture Graphic](https://cdn.directus.io/docs/v9/getting-started/architecture/architecture-20220512/directus-architecture-20220512A.webp)

## The Database

Directus is plug-and-play. Once linked, it doesn't _own_ your data or file assets, but it does create about 20 new data
tables which are required for platform operation. These tables do not intermingle with the rest of your data, so you can
remove Directus without a trace. You also have the freedom to access the database with raw SQL queries, link up any
other service to your database, and access your file assets with CLI commands.

## Database Introspection

At the lowest layer, the platform introspects the database and abstracts away specific SQL details. Regardless of SQL
vendor you choose, the platform works seamlessly. Similarly, Directus syncs with your configured file storage service,
providing control over file assets.

## The Data Engine

The next layer contains logic to access, transmit, query, and transform data, including event triggers, data querying
operations, and file transformations _(like image cropping)_. After that, your data and assets get cached for efficient
user access.

## Access Control

Directus provides secure user access methods. Choose access token format and configure authentication as desired. You
can set SSO and allow login through Google, Facebook, etc.

## The API

Finally, a complete set of REST and GraphQL endpoints are generated dynamically, based on your data model as well as
your configured roles and associated access permissions.

The Directus JS-SDK is [available via NPM](https://www.npmjs.com/package/directus). You also have access to two
Command-Line Interfaces (CLI). One enables server-side actions relating to your on-prem instance, like migrating the
database or resetting a user. The other allows you to interact with a Directus instance as you would with an SDK.

## The Data Studio

The Directus Data Studio is a no-code dashboard that brings the whole team together.

- Build your data model and manage data, content, users, and file assets.
- Create roles and permissions for your users, with granular and conditional logic.
- Design flows for task automation and data processing with a low-code GUI.

## Open Source

Directus is 100% open-source, modular, and extensible, ensuring you will never hit a hard feature ceiling within the
platform. Built entirely in crispy clean Typescript, mostly on Node.js and Vue.js, you have the power to add or modify
_any feature_ with your own custom extensions. [:star: Star us on GitHub! :star:](https://github.com/directus/directus)

## Versioning

Directus follows a SemVer-like versioning structure, but it's important to note that it does not follow SemVer
precisely. For complex systems like Directus, SemVer doesn't really scale as any tweak to any part of the codebase could
be considered a breaking change for a fraction of use cases. We rely on an 80/20 approach to breaking changes: If the
change affects the vast majority of users, it's a major breaking change. Otherwise, we accept minor breaking changes as
part of the minor release cycle.

`xx.xx.xx` -> `major.minor.patch`

- **Major** — A "big deal" release: _big breaking changes, big features, big re-designs._
- **Minor** — A new feature or meaningful improvement to an existing feature: _may or may not be breaking._
- **Patch** — Bugfixes and tweaks that are backwards compatible: _but no new features._
