# Glossary

> This is list of Directus terminology, and their meanings. Most are simply more approachable names for technical
> database terms.

[[toc]]

## Admin

## Alias

## API

## App

An intuitive no-code application for managing database content. Powered by the API, the modular and highly extensible
App is written in [Vue.js](https://vuejs.org).

## Activity

## Collections

Collections are containers for specific types of Items and contain any number of fields. Each collection represents a
**table** in your database. By default, the [title formatter](#) is used to display any existing database table names as
human-readable collection titles.

Collections can be organized in any way that is appropriate for your project. You can architect them platform-specific
(eg: _pages_ of a website), or in a more platform-agnostic way (eg: raw _customers_ of your business). While there's no
right or wrong way to structure your data-model, we recommend keeping your data as agnostic as possible so it is easier
to repurpose in the future. **In short, learn to see your data as its own asset — not only through the lens of your
immediate project needs**.

The only requirement of a collection is that it must contain a [Primary Key](#) field. This field stores a unique value
that is used to reference the Collection's items throughout the database/platform.

### Relevant Guides

- [Creating a Collection](/guides/collections/#creating-a-collection)
- [Configuring a Collection](/guides/collections/#configuring-a-collection)
- [Deleting a Collection](/guides/collections/#deleting-a-collection)
- [Adjusting a Collection Layout](/guides/collections/#adjusting-a-collection-layout)

## Dashboards

## Database Abstraction

Directus supports mirroring all the most widely used SQL databases, including PostgreSQL, MySQL, Microsoft SQL Server,
SQLite, OracleDB, MariaDB, and other variants. Each vendor has subtle (and sometimes not so subtle) differences in how
they function, so Directus includes an abstraction layer that helps it avoid writing different code for each type.

This means there is also the possibility of supporting other datastores in the future, such as NoSQL options like
MongoDB, or even third-party data services like Firebase or Heroku. However these options are _fundamentally_ different
from the relational SQL databases we currently support, and so more research is needed.

## Database Mirroring

**Instead of using a predefined “one-size-fits-all” data model to store your content, Directus “mirrors” your actual SQL
database in real-time.** The principle is akin to a database client (like _phpMyAdmin_), but includes far more advanced
tools, and is safe and intuitive enough for non-technical users. This approach has many unique advantages:

- A custom (pure) SQL database schema, tailored to your exact requirements
- Significant performance improvements through optimizations and indexing
- Complete transparency, portability, and security for your data
- Direct database access and the full power of raw/complex SQL queries
- Allows importing existing databases, unaltered and without any migrations

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

In addition to the included core displays, custom displays allow for creating new and/or proprietary ways to view or
represent field data. For example, you could create progress indicators, tooltips for relational data, specific
formatting styles, or anything else.

### Relevant Guides

- [Creating a Custom Display](/guides/displays)

## Extensions

## Fields

Fields are a specific type of value within a Collection, storing the data of your item's content. Each field represents
a **column** in your database.

## Files & Assets

## Interfaces

## Items

Item are objects within a Collection which contain values for one or more fields. Each collection represents a
**record** in your database.

## Junction Collections

## Layouts

## Modules

## Panels

## Permissions

Permissions are attached directly to a Role, defining what Users can create, read, update, and delete within the
platform

## Presets

Presets store the exact state of a [collection page](#) page. They are used to set layout defaults for a user, or to
define bookmarks that can be used to quickly recall specific datasets.

#### Relevant Guides

- [Creating a Preset](/guides/presets/#creating-a-preset)
- [Deleting a Preset](/guides/presets/#deleting-a-preset)

## Projects

## Relationships

## Revisions

## Roles

Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
platform.

## Title Formatter

Special Casing — If you are trying to update the specific casing (uppercase/lowercase) for a word (eg: `Dna` to `DNA`)
you will want to add the edge-case to the
[Format Title package](https://github.com/directus/directus/tree/main/packages/format-title/src). If you feel the case
passes our [80/20 rule](https://docs.directus.io/contributing/introduction/#feature-requests) you should submit a Pull
Request to the codebase, otherwise you can update this in your instance.

## Translations

## Types

## Users

An active User is required to access a project. Each user is assigned to a [Role](/concepts/roles/) that determines what
they have access to see and do. This means that the experience of users may vary significantly depending on their role's
permissions.
