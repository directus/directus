# Collections

> Collections are cool!

[[toc]]

## Create a Collection

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

## Configure a Collection

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

## Adjust a Collection

Collections can be organized in several ways, including sorting, custom translations, showing/hiding, and even grouping.
This organization is reflected in the sidebar navigation, allowing you to control how the users of the app will interact
with the various collections in your project. Configuring the organization of your collections is done on the
**Settings > Data Model** page.

## Sort & Group Collections

By using the <span mi icon>drag_indicator</span> drag handles on the left of the collection, you can manually put the
collections in an order that makes the most sense for your project. By dragging a collection underneath another
collection, you can turn any collection into a group-parent. Groups can even be nested within other groups.

Additionally, you can add special "folder" collections that are exclusively used for organizational purposes, and don't
hold any data themselves. This can be done by clicking <span mi btn sec>create_new_folder</span> in the top right of the
page.

## Rename a Collection

The key of a collection (eg. what's used in the API / database) can't be changed. However, you can alter how a
collection is displayed in your app by adding custom translations. This can be done by opening the detail page of a
collection, and modifying the "Collection Naming Translations" option. Make sure to add translations for all the
languages your app's users might use for the best results!

## Hide a Collection

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

## Adjust a Collection Form

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

## Delete a Collection

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click <span mi btn dngr>delete</span> in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::
