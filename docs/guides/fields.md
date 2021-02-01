
# Fields

> You can manage your fields within the Data Model section of the App's Settings, via the
> [API Fields Endpoint](/reference/api/fields), or directly within the database. If you're
> unfamiliar with Directus Fields, please start by reading our
> [Understanding Fields](/concepts/data-model) docs.

## Creating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field** button
3. **Choose the field type**, and follow its specific setup guide...

-   [Standard Field](/guides/field-types/standard-field)
-   [Presentation Field](/guides/field-types/presentation-field)
-   [Many-to-One Field](/guides/field-types/many-to-one-field)
-   [One-to-Many Field](/guides/field-types/one-to-many-field)
-   [Many-to-Many Field](/guides/field-types/many-to-many-field)
-   [Many-to-Any Field](/guides/field-types/many-to-any-field)
-   [Translated Fields](/guides/field-types/translated-fields)

<!-- prettier-ignore-start -->
::: tip Database Fields
Keep in mind that a Directus Field is just a database column. Therefore you
can import or create a column directly in the database, and it will automatically appear within
Directus. The first time you manage that column, a `directus_fields` record will be created with
default values.
:::
<!-- prettier-ignore-end -->

## Updating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the field you want to update
3. Follow the specific setup guide for the field type...

-   [Standard Field](/guides/field-types/standard-field)
-   [Presentation Field](/guides/field-types/presentation-field)
-   [Many-to-One Field](/guides/field-types/many-to-one-field)
-   [One-to-Many Field](/guides/field-types/one-to-many-field)
-   [Many-to-Many Field](/guides/field-types/many-to-many-field)
-   [Many-to-Any Field](/guides/field-types/many-to-any-field)
-   [Translated Fields](/guides/field-types/translated-fields)

<!-- prettier-ignore-start -->
::: tip 
Learn more about the field options for [Adjusting the Field Layout](#adjusting-field-layout).
:::
<!-- prettier-ignore-end -->

## Duplicating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the **More Options** icon for the field you want to delete
3. Click the **Duplicate Field** option

<!-- prettier-ignore-start -->
::: warning Relational and Primary Key Fields
It is not currently possible to duplicate relational
fields or a collection's primary key.
:::
<!-- prettier-ignore-end -->

## Adjusting Field Layout

The layout of the collection's form is determined by the following field options.

-   **Field Visibility** — If the field is "Visible" or "Hidden"
-   **Field Width** — How wide the field is shown relative to the form/page
    -   Half — The field is shown at half the form width
    -   Full — (Default) The field is shown at the full form width
    -   Fill — The field is shown filling the page width
-   **Field Sort** — The order of fields within the form
-   **Field Group** — If the field is a "group" type

<!-- @TODO 1. Create any desired groupings by **[Creating a Field Group](/guides/fields)** -->

2. Click the **More Options** icon for any fields/groups to adjust visibility
3. Click the **More Options** icon for any fields to adjust width
4. **Rearrange fields and groups** with their drag-and-drop handles

## Deleting a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the **More Options** icon for the field you want to delete
3. Click the **Delete Field** option
4. Confirm this decision by clicking **Delete** in the dialog

<!-- prettier-ignore-start -->
::: danger Irreversible Change
This action is permanent and can not be undone. Please proceed with
caution.
:::
<!-- prettier-ignore-end -->
