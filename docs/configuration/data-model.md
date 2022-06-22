# Data Model

> The data model describes the structure of your database's schema using [Collections](/app/content-collections/)
> (database tables) and [Fields](/reference/system/fields/) (database columns).

[[toc]]

:::tip Before You Begin

Add Text Here.

:::

:::tip Learn More

Add Text Here.

::::

## Overview

<!--
Collections -> Data Tables
System Collections -> Highlight key characteristics. Link to System Collections page.
Fields -> Table Columns
Items -> Table Rows
-->

## Collections

<video title="Collections" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

## Fields

<video title="Fields" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

Fields come with the following configuration menus.

- [Schema]() — Controls the technical details of the field's database column.
- [Relationship]() — Only shown when configuring relational fields. Defines relationship and relational Triggers.
- [Field]() —
- [Interface]() — This pane includes any customization options that may be defined by the Interface.
- [Display]() — This pane includes any customization options that may be defined by the Display.
- [Validation]() —
- [Conditions]() — Conditions allow you to alter the current field's setup based on the values of other fields in the
  form.

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
