# Collections

> Collections are data tables and come with all the same power and functionality, despite the less technical name.

<!--
@TODO finish Collections headline.
Throughout the app, data is represented as Collections of Items, instead of rows of data.
-->

[[toc]]

<!--
:::tip Before You Begin

Learn Directus
Read Data Model Introduction

:::
:::tip Learn more

API documentation

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
3. Optional: Make any other configurations as desired.
   - **Singleton** — Toggles whether the Collection is a [Singleton](#configure-a-collection-collection-setup).
   - **Primary Key Field** — Sets the name of the primary key field, defaults to `id`.
   - **Type** — Sets the [type of ID](/configuration/data-model/fields/#keys-and-ids) to use for this Collection.
4. Click <span mi btn>arrow_forward</span> to confirm.
5. Enable and rename the other Optional System Fields as desired:
   - **Status** — Stores Item status.
   - **Sort** — Enables drag-and-drop sorting of Items.
   - **Created On** — Stores the date that the Item was created.
   - **Created By** — Stores the User that created this Item.
   - **Updated On** — Stores the last date updated.
   - **Updated By** — Stores the last User to edit the file.
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
database and it will automatically appear within Directus. The first time you manage that table, a
`directus_collections` record will be created with default values. To learn more, see the docs on
[Directus Collections](/configuration/data-model/system-collections/#collections).

:::

<!-- Potentially move this to Fields??? -->

## Toggle Collection Visibility

<video title="Hide a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To toggle whether a Collection is hidden by default in the Content Module, follow these steps.

1. Navigate to **Settings > Data Model**.
2. Click <span mi icon>more_vert</span> to open the Collection's Context Menu.
3. Select **View Content** or **Make Collection Hidden** to adjust visibility as desired.

:::tip

Assuming a User has [access permissions](/configuration/users-roles-permissions), hidden Collections can still be
viewed. They must right-click on the Navigation Bar and choose <span
mi icon>visibility</span> **Show Hidden Collections**.

:::

## Create a Folder

<video title="Create a Folder" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

Folders allow you to subnest and group how Collections are displayed. This feature simply changes how the Collections
are displayed under **Settings > Data Model** and in the Content Module. It has no impact on the data model. To create a
Folder, follow these steps.

1. Navigate to **Settings > Data Model**.
2. Click <span mi btn>create_new_folder</span> in the page header.
3. Set a Folder Key, which will be used as the Folder's name.
4. Optional: Set the Folder Icon, Color, Note and Translations as desired.
5. Click **Save** to create your Folder.

## Toggle Folder Display

<video title="Toggle Folder Display" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

1. Navigate to **Settings > Data Model**.
2. Click the Folder icon on the desired Collection to toggle the following displays:
   - **Start Open**
   - **Start Collapsed**
   - **Always Open**

## Sort and Nest Collections

<video title="Configure a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To sort and nest Collections in **Settings > Data Model** and **Content Module**, follow these steps.

1. Navigate to **Settings > Data Model**.
2. Click and drag <span mi icon>drag_handle</span> to position Collections as desired.\
   To nest a Collection, drag below and to the right of an intended parent Folder or Collection.

## Configure a Collection

<video title="Configure a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To configure a Collection, follow these steps.

1. Navigate to **Settings > Data Model** and click the desired Collection.\
   The Collection's Configuration Page will open.
2. Make Configurations as desired.
3. Click <span mi btn>check</span> to confirm.

The configuration options available on this page are broken into the following six categories.

- [Fields and Layout](/configuration/data-model/collections/#configure-a-collection-fields-layout)
- [Collection Setup](/configuration/data-model/collections/#configure-a-collection-collection-setup)
- [Archive](/configuration/data-model/collections/#configure-a-collection-archive)
- [Sort](/configuration/data-model/collections/#configure-a-collection-sorts)
- [Accountability](/configuration/data-model/collections/#configure-a-collection-accountability)
- [Duplication](/configuration/data-model/collections/#configure-a-collection-duplication)

:::tip

A Collection's configuration details are also accessible via the [Collections API](/reference/system/collections/).

:::

## Configure a Collection: Fields & Layout

![Fields and Layout](image.webp)

This section allows you to create and manage Fields as well as configure how they are displayed on the
[Item Page](/app/content/items). To learn more, please see the documentation on
[Fields](/configuration/data-model/fields).

## Configure a Collection: Collection Setup

<video title="Collection Setup" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

Modify how the Collection is displayed in the Content Module.

- **Collection Name** — Displays the Collection Name, which cannot be modified.\
  However, you can override how it is displayed with Collection Naming Translations, below.
- **Note** — Set a helpful note that explains the Collection's purpose.
- **Icon** — Set an icon used throughout the App when referencing this Collection.
- **Color** — Set a color for the icon, shown in the Navigation Bar and its Header.
- **Display Template** — Create a [Display Template](/app/display-templates) for the Collection.
- **Hidden** — Toggle whether the Collection should be globally hidden in the other App modules.\
  Keep in mind that Admin roles can always see all Collections.
- **Singleton** — Toggle to bypass the [Collection Page](/app/content/collections/) and take users to the
  [Item Details Page](/app/content/items/).\
- **Collection Naming Translations** — Translate the Collection Name across multiple languages. When the default
  language is changed in [Project Settings](/configuration/project-settings/#general) or
  [User Details Page](/app/user-directory/#user-details-page), the relevant translation, if any exists, will be used
  throughout the App.

:::tip Collection Naming Translations

By default, Directus uses the [Title Formatter](/getting-started/glossary/#title-formatter) to display Collection keys
as human readable names, but you can also use translations to explicitly rename more technical table keys.

:::

:::tip What's a Singleton?

A Singleton is a Collection that will only contain one single Item, such as data on an About Us page on a website.

:::

## Configure a Collection: Archive

<video title="Archive" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

Select a Field to handle archiving Items. This provides a _soft-delete_ functionality for Items in a Collection.
Archived Items will still exist in the Collection and database, but can be filtered for.\
To configure an Archive Field, follow these steps.

- **Archive Field** — Selects the Archive Field from a dropdown menu.
- **Archive App Filter** — Toggles whether app users can
  [filter for archived items](/app/content/collections/#view-archived-items).
- **Archive Value** — A value that is assigned to the Field when an Item as
  [archived](/app/content/items/#archive-an-item).
- **Unarchive Value** — A value that is assigned to the Field when an Item is
  [unarchived](/app/content/items/#archive-an-item).

:::tip Automatic Setup

When creating a new Collection, you have the option to create an optional [Status Field](#optional-system-fields). If
you choose to include this Field, the Collection's archive settings will be automatically configured for you.

:::

:::tip Archive Field Values

The Archive Fields can contain any number of additional values besides the archived and unarchived values defined above.

:::

:::tip Archived Item Management via API

Archived items are hidden in the App by default, but they are still returned normally via the API unless explicitly
filtered out. This gives you the flexibility to manage archived Items however you want when working with the API.

:::

## Configure a Collection: Sort

<video title="Sort" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>
<!--
@TODO
Use the video from /app/content/collection/#manually-sort-items
-->

When you configure a Sort Field, you have the option to manually
[sort Items](/app/content/collection/#manually-sort-items) in any position you desire. As shown in the video, Fields
which cannot serve as Sort Fields will be grayed out and un-selectable in the **Sort Field** dropdown. A Standard Field
that stores Integer Type data is required.

**Sort Field** — Select a Field to custom sort and order Items. Click **Deselect** to disable.

## Configure a Collection: Accountability

<video title="Accountability" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

By default, your Directus Project tracks all [activity](/reference/system/activity) and
[revisions](/reference/system/revisions/) for Collections. However, you can override this and choose what data is
tracked.

- **Activity & Revision Tracking** — The following options are supported:
  - **Track Activity & Revisions**
  - **Only Track Activity**
  - **Do Not Track Anything**

:::tip Accountability vs. Telemetry

This is a log of _who does what_ in the Project and is for your team's own use. This is different from
[telemetry](/self-hosted/config-options/#telemetry), which is configured in environment variables.

:::

## Configure a Collection: Duplication

<video title="Duplication" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

The **Save as Copy** option on the Item Page offers a way to effectively duplicate the current Item. This option lets
you configure which parent/relational Field Values will be copied. However, since there may be unique or relational data
within the Item, it's important to control exactly what will be copied.

- **Item Duplication Fields** — Check the Field(s) to copy values for when duplicating an Item.

## Delete a Collection

<video title="Delete a Collection" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

To delete a Collection, follow these steps.

1. Navigate to **Settings > Data Model > [Collection Name]**.
2. Click <span mi btn dngr>delete</span> in the page header.
3. Confirm this decision by clicking **Delete** in the dialog.

::: danger

This action is permanent and irreversible. Please proceed with caution.

:::
