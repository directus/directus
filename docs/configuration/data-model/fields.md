# Fields

> Fields are cool!

[[toc]]

## Overview

## Create a Field (Standard)

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field** button
3. **Choose the desired interface** by clicking on the illustration
4. Add a **Field Key**, which is also used as the default field name
5. **Configure the field options**, including the default value, required flag, and interface options

## Create a Field (Advanced)

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field in Advanced Mode** button
3. **Choose the field type**, and follow its setup steps below.

::: tip Database Columns

Keep in mind that a Directus Field is just a database column. Therefore you can create a columns directly in the
database, and it will automatically appear within Directus using intelligent defaults. You can then enhance the
experience further using the following steps.

:::

## Configure a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the field you want to update
3. Make any desired updates referencing the [Creating a Field](/configuration/data-model/#creating-a-field) docs above

::: tip System Fields

While all out-of-the-box system fields are locked from editing or deleting, you are able to create new fields within the
system collections. To get started, expand System Collections from the bottom of **Settings > Data Model**.

:::

### Sort Fields

The sort feature enables manual drag-and-drop Item reordering within the Directus App. This is typically shown on the
[Collection Page](/app/content-collections/), but can also be used for sorting items within
[Junction Tables](/getting-started/glossary/#junction-collections). Configuration is as easy as selecting the
appropriate sort field:

- **Sort Field** — Choose a field with the `integer` type. You may want to set this field to be "hidden" so it doesn't
  show up within the Item Page form.

::: tip Automatic Setup

When creating a new Collection, you have the option of creating an optional "Sort" field. If you choose to include this
field, the collection's sort settings will automatically be configured for you.

:::

::: tip Interface Sorting

To configure manual sorting within an Interface (eg: M2M, O2M, or M2A), configure as above, but also set the **Sort
Field** on the field's Relationship pane.

:::

## Duplicate a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the <span mi icon>more_vert</span> icon for the field you want to duplicate
3. Click the <span mi icon>content_copy</span> **Duplicate Field** option

::: warning Relational and Primary Key Fields

It is not currently possible to duplicate relational fields or a collection's primary key.

:::

## Delete a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the <span mi icon>more_vert</span> icon for the field you want to delete
3. Click the <span mi icon>delete</span> **Delete Field** option
4. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::
