# Database Mirroring

> Instead of using a predefined "one-size-fits-all" data model to store your content, Directus "mirrors" your actual SQL database in real-time.

## Advantages

The principle is akin to a database client (eg: _phpMyAdmin_), but includes far mor advanced tools, and is safe and intutive enough for non-technical users. This approach has many unique advantages:

* A custom SQL database schema, tailored to your exact requirements
* Significant performance improvements through optimizations and indexing
* Complete transparency, portability, and security for your data
* Direct database access and the full power of raw/complex SQL queries
* Allows importing existing databases, unaltered and without any migrations

## Collections

A Collection is a grouping of similar Items. Each collection represents a table in your database. Directus automatically uses a built-in [title formatter](#) to display your database table names prettified, and you can use [translations](#) to completely rename them if needed.

::: tip Usage
Collections can be organized in any way that is appropriate for your project. You can architect them platform-specific (eg: _pages_ of a website), or in a more platform-agnostic way (eg: raw _customers_ of your business). While there's no right or wrong way to structure your data-model, we recommend keeping your data as agnostic as possible so it is easier to repurpose in the future. In short, **learn to see your data as its own asset — not only through the lens of your immediate project needs**.
:::

### Relevant Guides

* [Creating a Collection](#)
* [Deleting a Collection](#)

## Fields

A Field is a specific type of value within a Collection. Each field represents a database column. Directus automatically uses a built-in [title formatter](#) to display your database column names prettified, and you can use [translations](#) to completely rename them if needed.

Each field also mirrors other characteristics from the column, including its `type`, `default`, `length`, `allow_null`, etc.

::: tip Usage
You might have `title`, `body`, `author`, and `date_published` fields within an `articles` collection.
:::

::: tip Aliases
Not all fields in Directus map directly to an actual database column within their table. Some relational fields, like One-to-Many (O2M) and Many-to-Many (M2M), represent data that is stored in different tables. Other fields are only for presentation and don't save data at all, such as a divider. These are called "alias" fields.
:::

::: tip Relational Fields
Fields that reference other items (in the same collection or different) are called relational fields. Linking or connecting data relationally is an immensly powerful feature of relational databases and SQL queries.
:::

### Relevant Guides

* [Creating a Standard Field](#)
* [Creating a Presentation Field](#)
* [Creating a Many-to-One Field](#)
* [Creating a One-to-Many Field](#)
* [Creating a Many-to-Many Field](#)
* [Creating a Many-to-Any Field](#)
* [Creating Translated Fields](#)
* [Duplicating Fields](#)
* [Adjusting Field Layout](#)
* [Deleting Fields](#)

## Types

Directus has built-in database abstraction for managing all SQL database vendors. However, each of those vendors has a different list of supported column datatypes. To standardize all of these differences, Directus has a single superset of types that each map to the more specific vendor ones.

* String
* Text
* Boolean
* Integer
* Big Integer
* Float
* Decimal
* Timestamp
* DateTime
* Date
* Time
* JSON
* CSV
* UUID

## Items

An Item is an object containing the field values within a Collection. Each item represents a database record. Similar to a "row" within a spreadsheet.

### Relevant Guides

* [Creating an Item](#)
* [Archiving an Item](#)
* [Reordering Items](#)
* [Deleting an Item](#)
