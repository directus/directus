# 🐰 Welcome to the Directus Docs!

> These Docs will help get you up-and-running quickly, guide you through advanced features, and explain the concepts that make Directus so unique.

## What is Directus?

**Directus is an open-source platform that provides a real-time API and intuitive Admin App for your custom database.** Built on node.js and vue.js 3, it allows both administrators and non-technical users to view and manage the content/data stored within pure SQL databases. It can be used as a headless CMS for managing project content, a database client for modeling and viewing raw data, or as a standalone customizable WebApp.

::: What's in a name?
Directus ([duh REKT iss](http://audio.pronouncekiwi.com/Salli/Directus)) is latin for: _laid straight, arranged in lines_. The broadest goal of Directus is to present data in a simple, orderly, and intuitive way.
:::

## What makes it unique?

**Directus dynamically generates custom API endpoints based on your SQL database's custom schema in real-time — something we call "Database Mirroring".** Whether you install fresh or on top of an existing database, you always maintain complete control over your actual database... including tables, columns, datatypes, default values, indexes, relationships, etc.

Perhaps one of the biggest advantages of _Database Mirroring_ is that you have direct access to your pure and unaltered data. That means you can even bypass the Directus middleware (API, SDK, App), and connect to your data with proper SQL queries — effectively removing all bottlenecks, additional latency, or proprietary access limitations.

Directus is a simple solution for complex problems. Every aspect of Directus is data-first and guided by the following core principles:

* **Pure** — There is no predefined model or proprietary rules for your agnostic schema, and all system settings are stored separately.
* **Open** — Our entire codebase is public and transparent, allowing for end-to-end audits. Nothing is obfuscated or black-boxed.
* **Portable** — Data is stored in your bespoke database and can be migrated/exported/backed-up at any time. Absolutely no vendor lock-in.
* **Limitless** — Create unlimited users, roles, languages, collections, and items. No arbitrary restrictions or paywall limitations.
* **Extensible** — Every aspect of the platform is modular, allowing you to adapt, customize, and infinitely extend the Core engine.
* **Unopinionated** — Choose your stack (node or PHP), database (all SQL vendors), API (REST or GraphQL), and infra (self-hosted or Cloud).

## The Directus Ecosystem

### Open-Source Engine

Completely free and open-source on the GPLv3 license, Directus is publically available within our [npm package](https://www.npmjs.com/package/directus) and main [GitHub repository](https://github.com/directus/directus). It includes our dynamic API engine (node.js), the intuitive Admin App (vue.js 3), this documentation (markdown), and all dependencies.

### On-Demand Cloud

Our self-service platform for quick and affordable instances of Directus on a multitenant infrastructure.

### Enterprise Cloud

Dedicated hardware, custom limits, full white-labeling, uptime SLAs, and more are available on this premium managed solution.

### Documentation

[Our online documentation](#) describes the most version of our platform. They are written in publicly managed markdown files so the community can help keep them clean and up-to-date!

* Getting Started: Novice Oriented. For a platform intro and installation.
* Concepts: Learning Oriented. For understanding the platfom.
* Guides: Problem Oriented. Follow along with steps while working.
* Reference: Information Oriented. Look up info and specs while working.

::: Versioned Docs
Docs for specific versions of Directus 9+ are available within the individual Project's App Documentation module.
:::

### Online Demo

[Our online demo](https://demo.directus.io) (`admin@example.com` + `password`) is a quick way to try things out in an isolated sandbox. This entire instance resets each hour.

### System Status

The [Status Page](https://status.directus.io) provides up-to-date information on our various systems, including current and historical incident details and our 30-day uptime percentage.

### Marketing Website

Our [marketing site](https://directus.io) provides general information, resources, and team info for the project.

### Blog

Long-form updates, major release details, and strategic organization information.

### Social

For the latest product info and sneak-peeks into upcoming releases, be sure to follow us on [Twitter](https://twitter.com/directus).

### Community

Join our growing community of 2,600+ developers on [Discord](https://discord.gg/directus) and [Slack](https://directus.chat). From community support to seeing where the platform is heading next, it's a great way to get more involved.

### Languages

In addition to managing multilingual content, the Directus Admin App itself can also be translated into different languages. Our languages are managed through the [Directus CrowdIn](https://locales.directus.io/), which provides a friendly interface and automatically submits pull-requests to the git repository.

### Marketplace

Coming soon. A library of free and paid Directus extensions created by our core team and community members.
