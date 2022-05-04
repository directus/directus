# Introduction

> These Docs will help you get Directus up-and-running quickly, guide you through advanced features, and explain the
> core concepts that make Directus so unique.

[[toc]]

## What is Directus?

::: tip Directus

Directus ([duh REKT iss](http://audio.pronouncekiwi.com/Salli/Directus)) is Latin for: _laid straight, arranged in
lines_.\
The broadest goal of our platform is to present data in a simple, orderly, and intuitive way.

:::

<!--
@TODO
getting-started > introduction
Add 2-4 min Promo Video When Ready
-->

**Directus is an Open Data Platform built to democratize the database.**

This platform can manage any data, or data model, in any SQL database. Directus uses a technique called
[Database Introspection](#how-it-works), which identifies your full database structure and creates an abstraction layer,
then dynamically generates REST and GraphQL API endpoints to manage the data with exhaustive, granular control. These
APIs are available for devs, but also used to power the intuitive no-code app.

<!--Anything that the APIs can do can also be done in the app and vice versa.-->

**Database Introspection & Abstraction**\
SQL flavors each have slightly different data types and other idiosyncrasies. In order to work seamlessly with any SQL database,
Directus has a sophisticated introspection and abstraction layer that reads your data and data model, then handles all nitty-gritty
details behind-the-scenes. Simply link Directus to your new or pre-existing database and it works out-of-the-box. This approach
also lets you to link or remove it any time without a trace and zero impact on your data.

**The REST and GraphQL APIs**\
Developers have the power to do everything programmatically from the REST or GraphQL APIs: handle CRUD operations, set roles
and permissions, create incredibly complex and granular queries, build simple event-driven webhooks and sophisticated task
automation, upload and download digital file assets, upload and download data in file format... _the list goes on and on!_

**The No-Code App**\
Remember: the App itself is powered by the API. Anything that the APIs can do can also be done in the app and vice versa.
To organize features and functionality, Directus is broken into [Modules](/getting-started/glossary/#modules), which allow
you to interact with data in a specific way, such as data and content management, digital file asset management, drag and
drop analytics dashboard creation, and so on. Each Module contains tons of features and functionalities to help manage your
data.

---

**Completely Customizable**\
Built entirely in Typescript, primarily on [Node.js](https://nodejs.dev) and [Vue.js](https://vuejs.org), Directus is completely
open-source, modular and extensible, ensuring your project never hits a hard feature ceiling. The platform scales without
issue, _and some Projects have hundreds of millions of users._ The platform is also API-driven, so you can use it with any
_(or many)_ stacks or frontend frameworks.

**Extensive Configuration Options**\
[Configuration options](/configuration/config-options/) are also available as global variables in the codebase so developers
can custom configure SSO authentication, caching, default file storage location (local, S3, google, etc.) for digital assets,
emails, _and much more._

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

## How It Works

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

<!--
:::tip Ready to try the API?

Get a Project running in minutes. Test the API hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::
-->

## Who's It For?

**Directus lets the whole team to work together and access data in one place.**

**Developers** — Developers get a complete data connection toolkit with REST and GraphQL APIs, a JavaScript SDK, access
to global variables to customize [configuration options](/configuration/config-options/), and direct command line access
to digital assets.

**Power Users** — Data analysts and data scientists have in-app tools to query data, build out in-app analytics
dashboards, and extract or upload data in file format. Additionally, these users are still free to link other services
and run raw SQL queries directly on the database.

**Business Users** — The no-code app is safe and intuitive enough to make data accessible to everyone, even the most
non-technical users. Administrators can create absolutely granular permissions for roles as well as individual users.

:::tip

In order keep things simpler, _especially for the no-code users_, Directus uses friendlier names for many database terms
and technical concepts, including [Project](/getting-started/glossary/#projects) (database),
[Collection](/getting-started/glossary/#collections) (table), [Field](/getting-started/glossary/#fields) (column),
[Item](/getting-started/glossary/#items) (record), and [Type](/getting-started/glossary/#types) (datatype).

:::

<!--

@TODO getting-started > learn-directus
For more information on Directus-specific terms, see the guide on [how to learn Directus](/getting-started/learn-directus).

-->

<!--
:::tip Ready to see what Directus can do?

Checkout the core features and learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

@TODO getting-started > crashcourse
Change this CTA to the 20-30 min crashcourse

:::
-->

## When to Use It

**Directus can power any data-driven project and can be linked or removed at any time.**

You'll be able to build, monitor or manage any data model or app you desire: IoT fleets, ecommerce, SaaS, business data
analytics, multi-channel content, _or anything else_.... If it involves SQL and digital files, you can use Directus.
With this in mind, four broad use cases emerge:

- **Backend as a Service**\
  An end-to-end data solution. Efficiently connects data, auto-generates exhaustive APIs for projects that scale, provides
  webhooks and task automation. Completely detached from the database, you're free to link and remove Directus anytime or
  use any other service in tandem.
- **Headless CMS**\
  Remember: _content_ is just data from a database! Manage any omnichannel digital experience. Deliver file assets and data
  across websites, apps, kiosks, digital signage... _the sky's the limit!_
- **Internal Tool Builder**\
  The whole team can build custom apps! Ditch the spreadsheet and quickly build back-office apps and admin panels for customers,
  inventory, projects, marketing _or anything else._
- **Data Management and Analytics**\
  Establish _a single source of truth_ for all data. Build no-code analytics dashboards to gain insights into company KPIs
  and other metrics. Coalesce previously siloed department data.

<!--
mention SaaS in there

:::tip Ready to dive-in?

Get a Project running in minutes. Learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::
-->

## Why Use It?

**Directus is a simple, data-first solution to complex problems and using it has no downsides.**

Directus was created in 2004, and has been slowly, iteratively improved on for a long time. The core team has carefully
thought through the app, beginning-to-end, to make sure that using this platform is an all-benefit and no downside
experience. This platform is plug-and-play, so you're free to link or remove it any time, with no impact on your data.
You have no vendor lock-in whatsoever, your data is yours. There are no artificial limits on data _(e.g. limits on users
or roles)_.

<!-- highlight the cost-of-scaling that comes with a platform which charges for users and roles -->

Consider competing platforms in the four general use cases mentioned in the previous section _(BaaS, headless CMS,
internal tool builder, data management and analytics)_. Due dilligence to select the a viable solution one of these
categories can easily take 6 months to be sure the feature list, pricing, scalability, migration options, etc.. all fit
the project in question. However, thanks to the plug-and-play nature of Directus, you can link it to the database, test
it immediately on an existing database _or build a new data model from scratch_, then get rid of it at any time.

The platform is guided by the following core principles:

- **Pure** — No predefined or proprietary schema, with all system metadata stored separately.
- **Open** — Directus Core is public and open source, with no obfuscated or cloud-only code.
- **Portable** — Database can be exported or migrated at any time with no vendor lock-in.
- **Limitless** — No artificial limits or paywalls on users, roles, languages,
  [Collections](/getting-started/collections), or [Items](getting-started/glossary/items).
- **Extensible** — Every aspect of the platform is modular to avoid any hard feature ceilings.
- **Unopinionated** — Choose the stack, database, and architecture as you wish.

<!-- No migration- Directus Cloud?? -->

## Directus Cloud

**Directus Cloud is the fastest and easiest way to get your Directus Projects going.**

Cloud architecture can be complicated and resource intensive. Directus also has tons of configuration options. Directus
Cloud provides scalable, optimized hosting and storage, as well as automatic updates so developers can focus on building
their app. Directus Cloud also offers [Cloud Exclusive Extensions](/cloud/glossary/#cloud-exclusives), which add even
more features and functionality onto your projects.

Once you've created your free cloud account, you can setup Teams to manage Projects solo or with other Team Members as
needed. You'll be able get a Project running in 90 seconds on average, then as Project needs change, scale up or down as
needed at the click of a few buttons. The cloud dashboard also provides simple, straight-forward analytics to help
understand traffic and inform make scaling decisions.

:::tip Ready to test out Directus Cloud?

Setup your free cloud account and learn Directus hands-on in the [Quickstart Guide](/getting-started/quickstart/).

:::

:::tip Enterprise Cloud

Need total customization, unlimited scalability, and dedicated support? [Contact us](https://directus.io/contact/)

:::
