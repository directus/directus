# Collections

> Collections are containers for specific groupings of Items. Each collection represents a **table** in your database.
> [Learn more about Collections](/concepts/collections/).

## Creating a Collection

1. Navigate to **Settings > Data Model**
2. Click the **Create Collection** action button in the header
3. Enter a unique **Collection Name**, keeping in mind that this is entered as a _key_ that determines the database
   table name, and is then presented in the App using the internal Title Formatter.
4. Optional: Configure the collection's **Primary Key** name and type.
   - Auto-Incremented Integer
   - Generated UUID
   - Manually Entered String
5. Optional: Enable and rename any desired **System Fields**.
   - Status
   - Sort
   - Created On
   - Created By
   - Updated On
   - Updated By
6. Click the **Finish Setup** button

::: danger Immutable Keys

The collection name, primary key name/type, and system field names can not be modified after the collection is created.

:::

::: tip Database Tables

Keep in mind that a Directus Collection is just a database table. Therefore you can import or create a table directly in
the database, and it will automatically appear within Directus. The first time you manage that table, a
`directus_collections` record will be created with default values.

:::

## Configuring a Collection

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Configure the following settings:
   - **Collection Name** — This is the key for the collection. It can not be modified, but you can override it with
     Translations (see field below).
   - **Icon** — The icon used throughout the App when referencing this collection
   - **Note** — A helpful note that explains the collection's purpose
   - **Display Template** — A [Field Template](#) that creates dynamic titles for the collection's items
   - **Hidden** — Toggles if the collection should be globally hidden. Keep in mind that Admin roles can always see all
     collections.
   - **Singleton** — For collections that will only contain a single item (eg: an "About Us" form), the
     [Collection Detail](/concepts/application/#collection-detail) will be bypassed, and users are taken directly to the
     [Item Detail](/concepts/application/#item-detail) page.
   - **Translation** — Allows translating the collection name into different languages. These
     [Schema Translations](/concepts/translations/#schema-translations) are important for multilingual projects. You can
     also "translate" a collection name into the default language — helpful for renaming technical table names.
3. **Create and configure any fields** within this Collection.
   - [Creating a Field](/guides/fields/#creating-a-field)
   - [Updating a Field](/guides/fields/#updating-a-field)
   - [Deleting a Field](/guides/fields/#deleting-a-field)
   - [Duplicating a Field](/guides/fields/#duplicating-a-field)
   - [Changing Field Order & Layout](/guides/fields/#adjusting-field-layout)
4. Optional: Configure the [Archive](#archive) and [Sort](#sort) options below.

### Archive

The archive feature allows you to enable the collection with a custom soft-delete option. Soft-delete allows users to
remove items from the App, but maintains the actual database record for easy recovery.

- **Archive Field** — The field that holds the archive value
- **Archive App Filter** — Allows users to view archived items
- **Archive Value** — The value saved in the Archive Field when archived
- **Unarchive Value** — The value saved in the Archive Field when unarchived

::: warning API Responses

Items that have been archived are still returned normally via the API. It is up to you to filter them out as needed.

:::

::: tip Automatic Setup

When creating a new Collection, you have the option of creating an optional "Status" field. If you choose to include
this field, the collection's archive settings will automatically be configured for you.

:::

### Sort

The sort feature enables manual drag-and-drop item reordering within the Directus App. This is typically shown on the
[Collection Detail](/concepts/application/#collection-detail) page/modal, and can also be used for sorting items within
a [Junction Table](/concepts/relationships/#many-to-many-m2m).

::: tip Automatic Setup

When creating a new Collection, you have the option of creating an optional "Sort" field. If you choose to include this
field, the collection's sort settings will automatically be configured for you.

:::

## Renaming a Collection

While you can not change the **Key** of a collection via Directus (as of now), you can change its **Name** and
translations.

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the Add New button under **Collection Name Translations**
3. Choose the desired **Language** (your primary language for "renaming")
4. Enter a **Translation**
5. Click the **Save** button

::: tip Special Casing

If you are trying to update the specific casing (uppercase/lowercase) for a word (eg: `Dna` to `DNA`) you will want to
add the edge-case to the
[Format Title package](https://github.com/directus/directus/tree/main/packages/format-title/src). If you feel the case
passes our [80/20 rule](https://docs.directus.io/contributing/introduction/#feature-requests) you should submit a Pull
Request to the codebase, otherwise you can update this in your instance.

:::

## Deleting a Collection

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the red **Delete Collection** action button in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::

## Adjusting a Collection Layout

1. Navigate to **Collections > [Collection Name]**
2. Click **"Layout Options"** in the Page Sidebar
3. **Configure the Layout Options** as desired

::: tip User Preferences

Any changes made to the Collection Layout Options, page filters, search queries, and advanced filters, are instantly
saved to your user preferences. This means that your experience will be the same when logging later, even if using a
different device.

:::
