# Fields

> You can manage your fields within the Data Model section of the App's Settings, via the [API Fields Endpoint](#), or directly within the database. If you're unfamiliar with Directus Fields, please start by reading our [Understanding Fields](#) docs.

## Creating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field** button
3. **Choose the field type**, and follow its specific setup guide...

* [Standard Field](#)
* [Presentation Field](#)
* [Many-to-One Field](#)
* [One-to-Many Field](#)
* [Many-to-Many Field](#)
* [Many-to-Any Field](#)
* [Translated Fields](#)

::: Database Fields
Keep in mind that Directus Fields are just a database columns. Therefore you can import or create a column directly in the database, and it will automatically appear within Directus. The first time you manage that column, a `directus_fields` record will be created with default values.
:::

## Duplicating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the **More Options** icon for the field you want to delete
3. Click the **Duplicate Field** option

:::warning Relational and Primary Key Fields
It is not currently possible to duplicate relational fields or a collection's primary key.
:::

## Adjusting Field Layout

The layout of the collection's form is determined by the following field options.

* **Field Visibility** — If the field is "Visible" or "Hidden"
* **Field Width** — How wide the field is shown relative to the form/page
    * Half — The field is shown at half the form width
    * Full — (Default) The field is shown at the full form width
    * Fill — The field is shown filling the page width
* **Field Sort** — The order of fields within the form
* **Field Group** — If the field is a "group" type

1. Create any desired groupings by **[Creating a Field Group](#)**
2. Click the **More Options** icon for any fields/groups to adjust visibility
3. Click the **More Options** icon for any fields to adjust width
4. **Rearrange fields and groups** with their drag-and-drop handles

## Deleting a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the **More Options** icon for the field you want to delete
3. Click the **Delete Field** option
4. Confirm this decision by clicking **Delete** in the dialog

:::danger Irreversible Change
This action is permanent and can not be undone. Please proceed with caution.
:::
