# Directus Docs

> These Docs will help you get up-and-running quickly, guide you through advanced features, and explain the core
> concepts that make Directus so unique.

::: tip Version 9

This is the documentation for the new **[Directus 9](https://github.com/directus/directus)** platform written in
Node.js. If you are looking for the previous **[Directus 8](https://github.com/directus/v8-archive/releases/latest)**
(PHP) docs, you can find them [here](https://v8.docs.directus.io).

:::

## What is Directus?

**Directus is an Open Data Platform for managing the content of any SQL database. It provides a powerful API layer for
developers and an intuitive App for non-technical users.** Written entirely in JavaScript (primarily
[Node.js](https://nodejs.dev) and [Vue.js](https://vuejs.org)), Directus is completely open-source, modular, and
extensible, allowing it to be fully tailored to your exact project needs.

Our platform can be used as a headless CMS for managing digital experiences, a database client for democratizing data,
or as a standalone back-office web app for CRM, inventory, business intelligence, project management, etc.

::: tip What's in a name?

"Directus" ([duh REKT iss](http://audio.pronouncekiwi.com/Salli/Directus)) is Latin for: _laid straight, arranged in
lines_. The broadest goal of our platform is to present data in a simple, orderly, and intuitive way.

:::

## What makes it unique?

**Directus dynamically generates custom API endpoints based on your SQL database's schema in real-time — something we
call "Database Mirroring".** Whether you install fresh or on top of an existing database, you always maintain end-to-end
control over your actual database, including: tables, columns, datatypes, default values, indexes, relationships, etc.

Perhaps one of the biggest advantages of _Database Mirroring_ is that you have direct access to your pure and unaltered
data. That means you have the option to bypass the Directus middleware (API, SDK, App) and connect to your data with
proper SQL queries. This effectively removes all bottlenecks, latency overhead, and proprietary access limitations.

Directus is a simple solution for complex problems, with a data-first approach guided by the following core principles:

- **Pure** — There is no predefined model or proprietary rules for your schema, and all system settings are stored
  separately.
- **Open** — Our entire codebase is public and transparent, allowing for end-to-end audits. Nothing is obfuscated or
  black-boxed.
- **Portable** — Data is stored in your bespoke database and can be migrated/exported/backed-up at any time. Absolutely
  no vendor lock-in.
- **Limitless** — Create unlimited users, roles, languages, collections, and items. No arbitrary restrictions or paywall
  limitations.
- **Extensible** — Every aspect of the platform is modular, allowing you to adapt, customize, and infinitely extend the
  Core engine.
- **Unopinionated** — Choose your database (all SQL vendors), API (REST or GraphQL), and infra (self-hosted or Cloud).

## The Directus Ecosystem

### Open-Source Core

Our completely free and open-source (GPLv3) Open Data Platform. Directus includes our dynamic API engine (Node.js), the
intuitive Admin App (Vue.js), this documentation (Markdown), and all dependencies.

- **[GitHub Repository](https://github.com/directus/directus)**
- **[npm Package](https://www.npmjs.com/package/directus)**
- **[Docker Image](https://hub.docker.com/r/directus/directus)**

### Documentation

[Our documentation](https://docs.directus.io) describes the most recent version of our platform. They are written in
publicly managed markdown files so the community can help keep them clean and up-to-date. The docs are divided into the
following sections:

- [Getting Started](/getting-started/introduction/) — Novice oriented, for a platform intro and installation.
- [Concepts](/concepts/activity/) — Learning oriented, for understanding the platform.
- [Guides](/guides/projects/) — Problem oriented, follow along with steps while working.
- [Reference](/reference/command-line-interface/) — Information oriented, look up info and specs while working.
- [API Reference](/reference/api/introduction/) — Information oriented, look up API resources while working.
- [Contributing](/contributing/introduction/) — Contributor oriented — resources for working on Open-Source Core.

::: tip Versioned Docs

Specific version of the Docs ship with each install of Directus 9. They can be found within the
[Documentation module](/concepts/application#documentation) of the App.

:::

### On-Demand Cloud

[Our self-service platform](https://directus.cloud) for quick and affordable instances of Directus on a multitenant
infrastructure. Each project includes automatic updates, automatic backups, .

### Enterprise Cloud

Our premium managed solution. Powered by dedicated hardware in your selected region, this service offers
high-availability, custom limits, SSO, API white-labeling, uptime SLAs, and more.
[Contact our sales team](https://directus.io/contact/) to discuss pricing and options.

### Cloud Documentation

[Cloud-Specific Docs](https://directus.cloud/docs) include guides for managing projects within our Cloud Dashboard.

### Private Demos

Our On-Demand Cloud platform includes ability to
[create private demo instances](https://directus.cloud/docs#creating-a-private-demo). Each demo runs the latest version
of Directus, lasts for several hours, and is completely free, with no credit card required.

### System Status

The [Status Page](https://status.directus.cloud) provides up-to-date information on our various systems, including
current and historical incident details and our 30-day uptime percentage. From this site you can access the global
status or your Cloud project's dedicated status page.

### Website

Our [marketing site](https://directus.io) provides general information, resources, and team info for the project.

### Social

For the latest product info and sneak-peeks, be sure to follow us on [Twitter](https://twitter.com/directus).

### Videos

Our [YouTube Channel](https://www.youtube.com/c/DirectusVideos) has video tutorials, release updates, feature overviews,
and more.

### Community

Join our growing community of 4,000+ developers on [Discord](https://directus.chat) and Slack (legacy). From community
support to seeing where the platform is heading next, it's a great way to get involved.

### App Locales

We use [Crowdin](https://locales.directus.io/) to manage our numerous App translations. If you're looking to add or
improve Directus in your language, you can [learn more here](/contributing/translations/).

### Marketplace

Coming in 2021, the [Directus Marketplace](https://directus.market/) will offer a unified portal to extensions created
by our Core Team and community contributors.
