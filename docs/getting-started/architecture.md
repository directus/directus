# Architecture

**Directus is a wrapper for both your database and file asset storage system.**

At first glance, it may be tempting to think of Directus as an app-centric platform. But that's not the case. The app is
just a GUI powered by the API, which allows developers, business users, and data analysts equal access to data and asset
storage, all in one place.

Here's how the platform architecture breaks down.

![Directus Architecture Graphic](https://cdn.directus.io/docs/v9/getting-started/architecture/architecture-20220512/directus-architecture-20220512A.webp)

Directus is plug-and-play. Once linked, it does't _own_ your data or file assets, but it does create about 10-20 data
tables needed for platform operation. These tables do not intermingle with the rest of your data, so you can remove
Directus without a trace. You also have the freedom to access the database with raw SQL queries and access your file
assets with CLI commands.

At the lowest layer, the platform introspects the database and abstracts away specific SQL details- so no matter what
SQL vendor you choose, the platform works seamlessly. Similarly, Directus syncs with your configured file storage
service, providing control over your file assets.

The next layer contains logic to access, transmit, query, and transform data, including event triggers, webhooks, data
query operations, and file transformations _(like image cropping)_. After that, data and assets get cached for efficient
user access.

Directus provides secure user access methods. Choose access token format and configure authentication as desired. You
can set SSO and allow login through Google, Facebook, etc.

Finally, a complete set of REST and GraphQL endpoints are generated dynamically, based on your data model as well as
your configured roles and their associated access permissions.

The Directus SDK is [available via NPM.](https://www.npmjs.com/package/directus) You also have access to two
Command-Line Interfaces (CLI). One enables server-side actions relating to your on-prem instance, like migrating the
database or resetting a user. The other allows you to interact with a Directus instance as you would with an SDK.

Directus is 100% open-source, modular, and extensible, ensuring you will never hit a hard feature ceiling within the
platform. Built entirely in crispy clean Typescript, mostly on Node.js and Vue.js, you have to power to add or modify
_any feature_ with your own custom extensions.
