# Introduction

> These Docs will help you get Directus up-and-running quickly, guide you through advanced features, and explain the
> core concepts that make Directus so unique.

[[toc]]

## What is Directus?

<!--
@TODO
getting-started > introduction
Add 2-4 min Promo Video When Ready
-->

::: tip Directus

Directus ([duh REKT iss](http://audio.pronouncekiwi.com/Salli/Directus)) is Latin for: _laid straight, arranged in
lines_.\
The broadest goal of our platform is to present data in a simple, orderly, and intuitive way.

:::

**Directus is an Open Data Platform built to democratize the database.**

This platform can manage any content, data, or data model, in any SQL database. It works as a layer over your database
and comes with an intuitive [no-code app as well as APIs](#app-vs-api) which provide complete, exhaustive control over
your data. Directus does this using a technique called [Database Introspection](#database-introspection), which
identifies your full database structure, then provides full power to create, read, update and delete data from the App,
the REST API, or the GraphQL API. Since Directus simply wraps the database, you can link it or remove it at any time,
with zero impact on your data or data models.

The App comes with several [Modules](/getting-started/glossary/#modules):

- [Content Module]() — Provides total content management.
- [File Library]() — A full digital asset management system.
- [User Directory]() — Create, view and manage all Users.
- [Insights]() — Drag and drop analytics dashboards.
- [Settings]() — A special module for admin Users containing:
  - **Project Settings** — Whitelabel the app, add custom CSS, and more. Make it yours.
  - **Data Model** — Fully build and manage your data model.
  - **Roles & Permissions** — Create any number of Roles. Assign granular permissions.
  - **Presets and Bookmarks** — Save custom arrangements for the app and content.
  - **Translation Strings** —
  - **Webhooks** — Create conditional webhooks to third party services.

Each Module within the app contains tons of features and functionalities to help manage your data, such as on-the-fly
file transformations, file-based data importing and exporting, in-app Activity logs, _and much more._ For the
developers, [configuration options](/configuration/config-options/) are available to custom-configure authorization,
caching, storage adapters, and just about everything else.

Directus is also open-source, [modular and extensible](#modular-extensible) to help ensure your project never hits a
hard feature ceiling. The platform scales without issue, _and some Projects have hundreds of millions of users._ You can
use Directus with any stack or frontend framework.

:::tip Ready to dive-in?

Get a Project running in minutes. Learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

<!--
@TODO getting-started > learn-directus
:::tip

If you're looking to see if Directus has a specific feature, the best things you can do are use the documentation search bar, read "How to Learn Directus" to will help you find information faster, or reach out to the community on [Github]() or [Discord]().

:::

-- A CTA for that last paragraph??
In addition, [Cloud Exclusive Extensions]() are always coming out with new features, expanding the Platform and pushing it to new limits.
-->

## Directus Cloud

**Directus Cloud is the fastest and easiest way to get your Directus Projects going.**

Cloud architecture can be complicated and resource intensive. Directus also has tons of configuration options. Directus
Cloud provides scalable, optimized hosting and storage, as well as automatic updates so developers can focus on building
their app. Directus Cloud also offers Cloud Exclusive Extensions, which add even more features and functionality.

Once you've created your free cloud account, you can setup Teams to manage Projects solo or with other Team Members as
needed. You'll be able get your Projects running in minutes, then as Project needs change, scale up or down as needed at
the click of a few buttons. The cloud dashboard also provides simple, straight-forward analytics to help understand
traffic and help make scaling decisions for each Project.

:::tip Ready to test out Directus Cloud?

Setup your free cloud account and learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

:::tip Enterprise Cloud

Need unlimited scalability, total customization, and dedicated support? [Contact us](https://directus.io/contact/)

:::

## Who's It For?

<!--
@TODO
Video of in-app imports/exports vs API call
-->

**Directus lets the whole team to work together and access data in one place.**

In order keep things simpler, _especially for the no-code users_, Directus uses friendlier names for many database terms
and technical concepts, including [Project](/getting-started/glossary/#projects) (database),
[Collection](/getting-started/glossary/#collections) (table), [Field](/getting-started/glossary/#fields) (column),
[Item](/getting-started/glossary/#items) (record), and [Type](/getting-started/glossary/#types) (datatype).

<!--

@TODO getting-started > learn-directus
For more information on Directus-specific terms, see the guide on [how to learn Directus](/getting-started/learn-directus).

-->

**No-Code Users**\
The no-code app is safe and intuitive enough to make data accessible to everyone, while still providing the granular configuration
and technical tools required by power-users and data scientists. This provides an app experience that is safe, intuitive,
and powerful enough for anyone... even the most non-technical users.

**Developers**\
Developers get a complete data connection toolkit with REST and GraphQL APIs, a JavaScript SDK, and [configuration options](/configuration/config-options/)
for authorization, caching, and much more. Built entirely in Typescript, primarily on [Node.js](https://nodejs.dev) and [Vue.js](https://vuejs.org),
Directus is completely open-source, modular, and extensible, allowing it to be fully tailored to the requirements of any
project.

:::tip Ready to see what Directus can do?

Checkout the core features and learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

<!--
@TODO getting-started > crashcourse
Change this CTA to the 20-30 min crashcourse
-->

:::

## Database Introspection

**Directus is installed as a _layer_ on top of your new or existing SQL database.**

<!--
@TODO
getting-started > How to Learn Directus
Add a link to a place that expands on all these terms and describes the whole system as an overview
-->

The App and API dynamically “mirror” your actual schema and content in real-time. This is similar to how technical
database clients (like _phpMyAdmin_) work. However, database introspection has many unique advantages:

- Absolute control over your pure SQL database schema.
- Complete transparency, portability, and security for your data.
- Allows importing existing databases, unaltered and without migrations.
- Direct database access and the full power of raw, complex SQL queries.
- Significant performance improvements through optimizations and indexing.

In contrast, other platforms typically use a predefined or proprietary “one-size-fits-all” data model to store content
_(have you ever peeked behind the curtain of a WordPress installation? Yikes!)_. That is not the case with Directus.
Directus gives you direct access to your pure and unaltered data. That means you have the option to bypass the Directus
middleware (API, SDK, App) and connect to your data with proper SQL queries. This effectively removes all bottlenecks,
latency overhead, and proprietary access limitations.

:::tip Ready to try the API?

Get a Project running in minutes. Test the API hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

## Use Cases

**Directus is as flexible as the database itself and can power any data-driven project.**

You can use Directus to build out any data model or app you desire, from ecommerce to IoT fleets and everything in
between. However, there are four "most common" use cases:

- **Backend as a Service**\
  An end-to-end data solution for efficiently connecting data and building APIs for projects that scale. Completely detached
  from the database, you're free to link or remove Directus anytime.
- **Headless CMS**\
  Manage every omnichannel digital experience. Deliver file assets or content in beautiful JSON across websites, apps, kiosks,
  digital signage, and beyond. _The sky's the limit!_
- **Internal Tool Builder**\
  The whole team can build custom apps! Ditch the spreadsheet and quickly build back-office apps and admin panels for customers,
  inventory, projects, marketing _or anything else._
- **Data Management and Analytics**\
  Establish _a single source of truth_ for all data. Build no-code analytics dashboards to gain insights into company KPIs
  and other metrics. Coalesce previously siloed department data.

:::tip Ready to dive-in?

Get a Project running in minutes. Learn Directus hands-on with the [Quickstart Guide](/getting-started/quickstart/).

:::

## Core Principles

**Directus is a simple, data-first solution to complex problems, guided by these principles:**

- **Pure** — No predefined or proprietary schema, with all system metadata stored separately.
- **Open** — Directus Core is public and open source, with no obfuscated or cloud-only code.
- **Portable** — Database can be exported or migrated at any time with no vendor lock-in.
- **Limitless** — No artificial limits or paywalls on users, roles, languages,
  [Collections](/getting-started/collections), or [Items](getting-started/glossary/items).
- **Extensible** — Every aspect of the platform is modular to avoid any hard feature ceilings.
- **Unopinionated** — Choose the stack, database, and architecture as you wish.

:::tip Ready to dive-in?

Get a Project running in minutes. Learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

## Modular & Extensible

**Build, modify or expand any feature needed for your app or project.**

What makes Directus so flexible is that it has been designed from the ground up with complete extensibility, helping
avoid a feature ceiling. In addition to offering our software's codebase as open-source, we've broken down the app code
into component pieces called Extensions. New Extensions can be created, modified or expanded to suit any need. However,
the following extension types come with the platform's App and API.

- **[Email Templates](/extensions/email-templates/)** — Custom structure and formatting for emails.
- **[Endpoints](/extensions/endpoints/)** — Custom registered API endpoints.
- **[Hooks](/extensions/hooks/)** — Event and interval hooks for triggering custom logic.
- **[Displays](/extensions/displays/)** — A small, inline preview of a Field's value.
- **[Interfaces](/extensions/interfaces/)** — How you view or interact with a Field and its value.
- **[Layouts](/extensions/layouts/)** — How you browse, view or interact with the Items in a Collection.
- **[Migrations](/extensions/migrations/)** — Custom migrations for tracking project schema and content updates.
- **[Modules](/extensions/modules/)** — The highest and broadest level of organization within the App.
- **[Panels](/extensions/panels/)** — A way to view dashboard data within the Insights Module.
- **[Themes](/extensions/themes/)** — Whitelabeling through App Themes and Custom CSS.

<!--@TODO
We need an illustration for this.
-->

## The Directus Ecosystem

### Cloud

- **[Directus Cloud](https://directus.cloud)** — The best way to get your Project up and running.
- **[Enterprise Cloud](https://directus.io/contact)** — Custom-tailored solutions for industrial scale projects.
- **[Cloud Documentation](/cloud/overview/)** — Docs for Directus cloud.
- **[System Status](https://status.directus.cloud)** — Up-to-date information on our various cloud systems.

### Developer Resources

- **[GitHub](https://github.com/directus/directus)** — The open-source repository and version control.
- **[NPM Package](https://www.npmjs.com/package/directus)** — The official Directus node package.
- **[Docker Image](https://hub.docker.com/r/directus/directus)** — The official Directus docker image.
- **[Documentation](https://docs.directus.io)** — Docs for the most recent version of Directus.
- **[Crowdin](https://locales.directus.io/)** — Service for managing the App's many language translations.

### Community

- **[Youtube](https://www.youtube.com/c/DirectusVideos)** — Checkout our channel with video tutorials and feature
  overviews.
- **[Discord](https://directus.chat)** — A growing community of 4K+ developers.
- **[Twitter](https://twitter.com/directus)** — The latest product info and sneak-peeks.
- **[Website](https://directus.io)** — General information, resources, and team info.
- **[Awesome List](https://github.com/directus-community/awesome-directus)** — A list of awesome things related
  Directus.
