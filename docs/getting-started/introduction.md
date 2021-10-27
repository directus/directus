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

## Database Mirroring

What makes Directus so unique is that it dynamically generates custom API endpoints based on your SQL database's schema
in real-time — something we call "[Database Mirroring](/concepts/databases/#database-mirroring)". Whether you install
fresh or on top of an existing database, you always maintain end-to-end control over your actual database, including:
tables, columns, datatypes, default values, indexes, relationships, etc.

Below is an overview to how Directus mirrors the database, and our non-technical naming convention.

- **[Project](/getting-started/glossary/#projects)** — A Database, asset storage, and config file
- **[Collection](/app/content-collections/)** — A Database Table
- **[Fields](/getting-started/glossary/#fields)** — A Database Column
- **[Item](/getting-started/glossary/#items)** — A Database Record/Row
- **[Relationships](/getting-started/glossary/#relationships)** — A Database Relationship, including additional
  non-standard types
- **[Type](/getting-started/glossary/#types/)** — A Database Data Type, including additional non-standard types
- **[Users](/getting-started/glossary/#users)** — A Directus User (App or API), not to be confused with a Database User

Perhaps one of the biggest advantages of _Database Mirroring_ is that you have direct access to your pure and unaltered
data. That means you have the option to bypass the Directus middleware (API, SDK, App) and connect to your data with
proper SQL queries. This effectively removes all bottlenecks, latency overhead, and proprietary access limitations.

## Modular & Extensible

What makes Directus so flexible is that it has been designed from the ground up with complete extensibility, helping
avoid a feature ceiling. In addition to offering our software's codebase as open-source, we've included the following
extension types in the platform's App and API.

- **[Modules](/extensions/modules/)** — (App) The highest and broadest level of organization within the App
- **[Layouts](/extensions/layouts/)** — (App) How you browse, view or interact with a set of Items in a Collection
- **[Interfaces](/extensions/interfaces/)** — (App) How you view or interact with a field and its value
- **[Displays](/extensions/displays/)** — (App) A small inline preview of a field's value
- **[Panes](/extensions/panes/)** — (App) A way to view dashboard data within the Insights Module
- **[Styles](/guides/styles/)** — (App) Whitelabeling through App Themes and CSS Overrides
- **[Endpoints](/extensions/api-endpoints/)** — (API) Custom registered API endpoints
- **[Hooks](/extensions/hooks/)** — (API) Event and interval hooks for triggering custom logic
- **[Email Templates](/extensions/email-templates/)** — (API) Custom structure and formatting for emails

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
