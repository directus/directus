# Getting Started

> These Docs will help you get up-and-running quickly, guide you through advanced features, and explain the core
> concepts that make Directus so unique.

## What is Directus?

**Directus is an Open Data Platform built to democratize the database.** Its no-code app is safe and intuitive enough to
make data accessible to everyone, while still providing the granular configuration and technical tools required by
power-users and data scientists. For developers, a data connection toolkit provides a dynamic REST+GraphQL API,
JavaScript SDK, and options for authorization, caching, and more.

Written entirely in JavaScript (primarily [Node.js](https://nodejs.dev) and [Vue.js](https://vuejs.org)), Directus is
completely open-source, modular, and extensible, allowing it to be fully tailored to the requirements of any project.
Below are the key features of the platform:

- **No-Code App for anyone to manage data**
- **Data Connection Toolkit with REST & GraphQL**
- **Supports Any SQL Database**
- **Authorization & Caching**
- **Completely Free & Open Source**

::: tip What's in a name?

"Directus" ([duh REKT iss](http://audio.pronouncekiwi.com/Salli/Directus)) is Latin for: _laid straight, arranged in
lines_. The broadest goal of our platform is to present data in a simple, orderly, and intuitive way.

:::

## Use Cases

As flexible as the database itself, Directus can power any data-driven project. Below are some examples of common ways
the platform is used:

- **Headless CMS** — Whether you’re building on JAMstack, server-side (SSR), static websites (SSG), etc — Open Data
  Platforms offer a modern and flexible way to manage every omnichannel digital experience.
- **Apps, Games & IoT** — A powerful data backbone for any software or smart device, including: native or hybrid apps,
  VR/AR, customer kiosks, installations, microcontrollers, digital signage, and even smart appliances.
- **No-Code App Builder** — Ditch the spreadsheet. Now anyone can create beautiful custom apps for managing customers,
  projects, inventory, knowledgebases, task lists, marketing, or anything else... all with zero code.
- **Back-Office & BI Tools** — Gain insights into company KPIs and enable no-code exploration of business data. Coalesce
  previously siloed department data to give your team meaningful and actionable analytics.
- **Digital Asset Management** — Aggregate all of your digital files in one place for improved organization,
  searchability, delivery, and integration with other datasets, all while enabling on-the-fly file transformations.
- **Raw Data Visualization** — Establish a “single source of truth” for all of your disparate data while enabling
  non-technical users to build custom dashboards that generate meaningful insights from complex datasets.

## Core Principles

Directus is a simple solution for complex problems, with a data-first approach guided by the following core principles:

- **Pure** — No predefined or proprietary schema, with all system metadata stored separately
- **Open** — Public and transparent codebase with no obfuscated or cloud-only code
- **Portable** — Database can be exported or migrated at any time with no vendor lock-in
- **Limitless** — No artificial limitations or paywalls on users, roles, languages, collections, or items
- **Extensible** — Every aspect of the platform is modular to avoid any hard feature ceilings
- **Unopinionated** — Choose your stack, database, and architecture; self-hosted or on cloud

## Database Mirroring

**Directus is installed as a _layer_ on top of your new or existing SQL database, with its App and API dynamically
“mirroring” your actual schema and content in real-time.** This approach is similar to how technical database clients
(like _phpMyAdmin_) work, however Directus provides an experience that is safe, intuitive, and powerful enough for
anyone... even the most non-technical users.

To keep things simple, Directus uses friendlier names for database terms, including
[Project](/getting-started/glossary/#projects) (database), [Collection](/getting-started/glossary/#collections) (table),
[Field](/getting-started/glossary/#fields) (column), [Item](/getting-started/glossary/#items) (record), and
[Type](/getting-started/glossary/#types) (datatype).

Database mirroring has many unique advantages:

- Control over your pure SQL database schema, tailored to your exact requirements
- Significant performance improvements through optimizations and indexing
- Complete transparency, portability, and security for your data
- Direct database access and the full power of raw/complex SQL queries
- Allows importing existing databases, unaltered and without any migrations

Other platforms typically use a predefined or proprietary “one-size-fits-all” data model to store your content (have you
ever peeked behind the curtain of a WordPress installation? Yikes!). That is not the case with Directus. Directus gives
you direct access to your pure and unaltered data. That means you have the option to bypass the Directus middleware
(API, SDK, App) and connect to your data with proper SQL queries. This effectively removes all bottlenecks, latency
overhead, and proprietary access limitations.

## Modular & Extensible

What makes Directus so flexible is that it has been designed from the ground up with complete extensibility, helping
avoid a feature ceiling. In addition to offering our software's codebase as open-source, we've included the following
extension types in the platform's App and API.

- **[API Endpoints](/extensions/api-endpoints/)** — Custom registered API endpoints
- **[Displays](/extensions/displays/)** — A small inline preview of a field's value
- **[Email Templates](/extensions/email-templates/)** — Custom structure and formatting for emails
- **[Hooks](/extensions/hooks/)** — Event and interval hooks for triggering custom logic
- **[Interfaces](/extensions/interfaces/)** — How you view or interact with a field and its value
- **[Layouts](/extensions/layouts/)** — How you browse, view or interact with a set of Items in a Collection
- **[Migrations](/extensions/migrations/)** — Custom migrations for tracking project schema and content updates
- **[Modules](/extensions/modules/)** — The highest and broadest level of organization within the App
- **[Panels](/extensions/panels/)** — A way to view dashboard data within the Insights Module
- **[Themes](/extensions/themes/)** — Whitelabeling through App Themes and CSS Overrides

## The Directus Ecosystem

- **[GitHub](https://github.com/directus/directus)** — The open-source repository and version control
- **[NPM Package](https://www.npmjs.com/package/directus)** — The official Directus node package
- **[Docker Image](https://hub.docker.com/r/directus/directus)** — The official Directus docker image
- **[Documentation](https://docs.directus.io)** — Docs for the most recent version of our platform
- **[On-Demand Cloud](https://directus.cloud)** — Our self-service managed solution (multitenant)
- **[Enterprise Cloud](https://directus.cloud)** — Our tailored managed solution (single tenant)
- **[Cloud Documentation](https://directus.cloud/docs)** — Docs for the managed cloud dashboard
- **[Private Demos](https://directus.cloud/docs#creating-a-private-demo)** — Instructions on creating a free cloud demo
- **[System Status](https://status.directus.cloud)** — Up-to-date information on our various cloud systems
- **[Website](https://directus.io)** — General information, resources, and team info
- **[Twitter](https://twitter.com/directus)** — The latest product info and sneak-peeks
- **[Videos](https://www.youtube.com/c/DirectusVideos)** — Our YouTube channel with video tutorials and feature
  overviews
- **[Discord](https://directus.chat)** — A growing community of 4K+ developers
- **[Crowdin](https://locales.directus.io/)** — Service for managing the App's many language translations
- **[Marketplace](https://directus.market/)** — Coming in 2021, will offer a unified portal for platform extensions
- **[Awesome List](https://github.com/directus-community/awesome-directus)** — A list of awesome things related to
  Directus
