# Getting Started

> These Docs will help you get up-and-running quickly, guide you through advanced features, and explain the core
> concepts that make Directus so unique.

## What is Directus?

<!--@TODO
getting-started > introduction
Add 2-4 min Promo Video When Ready
-->

::: tip Directus

Directus ([duh REKT iss](http://audio.pronouncekiwi.com/Salli/Directus)) is Latin for: _laid straight, arranged in
lines_.\
The broadest goal of our platform is to present data in a simple, orderly, and intuitive way.

:::

**Directus is an Open Data Platform built to democratize the database.** The platform can manage any content or data
model, in any SQL database. Its intuitive no-code app and APIs serve as a wrapper over your database, providing
complete, exhaustive control over your data. Directus does this using a technique called
[Database Introspection](#database-introspection), which identifies your full database structure, then provides users
full power to create, read, update and delete data via the App, REST API, or GraphQL API. Anything the App can do can
also be done via the REST or GraphQL APIs and vice-versa. Since it wraps the database, you can link Directus or remove
it at any time, without any impact on your existing data or data models.

The App comes with several [Modules](/getting-started/glossary/#modules):

- [Content Module]() — Provides total content management.
- [File Library]() — A full digital asset management system.
- [User Directory]() — Create, view and manage all Users.
- [Insights]() — Build drag-and-drop analytics dashboards.
- [Settings]() — A special module for admin Users.
  - **Project Settings** — Whitelabel the app, add custom CSS, and more. Make it yours.
  - **Data Model** — Fully build and manage your data model.
  - **Roles & Permissions** — Create any number of Roles. Assign granular permissions.
  - **Presets and Bookmarks** — Save custom arrangements for the app and content.
  - **Translation Strings** —
  - **Webhooks** — Create conditional webhooks to third party services.

:::tip Ready to dive-in?

Get a Project running in minutes. Learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

<!--
:::tip Cloud Extensions

Aside from these core modules, new features are constantly shipping. Learn more about [Cloud Extensions](/cloud/glossary/extensions).

:::
-->

## App vs API

The no-code app is safe and intuitive enough to make data accessible to everyone, while still providing the granular
configuration and technical tools required by power-users and data scientists. This provides an app experience that is
safe, intuitive, and powerful enough for anyone... even the most non-technical users.

For developers, a data connection toolkit provides a dynamic REST+GraphQL API, JavaScript SDK, and options for
authorization, caching, and more. Built entirely in Typescript (primarily on [Node.js](https://nodejs.dev) and
[Vue.js](https://vuejs.org)), Directus is completely open-source, modular, and extensible, allowing it to be fully
tailored to the requirements of any project.

:::tip

That said, Directus provides equal access to data for no-code and in order keep things simpler _(especially for the
no-code users)_, Directus uses friendlier names for many database terms and technical concepts, including
[Project](/getting-started/glossary/#projects) (database), [Collection](/getting-started/glossary/#collections) (table),
[Field](/getting-started/glossary/#fields) (column), [Item](/getting-started/glossary/#items) (record), and
[Type](/getting-started/glossary/#types) (datatype).

<!--
@TODO getting-started > learn-directus
To get more information, see the guide on [How to Learn Directus](/getting-started/learn-directus).
-->

:::

## Database Introspection

**Directus is installed as a _layer_ on top of your new or existing SQL database, with its App and API dynamically
“mirroring” your actual schema and content in real-time.** This is similar to how technical database clients (like
_phpMyAdmin_) work.

<!--
@TODO
getting-started > How to Learn Directus
Add a link to a place that expands on all these terms and describes the whole system as an overview
-->

Database introspection has many unique advantages:

- Control over your pure SQL database schema, tailored to your exact requirements.
- Significant performance improvements through optimizations and indexing.
- Complete transparency, portability, and security for your data.
- Direct database access and the full power of raw/complex SQL queries.
- Allows importing existing databases, unaltered and without any migrations.

Other platforms typically use a predefined or proprietary “one-size-fits-all” data model to store your content (have you
ever peeked behind the curtain of a WordPress installation? Yikes!). That is not the case with Directus. Directus gives
you direct access to your pure and unaltered data. That means you have the option to bypass the Directus middleware
(API, SDK, App) and connect to your data with proper SQL queries. This effectively removes all bottlenecks, latency
overhead, and proprietary access limitations.

:::tip Ready to try the API?

Get a Project running in minutes. Learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

## Use Cases

Directus is as flexible as the database itself and can power any data-driven project. Below a few common ways the
platform is used:

- **Backend as a Service**\
  An end-to-end data solution for efficiently connecting data and building APIs for projects that scale. Completely detached
  from the database, you're free to add or remove Directus from the database at any stage with no issue.
- **Headless CMS**\
  A modern and flexible way to manage every omnichannel digital experience. Manage content for all your websites, apps, kiosks,
  digital signage, and other omnichannel digital experiences. Complete file asset storage offers improved organization, searchability,
  delivery, and integration with other datasets, all with on-the-fly file transformations.
- **Internal Tool Builder**\
  Ditch the spreadsheet and quickly build back-office apps and admin panels for customers, inventory, projects, and all your
  business data. Anyone can create beautiful custom apps for managing customers, projects, inventory, knowledgebases, task
  lists, marketing, or anything else... all with zero code.
- **Data Management and Analytics**\
  Gain insights into company KPIs and enable no-code exploration of business data. Coalesce previously siloed department
  data to give your team meaningful and actionable analytics. Establish a “single source of truth” for all of your disparate
  data while enabling non-technical users to build custom dashboards that generate meaningful insights from complex datasets.

:::tip Ready to dive-in?

Get a Project running in minutes. Learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

## Core Principles

Directus is a simple solution for complex problems, with a data-first approach guided by the following core principles:

- **Pure** — No predefined or proprietary schema, with all system metadata stored separately.
- **Open** — Directus Core is public and open source, with no obfuscated or cloud-only code.
- **Portable** — Database can be exported or migrated at any time with no vendor lock-in.
- **Limitless** — No artificial limits or paywalls on users, roles, languages,
  [Collections](/getting-started/collections), or [Items](getting-started/glossary/items).
- **Extensible** — Every aspect of the platform is modular to avoid any hard feature ceilings.
- **Unopinionated** — Choose your stack, database, and architecture.

:::tip Ready to dive-in?

Get a Project running in minutes and see how Directus works in the [Quickstart Guide](/getting-started/quickstart/).

:::

## Modular & Extensible

What makes Directus so flexible is that it has been designed from the ground up with complete extensibility, helping
avoid a feature ceiling. In addition to offering our software's codebase as open-source, we've included the following
extension types in the platform's App and API.

- **[Displays](/extensions/displays/)** — A small inline preview of a field's value
- **[Email Templates](/extensions/email-templates/)** — Custom structure and formatting for emails
- **[Endpoints](/extensions/endpoints/)** — Custom registered API endpoints
- **[Hooks](/extensions/hooks/)** — Event and interval hooks for triggering custom logic
- **[Interfaces](/extensions/interfaces/)** — How you view or interact with a field and its value
- **[Layouts](/extensions/layouts/)** — How you browse, view or interact with a set of Items in a Collection
- **[Migrations](/extensions/migrations/)** — Custom migrations for tracking project schema and content updates
- **[Modules](/extensions/modules/)** — The highest and broadest level of organization within the App
- **[Panels](/extensions/panels/)** — A way to view dashboard data within the Insights Module
- **[Themes](/extensions/themes/)** — Whitelabeling through App Themes and Custom CSS

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
