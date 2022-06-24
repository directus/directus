# Data Model

> The data model describes the structure of your database's schema using [Collections](/app/content-collections/)
> (database tables) and [Fields](/reference/system/fields/) (database columns).

[[toc]]

<!--
:::tip Before You Begin

You will need foundational knowledge of relational database concepts.
(link to MDN, web3, and ???)

:::

:::tip Learn More

Add Text Here.

:::
-->

<!--
## What's a Data Model?

<video title="What's a Data Model?" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

An SQL data model is very similar to an excel spreadsheet.
A database is composed of Data Tables.
Data Tables are composed of rows and columns.
Columns represent a value-category.
Each row in an SQL data table is basically a group of column values which are associated.

Each row could be a Product, user, order, blog post, or anything else you can think of.
-> Image of the above Items... potentially a Vue Component...

That brings up another point.
You will often have multiple *things* to store data for.
Therefore, most SQL projects have multiple tables with related and unrelated data.
or your project may also have value-categories that are associated with multiple Items.

DRY -> relations

- Link to System Collections page.
- Fields are table columns.
- Types -> Bool, Int, String, JSON, etc.
- File Storage -> Basic intro, refer to system collections.

Settings > Data Model > Collection Configuration Page > Field Configuration Drawer

## Data Models in Directus

<video title="Data Models in Directus" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>
-->

## Overview

Directus uses more user-friendly terms to describe SQL data model concepts:

- [Collections]()
- [Fields]()
- [Field Type]()
- [Field Value]()
- [Items]()
- [Keys and IDs]()
- [Relations]()

## Collections

<video title="Collections" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

<!-- Link system Collections in a line of text -->

## Fields

<video title="Fields" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

The Field Configuration Drawer is composed of the following subsections.

- [Schema]() — Controls the technical details of the Field's database column.
- [Relationship]() — Only shown when configuring relational fields. Defines relationship and relational Triggers.
- [Field]() —
- [Interface]() — This pane includes any customization options that may be defined by the Interface.
- [Display]() — This pane includes any customization options that may be defined by the Display.
- [Validation]() —
- [Conditions]() — Conditions allow you to alter the current field's setup based on the values of other fields in the
  form.

## Field Types

## Keys and IDs

<video title="Fields" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

<!-- When you create a Collection, you must add an ID Field so the database can keep proper track of the Collection's Items and its [relations](#relations), if any exist, to other Collections. Directus supports the following types of IDs and you will define your ID every time you [create a Collection](/configuration/data-model/collections/#create-a-collection). -->

- **Auto-Incremented Integer**
- **Auto-Incremented Big Integer** _(MySQL and PostgreSQL only)_
- **Generated UUID**
- **Manually Entered String**

## Relations

<video title="Relations" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

<!--
Explain what a relationship is, what it looks like, and why we need them.
Link to the relationships page.
-->

## Items

<!--
Items are composed of all the things above, so they should be addressed last.
-->
