# Platform Overview

> The Directus platform is primarily comprised of an API and App, working in concert to “mirror” the schema and content
> of your SQL database.

## Database Mirroring

**Instead of using a predefined “one-size-fits-all” data model to store your content, Directus “mirrors” your actual SQL
database in real-time.** The principle is akin to a database client (like _phpMyAdmin_), but includes far more advanced
tools, and is safe and intuitive enough for non-technical users. This approach has many unique advantages:

- A custom (pure) SQL database schema, tailored to your exact requirements
- Significant performance improvements through optimizations and indexing
- Complete transparency, portability, and security for your data
- Direct database access and the full power of raw/complex SQL queries
- Allows importing existing databases, unaltered and without any migrations

## Directus API

The Directus API uses _Database Mirroring_ to dynamically generate REST endpoints and a GraphQL schema based on the
connected database's architecture. It is written in [Node.js](https://nodejs.dev) and uses database abstraction to
support most [SQL database vendors](/guides/installation/cli/#_1-confirm-minimum-requirements).

#### Relevant Docs

- [API Reference](/reference/api/introduction/)
- [API Extensions](/concepts/api-extensions/)

## Directus App

The Directus App is decoupled from, and powered by, the Directus API. It provides a way for both technical admins and
non-technical users to view and manage content of the connected database. It is written in [Vue.js](https://vuejs.org),
is completely modular, and is highly customizable.

#### Relevant Concepts

- [App Overview](/concepts/app-overview/)
- [App Extensions](/concepts/app-extensions/)

## Projects & Environments

A Project is a complete instance of Directus. Each project primarily represents a database, but also includes a
configuration file, the related asset storage, and any custom extensions. This modular approach means you can also create different environments
(eg: Dev, Staging, Prod) by simply creating additional project instances.

#### Relevant Guides

- [Project Guides](/guides/projects/)
- [Project Migrations](#)

## Collections

A Collection is a grouping of similar Items. Each collection represents a _table_ in your database. Directus automatically
uses a built-in title formatter to display your database table names prettified, and you can use [schema translations](/concepts/internationalization/#schema-translations) to completely rename them if needed.

Collections can be organized in any way that is appropriate for your project. You can architect them platform-specific
(eg: _pages_ of a website), or in a more platform-agnostic way (eg: raw _customers_ of your business). While there's no
right or wrong way to structure your data-model, we recommend keeping your data as agnostic as possible so it is easier
to repurpose in the future. In short, **learn to see your data as its own asset — not only through the lens of your
immediate project needs**.

The only requirement of a collection is that it must contain a **Primary Key** field. This field stores a unique value that is used to reference the Collection's items throughout the database/platform.

#### Relevant Guides

- [Creating a Collection](/guides/collections/#creating-a-collection)
- [Configuring a Collection](/guides/collections/#configuring-a-collection)
- [Deleting a Collection](/guides/collections/#deleting-a-collection)

## Presets & Bookmarks

Presets store the exact state of a [collection detail](/concepts/app-overview/#collection-detail) page. These are used to set layout
defaults for a user, or to define bookmarks that can be used to quickly recall specific datasets.

#### Relevant Guides

- [Creating a Preset](/guides/presets/#creating-a-preset)
- [Deleting a Preset](/guides/presets/#deleting-a-preset)

## Fields

A Field is a specific type of value within a Collection. For example, an `articles` collection might have `title`, `body`, `author`, and `date_published` fields. Each field represents a database _column_. Directus automatically
uses a built-in title formatter to display your database column names
prettified, and you can use [schema translations](/concepts/internationalization/#schema-translations) to completely rename them if needed.

Fields also mirror other characteristics from their associated column, including its `type`, `default`, `length`, `allow_null`, etc.

::: tip Relational Fields

Fields that reference other items (in the same collection or different) are called [relational fields](/concepts/relationships/). Linking or
connecting data relationally is an immensely powerful feature of relational databases and SQL queries.

:::

::: tip Aliases

Not all fields in Directus map directly to an actual database column within their table — these are called "alias" fields. For example, certain relational fields, like [One-to-Many (O2M)](/concepts/relationships/#one-to-many-o2m) and [Many-to-Many (M2M)](/concepts/relationships/#many-to-many-m2m), represent data that is stored in _other_ tables. Then there are [Presentation Fields](/guides/field-types/presentation-field/) that don't save data at all, such as dividers and action buttons.

:::

#### Relevant Guides

- [Creating a Standard Field](/guides/field-types/standard-field)
- [Creating a Presentation Field](/guides/field-types/presentation-field)
- [Creating a Many-to-One Field](/guides/field-types/many-to-one-field)
- [Creating a One-to-Many Field](/guides/field-types/one-to-many-field)
- [Creating a Many-to-Many Field](/guides/field-types/many-to-many-field)
- [Creating a Many-to-Any Field](/guides/field-types/many-to-any-field)
- [Creating Translated Fields](/guides/field-types/translated-fields)
- [Duplicating Fields](/guides/fields/#duplicating-a-field)
- [Adjusting Field Layout](/guides/fields/#adjusting-field-layout)
- [Deleting Fields](/guides/fields/#deleting-a-field)

## Types

Every Field is configured with a specific "Type" which defines how its data is stored in the database. Often called a data-type, these are important in ensuring field values are saved cleanly and in a standardized format.

Directus uses its built-in database abstraction to properly support all the different SQL vendors. However, these vendors do not share support for the same datatypes, instead, each SQL vendor maintains their own list. To standardize all of these differences, Directus has a single _superset_ of types that map to the vendor-specific ones.

#### Directus Data Type Superset

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

## Items

An Item is an object within a Collection that contains the values for one or more fields. Each item represents a database _record_. Similar to a "row" within a spreadsheet, all data within Directus is accessed via these "atomic" content units.

#### Relevant Guides

- [Creating an Item](/guides/items/#creating-an-item)
- [Archiving an Item](/guides/items/#archiving-an-item)
- [Reordering Items](/guides/items/#reordering-items)
- [Deleting an Item](/guides/items/#deleting-an-item)
