# Collections

> Each Collection represents a table in your database. They can be organized in any way that is appropriate for your
> Project.

[[toc]]

<!--
:::tip Before You Begin

Learn Directus

:::
:::tip Learn more

API docs

:::
-->

## Create a Collection

<video title="Create a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To create a Collection, follow these steps.

1. Navigate to **Settings > Data Model** and click <span mi btn>add</span> in the page header and a drawer will open.
2. Enter a unique **Collection Name**.\
   This is used as the data table key, API Collection key, and default Collection name in the App.
3. Optional: Make any other configurations as desired:
   - **Singleton** — Toggles whether the Collection holds one single Item or multiple Items.
   - **Primary Key Field** — Sets the name of the primary key field. Defaults to `id`.
   - **Type** — Sets the [type of ID](/configuration/data-model/fields/#keys-and-ids) to use for this Collection.
4. Click <span mi btn>arrow_forward</span> to confirm.
5. Enable and rename the other [Optional System Fields](#optional-system-fields) as desired.
6. Click <span mi btn>check</span> to confirm and create the Collection.

::: danger Immutable Keys

The Collection Name from step two cannot be modified after Collection creation. However, you can override how it is
displayed with [Collection Naming Translations](#collection-setup).

:::

:::warning Composite Primary Keys

Directus does not currently support composite primary keys.

:::

::: tip Database Tables

Remember, a Directus Collection is simply a database table. Therefore, you can import or create a table directly in the
database, and it will automatically appear within Directus. The first time you manage that table, a
`directus_collections` record will be created with default values.

:::

<!-- Potentially move this to Fields??? -->

### Optional System Fields

<video title="Adjust a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

- **Status** — A Field to store Item status.
- **Sort** — A Field to allow drag-and-drop sorting.
- **Created On** — A Field to log the date that the Item was created.
- **Created By** — A Field to log the User that created this Item.
- **Updated On** — A Field to log the last date updated.
- **Updated By** — A Field to log the last User to edit the file.

## Toggle Collection Visibility

<video title="Hide a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To toggle whether a Collection is hidden by default in the Content Module, follow these steps.

1. Navigate to **Settings > Data Model**.
2. Click on the <span mi icon>more_vert</span> icon.
3. Select **View Content** or **Make Collection Hidden** to adjust visibility as desired.

:::tip

Assuming a User has [access permissions](/configuration/users-roles-permissions), hidden Collections can still be
viewed. They must right-click on the Navigation Bar and choose <span mi icon>visibility</span> "Show Hidden
Collections".

:::

## Configure a Collection

<video title="Configure a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To configure a Collection, follow these steps.

1. Navigate to **Settings > Data Model**.
2. Click the desired Collection and the Collection Configuration Page will open.
3. Make Configurations as desired.
4. Click <span mi btn>check</span> to confirm.

The configuration options available on this page are broken into the following categories.

- [Fields and Layout](#fields--layout)
- [Collection Setup](#collection-setup)
- [Archive](#archive)
- [Sort](#sort)
- [Accountability](#accountability)
- [Duplication](#duplication)

:::tip

These configuration values are all accessible via the [Collections API](/reference/system/collections/) as well.

:::

### Fields & Layout

Create and manage how the Collection's Fields are displayed within the Content Module.\
To learn more, please see to the documentation on [Fields](/configuration/data-model/fields).

### Collection Setup

Modify how the Collection is displayed in the Content Module.

- **Collection Name** — This is the Collection Name, which cannot be modified.\
  However, you can override how it is displayed with Collection Naming Translations, below.
- **Note** — Write a helpful note that explains the Collection's purpose.
- **Icon** — Set an icon used throughout the App when referencing this Collection.
- **Color** — Set a color for the icon, shown in the Navigation Bar and its Header.
- **Display Template** — Creates a [Display Template](/app/display-templates) for the Collection.
- **Hidden** — Toggle whether the Collection should be globally hidden in the other App modules.\
  Keep in mind that Admin roles can always see all Collections.
- **Singleton** — Toggle to bypass the [Collection Page](/app/content/collections/) and take users to the
  [Item Details Page](/app/content/items/). This is for Collections that will only contain one single Item.
- **Collection Naming Translations** — Translate the Collection Name across multiple languages.

:::tip Collection Naming Translations

By default, Directus uses the [Title Formatter](/getting-started/glossary/#title-formatter) to display Collection keys
as human readable names, but you can also use translations to explicitly rename more technical table keys.

:::

### Archive

Select a Field to handle archiving Items. An Archive Field provides a _soft-delete_ functionality within a Collection.
Archived Items still exist in the Collection, but remain hidden away.

- **Archive Field** — Defines the Field that holds the archive value.
- **Archive App Filter** — Toggles whether app users can
  [filter for archived items](/app/content/collections/#view-archived-items).
- **Archive Value** — A value, usually a string, that is assigned when an Item as
  [archived](/app/content/items/#archive-an-item).
- **Unarchive Value** — A value, usually a string, that is assigned when an Item is
  [unarchived](/app/content/items/#archive-an-item).

:::tip Archived Item Management via API

Archived items are hidden in the App by default, but they are still returned normally via the API unless filtered out.
This gives you the flexibility to manage archived Items however you want when working with the API.

:::

:::tip Archive Field Values

The archive Field can contain any value. It is not limited to only contain archived and unarchived values defined above.

:::

:::tip Automatic Setup

When creating a new Collection, you have the option to create an optional "Status" Field. If you choose to include this
Field, the Collection's archive settings will be automatically configured for you.

:::

### Sort

**Sort Field** — Select a Field to custom sort and order Items. Click **Deselect** to disable.

<!--
@TODO
Needs further instructions.
-->

### Accountability

By default, your Directus Project tracks all [activity](/reference/system/activity) and
[revisions](/reference/system/revisions/) for Collections. However you can override this and choose what data is
tracked.

- **Activity & Revision Tracking** — The following options are supported:
  - Track Activity & Revisions
  - Only Track Activity
  - Do Not Track Anything

:::tip

Activity tracking is for your team's personal use, providing a log of _who does what_ in the Project. This is different
from [telemetry](/self-hosted/config-options/#telemetry), which is configured in environment variables.

:::

### Duplication

The **Save as Copy** option on the Item Details Page offers a way to effectively duplicate the current Item. However,
since there may be unique or relational data within the Item, it's important to control exactly what will be copied.
This option allows for configuring which parent/relational Field Values will be copied.

## Adjust a Collection Form

<video title="Adjust a Collection Form" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

The [Item Page](/app/content/items/) displays a custom form for viewing and editing each Collection's Fields. This form
is highly configurable, with the following field options:

### The <span mi icon>more_vert</span> Menu

- <span mi icon>edit</span> **Edit Field** — Opens the Field Configuration Drawer to edit the Field.
- **Visibility** — Set the Field to "visible" or "hidden" on the form. This is adjusted via the
  <span mi icon>more_vert</span> field's context menu or edit drawer.
- **Width** — Fields have three different width options relative to the form/page. This is adjusted via the Field's
  context menu or edit drawer.
  - <span mi icon>border_vertical</span> Half Width — The field is shown at half the form width.
  - <span mi icon>border_right</span> Full Width — (Default) The field is shown at the full form width.
  - <span mi icon>aspect_ratio</span> Fill Width — The field is shown filling the page width.
- **Sort** — Fields can be rearranged via <span mi icon>drag_indicator</span>.
- **Grouping** — Fields can be organized within different nested groups that are created using the normal Creating a
  Field flow. Different style groupings are available for different use-cases.

## Delete a Collection

<video title="Delete a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click <span mi btn dngr>delete</span> in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::
