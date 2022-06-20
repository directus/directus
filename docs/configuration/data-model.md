# Data Model

> The data model describes the structure of your database's schema using [Collections](/app/content-collections/)
> (database tables) and [Fields](/reference/system/fields/) (database columns).

[[toc]]

## Creating a Collection

1. Click <span mi btn>add</span> in the <span mi icon dark>list_alt</span> Data Model header
2. Enter a unique **Collection Name** to be used as the database table name, API collection key, and App collection name
   default.
3. Configure the name and type of the **Primary Key**.
   - Auto-Incremented Integer
   - Auto-Incremented Big Integer (MySQL and PostgreSQL only)
   - Generated UUID
   - Manually Entered String
4. Click on <span mi btn>arrow_forward</span>
5. Optional: Enable and rename any desired **System Fields**.
   - Status
   - Sort
   - Created On
   - Created By
   - Updated On
   - Updated By
6. Click the <span mi btn>check</span> **Finish Setup** button

::: danger Immutable Keys

As of now, the key can not be modified after the collections has been created.

:::

::: tip Database Tables

Keep in mind that a Directus Collection is just a database table. Therefore you can import or create a table directly in
the database, and it will automatically appear within Directus. The first time you manage that table, a
`directus_collections` record will be created with default values.

:::

## Configuring a Collection

You can configure a collection by clicking on it within **Settings > Data Model**. The following options are available:

- **Fields & Layout** — This manages the fields of this collection, and their form layout. For more information on this
  configuration, refer to the sections below on Field Management.
  - [Creating a Field](#creating-a-field-standard)
  - [Configuring a Field](#configuring-a-field)
  - [Deleting a Field](#deleting-a-field)
  - [Duplicating a Field](#duplicating-a-field)
  - [Changing Field Order & Layout](#adjusting-the-collection-form)
- **Collection Name** — This is the key for the collection. It can not be modified, but you can override it with
  Translations (see field below).
- **Note** — A helpful note that explains the collection's purpose
- **Icon** — The icon used throughout the App when referencing this collection
- **Color** — A color for the icon, shown in the navigation and its header
- **Display Template** — A Field Template that creates dynamic titles for the collection's items
- **Hidden** — Toggles if the collection should be globally hidden. Keep in mind that Admin roles can always see all
  collections.
- **Singleton** — For collections that will only contain a single item (eg: an "About Us" form), the
  [Collection Page](/app/content-collections/) will be bypassed, taking users directly to the
  [Item Page](/app/content-items/).
- **Collection Naming Translations** — While the collection key can not be changed (as of now), this option allows
  translating the collection name into different languages. By default, the platform uses the
  [Title Formatter](/getting-started/glossary/#title-formatter) to display collection keys as human readable names, but
  you can also use translations to explicitly rename more technical table keys.

### Archive

The archive feature allows you to enable "soft-delete" within the collection. Archived items are hidden in the App by
default, but are still returned normally via the API unless they are filtered out.

- **Archive Field** — The field that holds the archive value
- **Archive App Filter** — Allows users to view archived items
- **Archive Value** — The value saved in the Archive Field when archived
- **Unarchive Value** — The value saved in the Archive Field when unarchived

::: tip Automatic Setup

When creating a new Collection, you have the option of creating an optional "Status" field. If you choose to include
this field, the collection's archive settings will automatically be configured for you.

:::

### Sort

The sort feature enables manual drag-and-drop item reordering within the Directus App. This is typically shown on the
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

### Accountability

By default, the platform tracks all [activity](/reference/system/activity) and [revisions](/reference/system/revisions/)
for collections. This option allows you to override this, choosing what data is tracked.

- **Activity & Revision Tracking** — supports the follow options:
  - Track Activity & Revisions
  - Only Track Activity
  - Do Not Track Anything

### Duplication

The "Save as Copy" option on the Item Page offers a way to effectively duplicate the current item. However, since there
may be unique or relational data within this form, it's important to control exactly what will be copied. This option
allows for configuring which parent/relational field values will be copied.

## Deleting a Collection

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click <span mi btn dngr>delete</span> in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::

## Adjusting the Collection Hierarchy

Collections can be organized in several ways, including sorting, custom translations, showing/hiding, and even grouping.
This organization is reflected in the sidebar navigation, allowing you to control how the users of the app will interact
with the various collections in your project. Configuring the organization of your collections is done on the
**Settings > Data Model** page.

### Sorting & Grouping

By using the <span mi icon>drag_indicator</span> drag handles on the left of the collection, you can manually put the
collections in an order that makes the most sense for your project. By dragging a collection underneath another
collection, you can turn any collection into a group-parent. Groups can even be nested within other groups.

Additionally, you can add special "folder" collections that are exclusively used for organizational purposes, and don't
hold any data themselves. This can be done by clicking <span mi btn sec>create_new_folder</span> in the top right of the
page.

### Renaming Collections

The key of a collection (eg. what's used in the API / database) can't be changed. However, you can alter how a
collection is displayed in your app by adding custom translations. This can be done by opening the detail page of a
collection, and modifying the "Collection Naming Translations" option. Make sure to add translations for all the
languages your app's users might use for the best results!

### Hiding Collections

1. Navigate to **Settings > Data Model**
2. Click on the <span mi icon>more_vert</span> icon
3. Select the <span mi icon>visibility_off</span> **Make Collection Hidden** option

Hidden collections can still be accessed by the user by right-clicking on the navigation, and choosing
<span mi icon>visibility</span> "Show Hidden Collections".

::: tip Permissions

If you want to prevent a user from accessing a collection altogether, you can configure the read permissions for their
role to prevent them from viewing the collection. Collections that can't be read by the user won't show up in the
navigation either.

:::

## Adjusting the Collection Form

The [Item Page](/app/content-items/) displays a custom form for viewing and editing each collection's fields. This form
is highly configurable, with the following field options:

- **Visibility** — Fields can be set to "visible" or "hidden" on the form. This is adjusted via the
  <span mi icon>more_vert</span> field's context menu or edit drawer.
- **Width** — Fields have three different width options relative to the form/page. This is adjusted via the field's
  context menu or edit drawer.
  - <span mi icon>border_vertical</span> Half Width — The field is shown at half the form width
  - <span mi icon>border_right</span> Full Width — (Default) The field is shown at the full form width
  - <span mi icon>aspect_ratio</span> Fill Width — The field is shown filling the page width
- **Sort** — Fields can be rearranged via <span mi icon>drag_indicator</span>.
- **Grouping** — Fields can be organized within different nested groups that are created using the normal Creating a
  Field flow. Different style groupings are available for different use-cases.

## Creating a Field (Standard)

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field** button
3. **Choose the desired interface** by clicking on the illustration
4. Add a **Field Key**, which is also used as the default field name
5. **Configure the field options**, including the default value, required flag, and interface options

## Creating a Field (Advanced)

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field in Advanced Mode** button
3. **Choose the field type**, and follow its setup steps below.

::: tip Database Columns

Keep in mind that a Directus Field is just a database columns. Therefore you can create a columns directly in the
database, and it will automatically appear within Directus using intelligent defaults. You can then enhance the
experience further using the following steps.

:::

### Schema

This pane controls the technical details of the field's database column.

- **Key** — (Required) The database column name and field's API key. The key must be unique within its parent
  Collection. As of now, all keys are sanitized: lowercased, alphanumeric, and with spaces removed. Keys can not be
  changed once created, however you can use [Field Name Translations](/configuration/data-model/#field) to override how
  it's displayed in the App.
- **Type** — (Required) How the data is saved to the database; See
  [Directus Data Type Superset](/getting-started/glossary/#data-type-superset). This dropdown may be limited or even
  disabled based on your chosen Field category.
- **Length** — (Only for certain types) For String types this determines the number of characters that can be stored in
  the database. For Float and Decimal types, this control becomes **Precision & Scale**.
- **On Create** — (Only for certain types) For some data types, this option allows you to control what value is saved
  when an item is created. These values are fallbacks and can be overridden by the App/API. For example, the Timestamp
  type allows you to "Save Current Date/Time".
- **On Update** — (Only for certain types) For some data types, this option allows you to control what value is saved
  when an item is updated. These values are fallbacks and can be overridden by the App/API. For example, the UUID type
  allows you to "Save Current User ID".
- **Default Value** — This is the initial value shown for a field when creating an item in the App. If creating an item
  via the API, this is the fallback value saved to the database if a field value is not submitted.
- **Allow NULL** — Toggles if the database column is nullable. When disabled, a `NULL` value can not be saved to the
  field's column.
- **Unique** — Toggles if the database column's values must all be unique.

::: danger Immutable Keys

As of now, the key can not be modified after the field has been created.

:::

::: warning Composite Keys

At this time, Directus does not support composite keys.

:::

### Relationship

This pane is only shown when configuring relational fields (including images and translations). Depending on the type of
relationship, you'll be presented with one of the following set of options:

- [Many-to-One](/configuration/relationships/#many-to-one-m2o)
- [One-to-Many](/configuration/relationships/#one-to-many-o2m)
- [Many-to-Many](/configuration/relationships/#many-to-many-m2m)
- [Many-to-Any](/configuration/relationships/#many-to-many-m2m)
- [Translations](/configuration/relationships/#translations-o2m)

::: tip Corresponding Field

[Relationships go both ways](/configuration/relationships/#perspective-matters), so when creating a new relation Field,
Directus offers to automatically create the corresponding Field on the related Collection.

:::

### Field

- **Required** — Toggles if a value for the Field is required.
  - Empty strings (`''`) and `NULL` are **not** accepted as a valid value
  - `0` and `false` are accepted as a valid value
  - Default values are accepted as a valid value
  - Permission Presets are accepted as a valid value
- **Readonly** — (App Only) Sets the field to be disabled.
- **Hidden** — (App Only) Hides the field in the App form.
  - The field is still available in filters and Layout options.
- **Note** — (App Only) Displayed below the field in the App form, providing a helpful comment for App users. This note
  supports markdown.
- **Field Name Translations** — (App Only) While the field key can not be changed (as of now), this option allows
  translating the field name into different languages. By default, the platform uses the
  [Title Formatter](/getting-started/glossary/#title-formatter) to display field keys as human readable names, but you
  can also use translations to explicitly rename more technical column keys.

### Interface

This pane includes any customization options that may be defined by the Interface.

### Display

This pane includes any customization options that may be defined by the Display.

### Conditions

Conditions allow you to alter the current field's setup based on the values of other fields in the form. This allows you
to show/hide the field, make it readonly, or change the interface options.

Each field can have one or more _rules_. Each rule has the following configuration options:

- **Name**: The name of the rule. This is only used internally for convenience purposes
- **Rule**: The rule that controls whether or not these conditions are applied. Rule follows the
  [Filter Rules](/reference/filter-rules) spec
- **Readonly**: Whether or not the field is readonly when the condition is matched
- **Hidden**: Whether or not the field is hidden when the condition is matched
- **Required**: Whether or not the field is required when the condition is matched
- **Interface Options**: Any additional configuration for the selected interface

These changes to the field are merged onto the base configuration of the field. This means you can have the field hidden
by default, and then only toggle the hidden state of the field in the condition.

::: tip Order Matters

The conditions are matched in order. The **last** condition that matches is the one that's used to apply the changes.

:::

## Creating Translated Multilingual Fields

While you could create individual fields for each translation, such as `title_english`, `title_german`, `title_french`,
and so on, this is not easily extensible, and creates a less than ideal form layout. Instead, you can use the Directus
_relational_ [Translations O2M](/configuration/relationships/#translations-o2m) interface. This uses a separate
collection to store an endless number of translations, and a separate collection of languages that can easily be added
to without having to change the schema.

Let's take a look at a basic example for "Articles":

- **`articles` Collection**
  - `id` — (Primary Key)
  - `author` — Field that is not translated
  - `date_published` — Field that is not translated
  - `translations` — A O2M relational field to `article_translations`
- **`article_translations` Collection**
  - `id` — (Primary Key)
  - `article` — The key of the article this belongs to
  - `language` — The language key of this translation
  - `title` — The translated Article Title
  - `text` — The translated Article Text
- **`languages` Collection**
  - `language_code` — (Primary Key) eg: "en-US"
  - `name` — The language name, eg: "English"

As you can see above, you add **non-translated** fields, such as the `author` and `publish_date`, to the parent
collection. Any **multilingual** fields, such as Title or Text, should be added directly to the Translation Collection.
You can not simply drag or shift fields from the parent to translations, they must be _created_ in the correct
collection.

::: tip Translating Parent Fields

To make an existing parent field translatable, you can choose "Duplicate Field" from its context menu, move it to the
translation collection, and then delete the parent field. However, be aware that this does **not** maintain any existing
field values in the process.

:::

## Configuring a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the field you want to update
3. Make any desired updates referencing the [Creating a Field](/configuration/data-model/#creating-a-field) docs above

::: tip System Fields

While all out-of-the-box system fields are locked from editing or deleting, you are able to create new fields within the
system collections. To get started, expand System Collections from the bottom of **Settings > Data Model**.

:::

## Duplicating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the <span mi icon>more_vert</span> icon for the field you want to duplicate
3. Click the <span mi icon>content_copy</span> **Duplicate Field** option

::: warning Relational and Primary Key Fields

It is not currently possible to duplicate relational fields or a collection's primary key.

:::

## Deleting a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the <span mi icon>more_vert</span> icon for the field you want to delete
3. Click the <span mi icon>delete</span> **Delete Field** option
4. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::
