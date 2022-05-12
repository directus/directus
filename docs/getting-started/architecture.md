# Architecture

**The Directus platform is a wrapper for your database and file asset storage system.**

At first glance, it may be tempting to think of Directus as an app-centric platform. But that's not the case. The app is
just a GUI powered by the API. This app allows developers, business users, and analysts equal access to data and asset
storage, all in one environment.

Here's how the platform architecture breaks down.

![Directus Architecture Graphic]()

At the lowest layer, the platform introspects the database and abstracts away specific SQL details- so no matter what
SQL vendor, the platform works seamlessly. Similarly, Directus syncs with your configured file storage service,
providing control over your file assets.

The next layer contains logic to access, transmit, query, and transform data, including event triggers, webhooks, data
query operations, and file transformations _(like image cropping)_. After that, the data and assets get cached for user
access.

Directus provides secure user access methods. You have the freedom to choose access token format and configure
authentication as desired. You can set SSO and allow login through Google, Facebook, etc.

Finally, a complete set of REST and GraphQL endpoints are generated dynamically, based on your data model, configured
roles, and permissions. The full Directus SDK is on NPM. You also have access to two Command-Line Interfaces (CLI). One
enables server-side actions relating to your on-prem instance, like migrating the database or resetting a user. The
other allows you to interact with a Directus instance as you would with an SDK.

Directus is 100% open-source, modular, and extensible, ensuring you will never hit a hard feature ceiling within the
platform. Built entirely in crispy clean Typescript, mostly on Node.js and Vue.js, you have to power to add or modify
_any feature_ with your own custom extensions.
