# Fields

> Fields are a specific type of value within a Collection, storing the data of your item's content. Each field represents a **column** in your database. [Learn more about Fields](/concepts/fields/).

## Creating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Under Fields & Layout, click the **Create Field** button
3. **Choose the field type**, and follow its specific setup guide...

- [Standard Field](/guides/field-types/standard-field)
- [Presentation Field](/guides/field-types/presentation-field)
- [Many-to-One Field](/guides/field-types/many-to-one-field)
- [One-to-Many Field](/guides/field-types/one-to-many-field)
- [Many-to-Many Field](/guides/field-types/many-to-many-field)
- [Many-to-Any Field](/guides/field-types/many-to-any-field)
- [Translated Fields](/guides/field-types/translated-fields)

::: tip System Fields

While all out-of-the-box system fields are locked from editing or deleting, you are able to create new fields within the system collections. You can enable editing System Collections within the Collection sidebar component of [Settings > Data Model](/concepts/databases/).

:::

::: tip Database Fields

Keep in mind that a Directus Field is just a database column. Therefore you can import or create a column directly in
the database, and it will automatically appear within Directus. The first time you manage that column, a
`directus_fields` record will be created with default values.

:::

## Updating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the field you want to update
3. Follow the specific setup guide for the field type...

- [Standard Field](/guides/field-types/standard-field)
- [Presentation Field](/guides/field-types/presentation-field)
- [Many-to-One Field](/guides/field-types/many-to-one-field)
- [One-to-Many Field](/guides/field-types/one-to-many-field)
- [Many-to-Many Field](/guides/field-types/many-to-many-field)
- [Many-to-Any Field](/guides/field-types/many-to-any-field)
- [Translated Fields](/guides/field-types/translated-fields)

::: tip

Learn more about the field options for [Adjusting the Field Layout](#adjusting-field-arrangement).

:::


## Renaming a Field

While you can not change the **Key** of a field via Directus (as of now), you can change its **Name** and translations.

1. Navigate to **Settings > Data Model > [Collection Name]**
2. **Click the Field** you want to update
3. Navigate to the **Field Tab**
4. Click the Add New button under **Field Name Translations**
5. Choose the desired **Language** (your primary language for "renaming")
6. Enter a **Translation**
7. Click the **Save** button

::: tip Special Casing

If you are trying to update the specific casing (uppercase/lowercase) for a word (eg: `Dna` to `DNA`) you will want to add the edge-case to the [Format Title package](https://github.com/directus/directus/tree/main/packages/format-title/src). If you feel the case passes our [80/20 rule](https://docs.directus.io/contributing/introduction/#feature-requests) you should submit a Pull Request to the codebase, otherwise you can update this in your instance.

:::

## Duplicating a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the **More Options** icon for the field you want to delete
3. Click the **Duplicate Field** option

::: warning Relational and Primary Key Fields

It is not currently possible to duplicate relational fields or a collection's primary key.

:::

## Adjusting Field Arrangement

The form design of the collection's fields is determined by the following options.

- **Field Visibility** — If the field is "Visible" or "Hidden"
- **Field Width** — How wide the field is shown relative to the form/page
  - Half — The field is shown at half the form width
  - Full — (Default) The field is shown at the full form width
  - Fill — The field is shown filling the page width
- **Field Sort** — The order of fields within the form
- **Field Group** — If the field is a "group" type

<!-- @TODO 1. Create any desired groupings by **[Creating a Field Group](/guides/fields)** -->

2. Click the **More Options** icon for any fields/groups to adjust visibility
3. Click the **More Options** icon for any fields to adjust width
4. **Rearrange fields and groups** with their drag-and-drop handles

## Deleting a Field

1. Navigate to **Settings > Data Model > [Collection Name]**
2. Click the **More Options** icon for the field you want to delete
3. Click the **Delete Field** option
4. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution.

:::
