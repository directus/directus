---
description: A glossary of key Directus terminology.
readTime: 15 min read
---

# Glossary

> This is list of platform-specific terminology, and their meanings. Most are simply more approachable names for
> technical database terms.

## Admin / Administrator

An "Administrator" Role (with Admin access enabled) is included when you first install the platform. All admin roles
bypass the permissions check, providing unrestricted access to all data within the App and API. Additionally, only roles
with the admin option enabled can manage Settings within the app.

## Alias

[Fields](#fields) that do not map directly to an actual database column are called "alias" fields. For example,
presentation fields (such as dividers and groups) and certain relational types that display data stored elsewhere (such
as [One-to-Many (O2M)](/app/data-model/relationships#one-to-many-o2m) and
[Many-to-Many (M2M)](/app/data-model/relationships#many-to-many-m2m)).

## API

The Application Programming Interface (API) provided by the platform is how you can programmatically connect your
project's content, files, and system information to external code (like a website) or with other third-party services.

## App

An intuitive no-code application for managing database content. Powered by the API, the modular and highly extensible
App is written in [Vue.js](https://vuejs.org).

## Activity

Activity is a log of all events that take place within the platform. Used for accountability, each activity record
tracks the event type, user, timestamp, IP address, user-agent, and any associated revision data.

## Collections

Collections are containers for specific types of Items and contain any number of fields. Each collection represents a
**table** in your database. By default, the [title formatter](#title-formatter) is used to display any existing database
table names as human-readable collection titles. There are also "folder" collections that are
[exclusively used for organizational purposes](/app/data-model#sorting-grouping), and don't hold any data themselves.

Collections can be organized in any way that is appropriate for your project. You can architect them platform-specific
(e.g., _pages_ of a website), or in a more platform-agnostic way (e.g., raw _customers_ of your business). While there's
no right or wrong way to structure your data-model, we recommend keeping your data as agnostic as possible so it is
easier to repurpose in the future. **In short, learn to see your data as its own asset — not only through the lens of
your immediate project needs**.

The only requirement of a collection is that it must contain a [Primary Key](#primary-key-pk) field. This field stores a
unique value that is used to reference the Collection's items throughout the database/platform.

### Relevant Guides

- [Creating a Collection](/app/data-model#creating-a-collection)
- [Configuring a Collection](/app/data-model#configuring-a-collection)
- [Deleting a Collection](/app/data-model#deleting-a-collection)
- [Adjusting a Collection Layout](/app/data-model#adjusting-a-collection-layout)

## Dashboards

Dashboards within the Insights module organize different [Panels](#panels) into an at-a-glance view. They can be used to
group data based on department, objective, business process or anything you choose.

## Database Abstraction

Directus supports mirroring all the most widely used SQL databases, including PostgreSQL, MySQL, Microsoft SQL Server,
SQLite, OracleDB, MariaDB, CockroachDB, and other variants. Each vendor has subtle (and sometimes not so subtle)
differences in how they function, so Directus includes an abstraction layer that helps it avoid writing different code
for each type.

This means there is also the possibility of supporting other datastores in the future, such as NoSQL options like
MongoDB, or even third-party data services like Firebase or Heroku. However these options are _fundamentally_ different
from the relational SQL databases we currently support, and so more research is needed.

## Displays

Displays are the smaller, read-only counterpart to [Interfaces](#interfaces), defining how a field's data will be
displayed inline throughout the App.

For example, you may have a "Status" field that uses a _Dropdown_ Interface on the Item Detail page, and a smaller
_Badge_ Display when the field is referenced throughout the rest of the App. Directus includes many Displays
out-of-the-box, below are the some key examples:

- **Raw** — The exact value, straight from the API
- **Formatted Value** — Provides options for string formatting
- **Boolean** — Customizable True/False icons
- **Color** — A color swatch preview
- **DateTime** — Formatted or relative datetimes
- **Image** — Thumbnail previews
- **Labels** — Small, custom colored badges
- **Rating** — Customizable stars
- **Related Values** — Displays relational display titles
- **User** — Avatar and name of a system user

![Displays](https://marketing.directus.app/assets/533af564-7400-409f-a98c-19c4452b41db.png)

In addition to the included core displays, custom displays allow for creating new and/or proprietary ways to view or
represent field data. For example, you could create progress indicators, tooltips for relational data, specific
formatting styles, or anything else.

### Relevant Guides

- [Creating a Custom Display](/extensions/displays)

## Environments

Environments (e.g., dev, staging, prod) are tracked as separate Project instances. You can then use schema/content
migrations to promote data between them.

## Extensions

The platform has been built to be modular and extensible. This helps keep the core codebase simple and clean, while
allowing the flexibility needed to satisfy all use-cases... no matter how complex. There are many different types of
supported extensions, each offering a way to deeply customize, override, or extend the core platform.
[Learn more about Extensions](/extensions/introduction).

## Fields

Fields are a specific type of value within a Collection, storing the data of your item's content. Each field represents
a **column** in your database. For example, an `articles` [Collection](#collections) might have `title`, `body`,
`author`, and `date_published` field. Fields mirror the characteristics of their associated column, including its
`name`, `type`, `default`, `length`, `allow_null`, etc.

### Relevant Guides

- [Creating a Field](/reference/system/fields#creating-a-field)
- [Duplicating Fields](/reference/system/fields#duplicating-a-field)
- [Adjusting Field Layout](/reference/system/fields#adjusting-field-layout)
- [Deleting Fields](/reference/system/fields#deleting-a-field)

## Files & Assets

As you might have guessed, files includes images, videos, PDFs, text documents, or anything else. While files can
technically be stored as code in the database, it is far more common to manage them as individual assets on a "drive".
The platform supports many options for uploading, storing, transforming, and retrieving different types of files, and it
is an excellent Digital Asset Management system.

## Icons

### Material Icons

Full list of icons [can be found here](https://fonts.google.com/icons). Directus supports both filled & outlined
variants of Material icons.

### Social Icons

They are Font Awesome 5's brands icons. Full list of icons
[can be found here](https://fontawesome.com/v5.15/icons?d=gallery&s=brands). When using them as one of the auth provider
icons, make sure to use underscores, such as `blogger_b` for
[blogger-b](https://fontawesome.com/v5.15/icons/blogger-b?style=brands) icon.

## Interfaces

Interfaces determine how you view or interact with a field. In most cases, they offer some sort of input tailored to
managing data of a specific type, but can also be used exclusively for presentation. Examples include text inputs,
toggles, WYSIWYG editors, dropdowns, sliders, image galleries, and more.

![Interfaces](https://marketing.directus.app/assets/8c8d1da9-9e8a-4698-91c3-02d4a3cdefef.png)

In addition to the many core interfaces included out-of-the-box, _custom_ interfaces allow for creating more tailored or
proprietary options, such as seating charts, QR codes, or Stripe customer info.

### Relevant Guides

- [Creating a Custom Interface](/extensions/interfaces)

## Items

Items are objects within a Collection which contain values for one or more fields. Each item represents a **record** in
your database.

Items are the primary building blocks of your project content. Similar to a "row" within a spreadsheet, all data within
the platform is accessed via these "atomic" data units. Items themselves are fairly straightforward, however their real
power comes from the complexity that begins to form when items are relationally connected to each other.

Items are referenced (both individually and relationally) by their unique [primary key](#primary-key-pk).

#### Relevant Guides

- [Creating an Item](/user-guide/content-module/content/items#create-an-item)
- [Archiving an Item](/user-guide/content-module/content/items#archive-an-item)
- [Manually Sorting Items](/user-guide/content-module/content/collections#manually-sort-items)
- [Deleting an Item](/user-guide/content-module/content/items#delete-an-item)

## Junction Collections

The platform allows you to group Items within different Collections. But often times it is important to "link" items
across different collections (such as relating `recipes` and `ingredients`) — this is called a relationship. There are
several different types of relationships, but only some (M2M and M2A) require an additional collection to properly
connect data. For instance, if you have a `recipes` collection and an `ingredients` collection, you would also need a
`recipe_ingredients` junction collection to sit between and connect the two.

## Layouts

Layouts determine how you view or interact with a Collection. In most cases, they offer a way to browse items based on a
specific type of data, but can also be used to visualize or interact with data. Directus includes several Layout options
out-of-the-box, each with different features and configuration options.

- **Table** — Works with any type of data, showing items as rows and their fields as columns.
- **Cards** — Ideal for image data, this layout shows items as a grid of image cards.
- **Calendar** — Ideal for "temporal" data that is sorted by date or datetime.
- **Map** — Ideal for "geospatial" data that is shown on a world map.

![Layouts](https://marketing.directus.app/assets/75900b67-a908-42fa-9bd3-de259c797cac.png)

In addition to these core layouts, custom layouts allow for creating more tailored or proprietary ways to experience
data within the App, such as Gantt charts, seating maps, or spreadsheets.

### Relevant Guides

- [Creating a Custom Layout](/extensions/layouts)

## Modules

Modules are the highest and broadest level of organization within the App. There are several modules included
out-of-the-box, however you can also add your own.

The [Module Bar](/user-guide/overview/data-studio-app#_1-module-bar) lists all available Modules and allows you to
switch between them. Each module also controls its own navigation bar to provide tailored access to sub-pages. All core
functionality within the App can be bucketed into one of the following modules:

- [Content](/user-guide/content-module/content/collections) — The primary way to view and interact with database content
- [User Directory](/user-guide/user-management/user-directory) — A dedicated section for the platform's system Users
- [File Library](/user-guide/file-library/files) — An aggregate of all files uploaded and managed within the platform
- [Insights](/user-guide/insights/dashboards) — Access to infinitely customizable data dashboards
- [App Guide](/user-guide/overview/data-studio-app) — A tailored, in-app portal for the platform's concepts, guides, and
  reference
- [Project Settings](/user-guide/settings/project-settings) — An admin-only section for configuring the project and
  system settings

![Modules](https://marketing.directus.app/assets/f761a496-f49b-4fcc-a09e-d074b6cbf8a5.png)

In addition to these core modules, custom modules offer a _blank canvas_ for creating altogether new/different
experiences within the App, such as proprietary dashboards, compound datasets, or third-party integrations (e.g., a
Stripe Payments Console).

### Relevant Guides

- [Creating a Custom Module](/extensions/modules)

## Multitenancy

Multitenancy is an architecture that allows multiple tenants (e.g., customers) to be managed by the platform. There are
two main ways to achieve multitenancy:

- **Project Scoping** — Creating a super-admin layer that provisions new tenant projects has been made easier by the
  Cloud-native model of Directus 9+. This method involves developing custom code that can dynamically spin up/down
  projects, but is also the most flexible, supporting scoped extensions and differentiated project settings.
- **Role Scoping** — In this method, you create one Role per tenant, and configure their permissions to properly scope
  them within a single project. This direction allows for tenants to share a single schema using _item_ scoped
  permissions, or different schemas by using _collection_ scoped permissions.

## Panels

Panels are modular units of data visualization that exist within the [Insights module](/user-guide/insights/dashboards).
Each panel exists within a [Dashboard](#dashboards) and can be positioned and resized as needed.

![Panels](https://marketing.directus.app/assets/2af5a9ce-ddfb-44ca-a8fc-afa18018841f.png)

## Permissions

Permissions are attached directly to a Policy, defining what a user can create, read, update, and delete within the
platform. Extremely granular, these filter-based permissions control access for the entire system.

## Policies

Policies define a specific set of access permissions, and can be attached directly to users or to roles.

## Presets

Presets store the exact state of a [collection page](#collections). They are used to set layout defaults for a user, or
to define bookmarks that can be used to quickly recall specific datasets.

#### Relevant Guides

- [Creating a Preset](/reference/system/presets#create-a-preset)
- [Deleting a Preset](/reference/system/presets#delete-a-preset)

## Primary Key (PK)

When we're trying to view or reference a specific [Item](#items) within a [Collection](#collections), you need some sort
of unique identifier to know exactly where to look. Much like an address for a house, the primary key field provides the
location of an item within its collection. For that reason, every collection must have a primary key field, and so they
are configured when you create the collection. There are different types of identifiers you can use, but the field is
often called `id`.

## Projects

A Project is a complete instance of the platform. Each project represents a **Database**, but also encapsulates a config
file, asset storage, and any custom extensions. Projects are the highest level of organization in Directus.

- [Creating a Project](/self-hosted/quickstart)
- [Configuring a Project](/self-hosted/config-options)
- [Adjusting Project Settings](/user-guide/settings/project-settings)
- [Upgrading a Project](/self-hosted/upgrades-migrations)
- [Backing-up a Project](/self-hosted/upgrades-migrations#backing-up-a-project)
- [Migrating a Project](/self-hosted/upgrades-migrations#migrating-a-project)
- [Deleting a Project](/self-hosted/upgrades-migrations#deleting-a-project)

## Relationships

The platform allows you to group Items within different Collections. But often times it is important to "link" items
across different collections (such as relating `recipes` and `ingredients`) — this is called a relationship, a crucial
concept within any _relational_ database. There are several different types of relationships, each serving a specific
purpose. [Learn more about Relationships](/app/data-model/relationships).

## Revisions

Revisions are created whenever an Item is updated. These alternate versions are tracked so that previous states can be
recovered. Every change made to items in Directus is stored as a complete versioned snapshot and a set of specific
changes made (the delta). The revisions system is tightly coupled to the activity logs system, with each revision linked
to the activity event where it was created.

## Roles

Roles define a specific set of Policies, and are the primary organizational structure for Users within the platform. You
can create an unlimited number of roles, so organize your users in whatever way feels most appropriate.

Roles can also contain any number of additional roles, each containing their own set of Policies.

During the installation process, Directus automatically creates an "Administrators" Role, which is used to provide the
initial admin user with full platform access. However this is just a _normal_ role, and so it can still be updated,
renamed, or even deleted. Keep in mind that your project must maintain at least one role with Admin Access at all times.

There is also a "Public" role that determines access for unauthenticated access.

## Singleton

- **Directus** - A collection that only contains one single item
- [**Design pattern**](https://www.patterns.dev/posts/singleton-pattern/) - Classes which can be instantiated once and
  can be accessed globally. This single instance can be shared throughout our application, which makes singletons great
  for managing global state in an application.

## Storage Adapters

Storage adapters allow project files to be stored in different locations or services. By default, Directus includes the
following drivers:

- **Local Filesystem** — The default, any file system location or network-attached storage
- **S3 or Equivalent** — Including AWS S3, DigitalOcean Spaces, Alibaba OSS, and others
- **Google Cloud Storage** — A RESTful web service on the Google Cloud Platform
- **Azure Blob Storage** — Azure storage account containers

## Title Formatter

Special Casing — If you are trying to update the specific casing (uppercase/lowercase) for a word (e.g., `Dna` to `DNA`)
you will want to add the edge-case to the [Format Title package](https://github.com/directus/format-title) in a Pull
Request.

## Translations

The platform supports internationalization across its entire Data Studio. Many languages are currently supported, with
more being added all the time. Anyone can add or refine any languages through the integration with
[Crowdin](https://locales.directus.io).

In addition to the App itself being multilingual, the platform allows translating your schema too. By default,
collections and field names come from the database's naming, but you can override this in different languages.

The platform also includes different ways to manage multilingual content. The built-in translation interface supports
authoring content in any number of languages, side-by-side reference editing, and mixing in language agnostic content
(such as dates or toggles).

## Types

The "type" defines how field content is stored in the database and how it is returned by the API. Often called a
data-type, these are important in ensuring field values are saved in a standardized format. Changing a field's type can
cause data loss, so types are locked within the platform after a field is created.

### Data Type Superset

Directus uses its built-in database abstraction to properly support all the different SQL vendors. However, these
vendors do not share support for the same data types, instead, each SQL vendor maintains their own list. To standardize
all of these differences, Directus has a single _superset_ of types that map to the vendor-specific ones.

- **String** — A shorter set of characters with a configurable max length
- **Text** — A longer set of characters with no real-world max length
- **Boolean** — A True or False value
- **Binary** — The data of a binary file
- **Integer** — A number without a decimal point
- **Big Integer** — A larger number without a decimal point
- **Float** — A less exact number with a floating decimal point
- **Decimal** — A higher precision, exact decimal number often used in finances
- **Timestamp** — A date, time, and timezone saved in ISO 8601 format
- **DateTime** — A date and time saved in the database vendor's format
- **Date** — A date saved in the database vendor's format
- **Time** — A time saved in the database vendor's format
- **JSON** — A value nested in JavaScript Object Notation
- **CSV** — A comma-separated value, returned as an array of strings
- **UUID** — A universally unique identifier saved in UUIDv4 format
- **Hash** — A string hashed using argon2 cryptographic hash algorithm
- **Alias** — For fields that do not have a database column [Learn More](#)

::: warning

For **SQLite**, the **Timestamp** type is stored as a **DateTime**.

:::

## Users

An active User is required to access a project. Each user is assigned to a [Role](#roles) that determines their policies
what they have access to see and do. This means that the experience of users may vary significantly depending on their
role's permissions. Users can also have policies directly attached to them.
