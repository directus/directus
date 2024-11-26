# Relational

> Interfaces are how users interact with fields on the Item Detail page. These are the standard Relational interfaces.
> We recommend that you review [Relationships](/app/data-model/relationships) before working with Relational interfaces.

## File

![A file type form input where user can pick from three options: "Upload File From Device", "Choose Files from Library", "Import File from URL"](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-file.webp)

Interface that allows users to upload a single file of any mime-type, choose an existing file from the
[File Library](/user-guide/file-library/files), or import a file from a URL.

- **Folder**: Folder for the uploaded files. Does not affect the location of existing files.

## Image

![A file type form input where user can pick from three options: "Upload File From Device", "Choose Files from Library", "Import File from URL"](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-image.webp)

Interface that allows users to upload a single image file, choose an existing image from the
[File Library](/user-guide/file-library/files), or import an image from a URL.

- **Folder**: Folder for the uploaded files. Does not affect the location of existing files.
- **Crop to Fit**: Crop the image as needed when displaying the image.

## Files

![A file type form input where user can select and upload multiple files.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-files.webp)

Interface that allows users to upload multiple files, choose an existing image from the
[File Library](/user-guide/file-library/files), or import an image from a URL.

This field will create a [Many-To-Many (M2M)](/app/data-model/relationships#many-to-many-m2m) junction collection when
added to the [Data Model](/app/data-model) for your [Collection](/app/data-model/collections).

- **Folder**: Folder for the uploaded files. Does not affect the location of existing files.
- [**Display Template**](/user-guide/content-module/display-templates): Fields or custom text that represent the
  specific item through various places in the App Studio.
- **Creating Items**: Allow users to upload new files.
- **Selecting Items**: Allow users to select existing files.
- **Per Page**: The number of Items to show per page.

## Builder (M2A)

![A form interface that allows users to create a relationship from the current item by selecting different items from multiple, distinct Collections.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-m2a.webp)

Interface that allows users to create relationships between the current item and multiple items from multiple, distinct
collections. See [Many-to-Any (M2A) Relationships](/app/data-model/relationships#many-to-any-m2a).

Useful in many different contexts including
[creating re-usable page components](/guides/headless-cms/reusable-components).

- **Creating Items**: Allow users to create new Items in the M2A collection.
- **Selecting Items**: Allow users to select existing files in the M2A collection.
- **Per Page**: The number of Items to show per page.
- **Allow Duplicates**: Allow users to add the same Item multiple times.

## Many To Many

![A form interface that allows users to select multiple different items from a single collection. Buttons for "Create New" and "Add Existing".](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-m2m.webp)

Interface that allows users to create relationships between the current item and many different items from a single
collection.

This field will create a [Many-To-Many (M2M)](/app/data-model/relationships#many-to-many-m2m) junction collection when
added to the [Data Model](/app/data-model) for your [Collection](/app/data-model/collections).

- **Layout**: `List`, `Table`
- **Creating Items**: Allow users to create new Items in the M2M collection.
- **Selecting Items**: Allow users to select existing files in the M2M collection.
- **Per Page**: The number of Items to show per page.
- **Junction Fields Location**: `Top`, `Bottom`
- **Allow Duplicates**: Allow users to add the same Item multiple times.
- **Filter**: [Filter Rule](/reference/filter-rules) to filter down the list of Items a user can select.
- **Item link**: Show a link to the item.

## One to Many

![A form interface that allows users to select multiple items from a single collection. Buttons for "Create New" and "Add Existing".](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-o2m.webp)

Interface that allows users to create a relationship between the current item and many items from a single collection.

Adding a One To Many field to the data model will create a corresponding Many to One field in the child collection. See
[One-to-Many (O2M) Relationships](/app/data-model/relationships#one-to-many-o2m).

- **Layout**: `List`, `Table`
- **Creating Items**: Allow users to create new Items in the M2A collection.
- **Selecting Items**: Allow users to select existing files in the M2A collection.
- **Per Page**: The number of Items to show per page.
- **Junction Fields Location**: `Top`, `Bottom`
- **Allow Duplicates**: Allow users to add the same Item multiple times.
- **Filter**: [Filter Rule](/reference/filter-rules) to filter down the list of Items a user can select.
- **Item link**: Show a link to the item.

## Tree View

![A form interface that shows multiple parent and child items from the same collection. Buttons for "Create New" and "Add Existing".](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-treeview.webp)

Special One-to-Many (O2M) interface that allows users to create and manage recursive relationships between items from
the same collection.

The Tree View interface is only available on self-referencing (recursive) relationships. See
[Many-to-Any (M2A) Relationships](/app/data-model/relationships#many-to-any-m2a).

- [**Display Template**](/user-guide/content-module/display-templates): Fields or custom text that represent the
  specific item through various places in the App Studio.
- **Creating Items**: Allow users to create new Items in the collection.
- **Selecting Items**: Allow users to select existing files in the collection.
- **Filter**: [Filter Rule](/reference/filter-rules) to filter down the list of Items a user can select.

## Many to One

![A form interface that allows a user to select a single item from a collection."](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-m2o.webp)

Interface that allows users to create a relationship between the current item and a single item from a single
collection.

See [Many-to-One (M20) Relationships](/app/data-model/relationships#many-to-one-m2o)

- [**Display Template**](/user-guide/content-module/display-templates): Fields or custom text that represent the
  specific item through various places in the App Studio.
- **Creating Items**: `Enable Create Button`
- **Selecting Items**: `Enable Select Button`
- **Filter**: [Filter Rule](/reference/filter-rules) to filter down the list of Items a user can select.

## Translations

![A form interface with two columns and two fields per column - "Title" and "Content". One column contains the English translation for each field. Second column contains the French translation for each field.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-translations.webp)

Special relational Interface designed specifically to handle translations. See
[Translations (O2M)](/app/data-model/relationships#translations-o2m).

- **Language Indicator Field**: The field from your `languages` collection that identifies the language to the user.
- **Language Direction Field**: The field from your `languages` collection that identifies the text direction for a
  selected language.
- **Default Language**: Default language to use.
- **Use Current User Language**: Default to the current users language.
