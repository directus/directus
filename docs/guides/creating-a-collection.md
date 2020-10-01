# Collections

> TK

## Creating a Collection in Directus

1. Navigate to **Settings > Data Model**
2. Click the **Create Collection** ("+") action button in the header
3. Enter a unique **Collection Name**, keeping in mind that this is entered as a _key_ that determines the database table name, and is then presented in the App using the [Title Formatter](#).
4. Optional: Configure the collection's primary key name and type.
    * Auto-Incremented Integer
    * Generated UUID
    * Manually Entered String
4. Optional: Enable and rename any desired system fields.
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
Keep in mind that a Directus Collection is essentially just a database table. Therefore you can import or create a table directly in the database, and it will automatically appear in Directus. The first time you manage that table, a record will be created within `directus_collections` with default values.
:::

## Configuring a Collection

## Archive

## Sort

## Deleting a Collection
