

# Collections

> You can manage your collections within the Data Model section of the App's Settings, via the
> [API Collections Endpoint](/reference/api/collections), or directly within the database. If you're unfamiliar with Directus
> Collections, please start by reading our [Understanding Collections](/concepts/platform-overview#collections) docs.

## Creating a Collection

1. Navigate to **Settings > Data Model**
2. Click the **Create Collection** action button in the header
3. Enter a unique **Collection Name**, keeping in mind that this is entered as a _key_ that
   determines the database table name, and is then presented in the App using the
   [Title Formatter](/reference/internal-helpers#title-formatter).
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

<!-- prettier-ignore-start -->
::: danger Immutable Keys
The collection name, primary key name/type, and system field names can not
be modified after the collection is created.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip Database Tables
Keep in mind that a Directus Collection is just a database table. Therefore you
can import or create a table directly in the database, and it will automatically appear within
Directus. The first time you manage that table, a `directus_collections` record will be created with
default values.
:::
<!-- prettier-ignore-end -->

## Configuring a Collection

### Fields & Layout

-   [Creating a Field](/guides/fields#creating-a-field)
-   [Updating a Field](/guides/fields#updating-a-field)
-   [Deleting a Field](/guides/fields#deleting-a-field)
-   [Duplicating a Field](/guides/fields#duplicating-a-field)
-   [Changing Field Order & Layout](/guides/fields#adjusting-field-layout)

### Collection Setup

-   **Collection Name** — This is the key for the collection. It can not be modified, but you can
    override it with Translations (see below)
-   **Icon** — The icon used throughout the App when referencing this collection
-   **Note** — A helpful note that explains the collection's purpose
-   **Display Template** — A [Field Template](#) used to create dynamic titles for the collection's
    items
-   **Hidden** — Toggles if the collection should be globally hidden. Keep in mind that Admin roles
    can always see all collections.
-   **Singleton** — Is this collection will only contain a single item (eg: an "About Us" form).
    When enabled, the [Collection Detail](/concepts/app-overview#collection-detail) will be bypassed, and users are taken directly to the
    [Item Detail](/concepts/app-overview#item-detail) page.
-   **Translation** — Allows translating the collection name into different languages. These
    [Schema Translations](/concepts/internationalization#schema-translations) are important for multilingual projects. You can also "translate" a
    collection name into the default language — helpful for renaming technical table names.

### Archive

The archive feature allows you to enable the collection with a custom soft-delete option.
Soft-delete allows users to remove items from the App, but maintains the actual database record for
easy recovery.

-   **Archive Field** — The field that holds the archive value
-   **Archive App Filter** — Allows users to view archived items
-   **Archive Value** — The value saved in the Archive Field when archived
-   **Unarchive Value** — The value saved in the Archive Field when unarchived

<!-- prettier-ignore-start -->
::: warning API Responses
Items that have been archived are still returned normally via the API. It
is up to you to filter them out as needed.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip Status Field
When creating a new Collection, you have the option of creating an optional
"Status" field. If you choose to include this field, the collection's archive settings will
automatically be configured for you.
:::
<!-- prettier-ignore-end -->

### Sort

The sort feature enables manual drag-and-drop item reordering within the Directus App. This is
typically shown on the [Collection Detail](/concepts/app-overview#collection-detail) page/modal, and can also be used for sorting items
within a [Junction Table](#).

<!-- prettier-ignore-start -->
::: tip Sort Field
When creating a new Collection, you have the option of creating an optional "Sort"
field. If you choose to include this field, the collection's sort settings will automatically be
configured for you.
:::
<!-- prettier-ignore-end -->

## Deleting a Collection

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the red **Delete Collection** action button in the header
3. Confirm this decision by clicking **Delete** in the dialog

<!-- prettier-ignore-start -->
::: danger Irreversible Change
This action is permanent and can not be undone. Please proceed with
caution.
:::
<!-- prettier-ignore-end -->