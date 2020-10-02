# Collections

> TK

## Creating a Collection

1. Navigate to **Settings > Data Model**
2. Click the **Create Collection** ("+") action button in the header
3. Enter a unique **Collection Name**, keeping in mind that this is entered as a _key_ that determines the database table name, and is then presented in the App using the [Title Formatter](#).
4. Optional: Configure the collection's **Primary Key** name and type.
    * Auto-Incremented Integer
    * Generated UUID
    * Manually Entered String
4. Optional: Enable and rename any desired **System Fields**.
    * Status
    * Sort
    * Created On
    * Created By
    * Updated On
    * Updated By
5. Click the **Finish Setup** button

:::danger Immutable Keys
 The collection name, primary key name/type, and system field names can not be modified after the collection is created.
:::

::: Database Tables
Keep in mind that Directus Collections are just a database tables. Therefore you can import or create a table directly in the database, and it will automatically appear within Directus. The first time you manage that table, a `directus_collections` record will be created with default values.
:::

## Configuring a Collection

### Fields & Layout

* [Creating a Field](#)
* [Updating a Field](#)
* [Deleting a Field](#)
* [Duplicating a Field](#)
* [Changing Field Order & Layout](#)

### Collection Setup

* **Collection Name** — This is the key for the collection. It can not be modified, but you can override it with Translations (see below)
* **Icon** — The icon used throughout the App when referencing this collection
* **Note** — A helpful note that explains the collection's purpose
* **Display Template** — A [Field Template](#) used to create dynamic titles for the collection's items
* **Hidden** — Toggles if the collection should be globally hidden. Keep in mind that Admin roles can always see all collections.
* **Singleton** — Is this collection will only contain a single item (eg: an "About Us" form). When enabled, the [Item Browse](#) will be bypassed, and users are taken directly to the [Item Detail](#) page.
* **Translation** — Allows translating the collection name into different languages. These [Schema Translations](#) are important for multilingual projects. You can also "translate" a collection name into the default language — helpful for renaming technical table names.

### Archive

The archive feature allows you to enable the collection with a custom soft-delete option. Soft-delete allows users to remove items from the App, but maintains the actual database record for easy recovery.

* **Archive Field** — The field that will determine the
* **Archive App Filter** —
* **Archive Value** —
* **Unarchive Value** —

### Sort

## Deleting a Collection
