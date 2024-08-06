---
description:
  The data model describes the structure of your database's schema using Collections, database tables, and Fields.
readTime: 15 min read
---

# Data Model

> The Directus data studio enables no-code configuration and management for any SQL database, with no arbitrary
> restrictions on how you build your data model. You get control over table, column and relationship configuration, as
> well as how users view and interact with data inside the data studio.

<!--
::: tip Before You Begin

Learn Directus
Please see the [Quickstart Guide]().
Configuration > Overview

:::
-->

::: tip Learn More

Remember, you will have full access to manage your database using SQL. Directus will mirror any changes. You can also
configure your data model programmatically via the API. To learn more, see our API documentation on
[Collections](/reference/system/collections), [Fields](/reference/system/fields), and
[Relations](/reference/system/relations).

:::

## Relational Data Models

In order to understand how Directus handles data models, you will need an understanding of what relational data models
are. This section provides a brief summary of the core concepts. It may be useful as a review, or for business users
working on your team that want a simple explanation of how data models work. If you have a firm knowledge of relational
data model concepts, such as databases, data tables, columns, data types, primary and foreign keys, rows, relationships,
and schemas then feel free to jump to [Data Models in Directus](#data-models-in-directus).

### Databases

Directus is an SQL database wrapper. A database is a set of data stored in a computer, in a structured way, making it
organized, accessible, and scalable. The specific way you structure your data within a database is called your data
model.

![A Database Schema](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/database-schema-20220805A.webp)

### Database vs Excel

To make a comparison most business users can relate with, storing data in a database is _somewhat_ similar to storing
data in Excel spreadsheets. You know how you can build a table on one sheet in Excel, build another table on another
sheet, then link the rows of each table together? That is pretty much how a relational data model works. But there are
some key points where Excel and relational databases differ.

![Data in an Excel Spreadsheet](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/spreadsheet-20220805A.webp)

Many times, we store data as a table in Excel, but that's not always the case, as the program serves tons of other
purposes. Excel lets you make your data stylized _(bold, italicized, colored, custom fonts, etc.)_, set dynamic
functions in cells, add graphics like charts and graphs, and input any kind of data into any cell you'd like with no
enforced structure. Your Excel spreadsheet is a blank canvas, designed to store up to tens of thousands of rows of
information.

![A data table](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/datatable-20220805A.webp)

There is no stylization within databases. They strictly store raw data values in a structured way. Any time you want to
style data, build a function, put data into a graph, _etc.,_ you must create that functionality in your app or website.
Databases store raw, un-stylized, structured data and are designed to handle millions, _and in some cases billions and
trillions_, of rows of information.

### Data Tables

![A Data Table: rows and columns](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/rows-and-columns.webp)

<!-- image should note rows and columns. -->

SQL databases store data across data tables. Data tables typically store information about one distinct type of record,
object, or observation, such as a financial transaction, blog post, geo-position, user, IoT event, _or anything_. Data
tables are further broken down into columns and rows.

### Columns

![A Column](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/columns-20220805A.webp)

Columns are categories that store one kind of information. Each column has a unique, descriptive name and stores one
unit of information in each of its [cell values](#cell-values). Columns keep the data organized, consistent, and easily
accessible. The columns you choose to add to a data table will completely depend on the information you need to store.

<!-- For example, in a database for IoT devices monitoring the weather, an `iot_events` data table may contain columns `device_id`, `location`, `time`, `temperature`, `pressure`, `humidity`, etc. -->

### Cell Values

![Cell Values](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/datatable-cell-value-20220805A.webp)

Each value in a column is stored in its own cell. In general, you want to create columns that save _atomic_ values. That
means create the column to store the smallest indivisible units There is no restriction for the kinds of information to
include in a column, but there are good and bad practices. For example:

- **A Bad Column:** A `city_state_zipcode` column.
- **Good Columns:** Separate `city`, `state` and `zipcode` columns.

### Data Types

To further maintain structure and consistency, when you create a column, you must also define its data type. For
example, an `age` column might be assigned `INTEGER` and a `blog_content` column may be assigned a `STRING` or `TEXT`
data type. There are countless incongruent, unexpected, and potentially dangerous behaviors that could emerge when a
program tries to process data with the wrong data type.

To give an example, if you type the character `2`, it may be stored as an `INTEGER` or as `STRING`. If you stored `2` as
an `INTEGER`, when you try to add `2 + 2`, the computer will typically calculate `4`. In some languages, if you stored
the character `"2"` as a `STRING`, when you try to add `"2" + "2"`, the computer will concatenate them into `22`, while
in others, trying to do this may crash the program!

Therefore when you work with data, it is important to know what its data type is because the wrong data type can cause
unexpected and even dangerous behaviors in your program.

### Rows

![Rows](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/row-20220805A.webp)

Each row stores data associated to a unique record, event, object, entity, observation, etc. Data tables can contain
millions, _even billions and trillions_ of rows of data.

### Primary Keys

![Primary Key](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/primary-keys-20220805A.webp)

In order to uniquely identify and track each row, every data table must have a primary key column. A primary key is a
unique ID that identifies a specific row. Any pattern or system could be used to generate primary keys, so long as it
guarantees each key is unique. Perhaps the most common is incrementing integers, where the primary key on each new row
increments as follows `1`, `2`, `3`, `4`, etc... The primary key column guarantees you can always find a row and
differentiate it from other rows.

### Foreign Keys

![Foreign Keys](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/foreign-keys-20220805A.webp)

Since primary keys uniquely identify each and every row in a data table, they are the perfect tool to create
relationships. If you want to relationally link rows between two data tables, you create a column to store _foreign
keys_, which are simply primary keys from a foreign table. This is called a _foreign key column_, to signify it stores
the keys from a foreign table.

### Parent vs. Related Tables

When we talk about two related tables, we refer to them as the _parent table_ and the _related table_. These two terms
are based solely on perspective, similar to the terms _this_ and _that_ or the terms _here_ and _there_, signifying the
perspective from which you are looking at the relationship.

For example, within the data model, a [many-to-one relationship](#types-of-relationships) is the same as a
[one-to-many relationship](#types-of-relationships), the term used just depends on which collection you consider the
parent.

### Types of Relationships

There are several ways you can relationally link tables:

- **One to One** — Each row in the parent data table can link to one row _(max)_ in the related table.
- **Many to One** — Many rows in the parent data table can link to one row in the related table.
- **One to Many** — Each row in a data table can link to many rows in another data table.\
  _Note: in a data model, Many-to-One and One-to-Many relationships are identical. The naming difference is a matter of perspective._
- **Many to Many** — Many rows in the parent table can link to many rows in the related table. M2M relationships require
  a third table, called junction table. An M2M is nothing more than an O2M and an M2O stored on the junction table.
- **Many to Any** — Many Rows in a data table can link to many rows across any other table in the database. Similar to
  M2M relationships, M2As require a junction data table as well as an additional column on the junction table to store
  the related tables' names.

To learn more about how these relationships work conceptually, as well as how they are handled within Directus, see our
guide on [relationships](/app/data-model/relationships).

### Database Schemas

![Data Table to schema](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/datatable-to-schema-20220805A.webp)

In our examples so far, we have seen and described actual [data tables](#data-tables). As you design your relational
data model, you will need to create a schema to keep track of its complexity.

A schema is a blueprint for your data model, which defines its data tables, columns in each table, details about each
column and relationships between tables. It does not include the actual data points stored. Here is a simple schema of
two relationally linked tables:

```
table_one
- column1 (primary key)
- column2 (data type, optionally explain what the column stores)
- column3 (...)
```

```
table_two
- column1 (primary key)
- column2 (...)
- column3 (...)
- table_one_id (foreign key, relationally links rows via table_one.column1)
```

In the schema above, we defined two tables with overtly generic names `table_one`, `table_two` and `column1`, `column2`,
etc. The names you choose for data tables and columns are up to you. Ideally, you should pick unique, memorable names
that identify the data contents stored within.

In this documentation, we bend the rules of traditional database schemas in two ways. First, we sometimes add a
full-length explanation of what a column is. Notice in `table_one.column2` there is a note after the column name
`(data type, optionally....`. It is common practice to include a column's data type in a table schema, but full
descriptions are not. Second, in our examples, if columns exist in the table but its data type or other details are
irrelevant to the current learning point, we omit their details so you can focus on the important columns.

Please note too, that with more complex schemas, containing dozens _(or maybe hundreds!)_ of relationally linked data
tables, you usually include datatype information as well as a visualization of how each and every table interlinks.

![A Complex Schema](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/complex-schema.webp)

### Avoid Data Duplication

Relational databases allow us to build data models that avoid data duplication, or in other words, when you have the
same data stored in multiple locations in your database. Data Duplication is inefficient and dangerous.

To give an example, let's consider a `blog` table. In a blog, you may want to display the author's details, so you add
an `author_name` column.

```
blog
- id
- title
- content
- author_name (string, stores author's full name)
```

The table above stores the author name directly inside of the `blog` data table. However, let's imagine that along with
our blog posts, we want to display more information about authors, such as their email address, social media, etc. We
_could_ put this author information into the `blog` data table.

```
blog
- id
- title
- content
- author_name (string, stores author's full name)
- author_email (string, stores author's email)
- author_img (string, stores link to author's profile picture)
```

You might be starting to notice this data table no longer represents one single object, but two: blog posts and authors.
This is _almost always_ a sign the data should be split across different tables and relationally linked.

Now let's also imagine that authors are one type of user. All user details are stored in a `users` data table and its
data is displayed on each user profile page, for chat messaging and other types of transactions, _this is a common
situation in many projects_. In this case, the author name and other details would also need to exist in the `users`
table.

![Duplicate Data](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/duplicate-data-20220829A.webp)

This creates duplicate data. There are two big problems with this:

First, it becomes difficult or impossible to maintain accurate information. If the author decides to change their social
media information under `users`, someone would have to go through and update author details on every single row
containing their blog posts. With just 10 or even 100 blog posts, this would be annoying but perhaps not a massive
problem. However, as volume of data grows to millions or billions of rows, updating duplicate data becomes a serious
problem.

Furthermore, an error on an author's name and personal information may not be a truly dangerous situation, but
inaccurate information would be catastrophic in data tables containing banking transactions or medical records!

Second, it wastes storage space and slows down performance. With a data model containing a few hundred blog posts,
duplicate data may not take up enough space to cause huge drops in performance. But again, if you have the same
information repeated again and again over millions or billions of rows, storage is wasted on a massive scale.

### Why We Use Relational Data Models

As shown in the previous section, you want to make sure that every single data point is unique. This is where the
_relational_ part of relational data models comes into play. To avoid data duplication, it is always best practice to
_normalize your data model_, which is the technical term used to describe designing a data model so that there is no
duplicate information stored _at all_. Instead of storing all information needed in a given situation in one table, like
we saw when mixing up blog and author information above, database normalization is the process of splitting up this
information across tables and relationally linking it all together so that information is never repeated.

There is a lot to learn to master database normalization and a thorough education in the practice goes beyond the scope
of this document. There are plenty of resources to learn about it online. However, to provide one simple example by
improving the example `blog` data table provided in the previous [Avoid Data Duplication](#avoid-data-duplication)
section:

```
blog
- id
- title
- content
- author_name
- author_email
- author_img
```

As described in the section on [Rows](/app/data-model#rows), we want each row in a data table to represent one unique
record, event, object, entity, observation, etc. To do this, we can remove the `author_name` column from the `blog`
table and replace it with an `author_id` foreign key column, which stores foreign keys from the `users` table.

```
blog
- id
- title
- content
- author_id (stores foreign key from users.id)
```

```
users
- id
- name
- email
- role
- email
- twitter
```

Notice the difference. Previously, we placed the author's name directly into a column on the `blog` data table
_(creating duplicate data)_. Here, we replaced `author_name`, `author_email` and `author_img`, with the `author_id`
column, which contains foreign keys from `users`. From here, we can use the foreign key to relationally link data
between `blog` and `users`.

### Working With Relational Data Models

![Database, Backend, Frontend](https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/database-backend-frontend-20220805A.webp)

Once you've designed your data model conceptually, you typically build and interact with it using SQL, or Structured
Querying Language. This language is used to create, read & query, update, and delete anything and everything in the
database.

Once the initial data tables are designed and built, a common next step is to build a backend using something like
Node.js or Flask. In your backend, you must code custom API endpoints and logic to create, read, query, update, and
delete data for your specific data model. However, when the backend accesses data, it is still raw, with no stylization.
Raw data is easy to work with for computers, but often quite difficult to work with for humans.

To those who are unfamiliar, the SQL language, raw data, and traditional relational database jargon can feel unintuitive
and overly-technical.

It may not be practical to teach everyone on the team how to work with and think in terms of raw data. In some cases,
business users may find it difficult or nearly impossible to work with raw data. People are accustomed to see
information displayed _colorfully, stylized, embedded on a map, etc._ For example, _most people in most situations_
would find it easy to work with pinpoints on a map, yet find it nearly impossible to identify a position on a world map
from raw latitude and longitude points stored as JSON.

```json
{
	"location": {
		"lat": 36.08801,
		"lng": 120.379771
	}
}
```

Therefore, developers need to build front-ends with polished UIs and custom display logic to make working with the data
human-friendly. However, even for developers with strong SQL database skills, building out APIs and GUIs to build and
manage a data model is time consuming.

## Data Models in Directus

<video title="Settings > Data Model" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/data-model-overview-20220805A.mp4" type="video/mp4" />
</video>

All relational data model concepts listed above apply in Directus. You get complete, un-opinionated, relational data
model design and configuration. The difference is that Directus handles all SQL, builds the API, and provides a Data
Studio which lets business users work with data in a human-friendly way.

The Data Studio also offers features and functionalities to display and interact with your data intuitively. Once your
data model is configured, the data is accessible across the other [modules](/user-guide/overview/glossary#modules).

<!-- Data model configuration takes place across the following pages and menus:

**Settings > Data Model > [Collection] > [Field] > Field Configuration Drawer > [Section]** -->

You have the power to do the following things, without a line of code or SQL:

- View, configure, and manage your relational data model and asset storage.
- Configure how data is displayed within the Data Studio.
- Configure how data is interacted with by users in the Data Studio.
- Translate any and all text in the Data Studio into any language.

Directus replaces traditional relational database jargon with more user-friendly terms and concepts. Please keep in mind
that while traditional relational database jargon strictly encompasses database concepts, some of the new Directus terms
encompass these relational database concepts _plus display and interaction logic_. The following sections will introduce
Directus terms and map them to classic relational database concepts.

## Collections

<video title="Collections" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/collections-20220805A.mp4" type="video/mp4" />
</video>

A collection _is a set of [items](#items)_. This can be a 1-1 match-up with a data table in SQL, a group of other
collections, or a readonly view.

You access all collections, including built-in system collections required to power your project, under **Settings >
Data Model**. From there, click a collection to open its configurations page. To learn more, see our guide on
[collections](/app/data-model/collections).

## Fields

<video title="Fields" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/fields-20220805A.mp4" type="video/mp4" />
</video>

Fields are database columns, but with a twist.

Remember, SQL database columns store pure, raw data. From there, developers build out custom logic and UIs to determine
how this data is displayed and interacted with. In Directus, fields encompass column configurations, as well as custom
configuration over how the data is displayed and interacted with in the Data Studio. Directus also has
[alias fields](/user-guide/overview/glossary#alias), which are virtual and do not match directly to a column. To learn
more, see our guide on [fields](/app/data-model/fields).

## Items

<video title="Collections" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/items-20220805A.mp4" type="video/mp4" />
</video>

Items are data table rows, but with a twist.

Remember from our discussion above about traditional databases, the ideal relational database is _normalized_.
Unfortunately, normalized data is not always the easiest for people to imagine or envision because related data is
spread across multiple data tables. Therefore, when you access an item, you may get more than just the current
collection's row level-data, _in some cases an item may provide access to the data in related rows._

You access items from other app modules, such as [Content](/user-guide/content-module/content),
[User Directory](/user-guide/user-management/user-directory), and [File Library](/user-guide/file-library/files).

## Data Type Superset

Directus abstracts type differences between SQL vendors with a
[Data Type Superset](/user-guide/overview/glossary#data-type-superset).

## Keys and IDs

<video title="Keys and IDs" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/keys-and-ids-20220805A.mp4" type="video/mp4" />
</video>

Primary keys are called IDs in Directus fairly frequently. When you
[create a collection](/app/data-model/collections#create-a-collection), you must add an `id` field. Directus supports
the following types of IDs:

- **Auto-Incremented Integer** — IDs increment `1`, `2`, `3` up to `2^31-1` or `2,147,483,647`.
- **Auto-Incremented Big Integer** — IDs increment `1`, `2`, `3` up to `2^63-1` or `9,223,372,036,854,775,807`. _(only
  available in MySQL and PostgreSQL)_
- **Generated UUID** — Universally Unique Identifier. Creates a completely unique ID. IDs generated with this system
  _(not just in your database, but anywhere this system is used)_ are so statistically unlikely to be repeated that for
  all practical purposes they are unique.
- **Manually Entered String** — You manually type out a unique string as the ID for each item.

## Relationships

<video title="Relations" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/relationships-20220805A.mp4" type="video/mp4" />
</video>

Directus supports all standard [types of relationships](#types-of-relationships), as well as a few more of its own
compound types. To learn more, see our guide on [relationships](/app/data-model/relationships).
