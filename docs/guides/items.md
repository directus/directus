# Items

> Item are objects within a Collection which contain values for one or more fields. Each collection represents a
> **record** in your database. [Learn more about Items](/concepts/items/).

::: warning Permissions

The actions on this page assume the current user has permission to perform that action. However, certain features may be
disabled or hidden based on permissions.

:::

## Creating an Item

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection where you want to add an item
3. Click on the "Create Item" (+ icon) button located in the header
4. Complete the Item Detail form
5. Click the "Save Item" (✓ icon) button located in the header

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step
#3 above.

:::

## Updating an Item

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the item you want to update
3. Click on the item within the current layout (eg: on the row of the table)
4. Update the Item Detail form
5. Click the "Save Item" (✓ icon) button located in the header

::: tip Other Save Options

To the right of the primary Save button there is a "..." icon which contains the following alternate save options:

- Save and Stay (⌘S)
- Save and Create New (⌘⇧S)
- Save as Copy

:::

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step
#3 above.

:::

## Deleting an Item

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the item you want to delete
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Delete Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Delete"

::: tip Deleting from the Item Detail page

You can also click on an item to navigate to its Detail page. From there, you can click on the "Delete Item" (trash
icon) button located in the header.

:::

## Archiving an Item

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the item you want to archive
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Archive Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Archive"

::: warning Requires Configuration

This feature is only available if an Archive column has been configured in the Collection's data model settings.

:::

::: tip Archiving from the Item Detail page

You can also click on an item to navigate to its Detail page. From there, you can click on the "Archive Item" (archive
icon) button located in the header.

:::

## Reverting an Item

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the item you want to archive
3. Click on an item to navigate to its Detail page
4. Click "Revisions" in the page sidebar
5. Click on the revision you wish to preview
6. Click on the "Revert" button located in the drawer's header
7. Confirm the action within the dialog by clicking "Revert"

## Commenting on an Item

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the item you want to comment on
3. Click on an item to navigate to its Detail page
4. Click "Comments" in the page sidebar
5. Type your message within the input
6. Click the "Submit" button

## Manually Sorting Items

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the items you want to sort
3. Choose a layout that supports manual sorting (eg: the default "table" mode)
4. Enable manual sorting. (eg: for the table layout, click on the Sort column's header)
5. Drag items by their handle into a new position

The new sort order is saved automatically, so make sure you wait until the App's loading indicator finishes before
navigating away from the page.

::: warning Requires Configuration

This feature is only available if a Sort column has been configured in the Collection's data model settings.

:::

## Ordering Items

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to a collection of items
3. Choose a layout that supports manual ordering (eg: the default "table" mode)
4. Set the Order Field and Order Direction
   - Table Layout: Click on the field's column header, clicking again changes order direction
   - Card Layout: Adjust the two dropdowns in the layout's subheader

::: tip Sort vs Order

**Ordering** is a non-destructive action (does _not_ change your data) used to browse items alphabetically or
numerically. **Sorting** (when enabled) saves a value in a [Sort](/guides/collections/#sort) field, which can then be
used to return data in a custom order.

:::

## Adjusting Item Layouts

**[Learn more about Layouts](/concepts/layouts/)**

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the items you want to browse
3. Click "Layout Options" in the page sidebar
4. Choose the desired "Layout" you want to use
5. Configure any other layout options that come after the layout dropdown

## Searching Items

**[Learn more about Search](/guides/items/#searching-items)**

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the items you want to search
3. Type your search query into the input located in the header

## Filtering Items

**[Learn more about Filtering](/guides/items/#filtering-items).**

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the items you want to filter
3. Click "Advanced Filter" in the page sidebar
4. Click the "Add Filter" dropdown and select the field to filter on
5. Adjust the operator (eg: "Contains") as needed by clicking on it
6. Enter a value in the field filter's input(s)
7. Remove unwanted filters by hovering over the field and clicking "X"

## Bookmarking Item Presets

**[Learn more about Bookmarks](/guides/items/#bookmarking-item-presets)**

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the items you want to bookmark
3. Configure the page as desired (eg: layout, options, search, filters, order, etc)
4. Click the "Create Bookmark" (bookmark icon) button in the header beside the page title
5. Rename bookmarks by right-clicking them in the navigation sidebar and selecting "Rename Bookmark"
6. Delete bookmarks by right-clicking them in the navigation sidebar and selecting "Delete Bookmark"

## Exporting Items

**[Learn more about Exporting](guides/items/#exporting-items)**

1. Navigate to the [Collections Module](/concepts/application/#collections)
2. Navigate to the collection of the items you want to bookmark
3. Optional: Configure the dataset as desired (eg: layout, options, search, filters, order, etc)
4. Click "Export Data" in the page sidebar
5. Choose the desired format: either CSV or JSON
6. Choose whether you want to use your current Filters and Settings in the export
7. Click the "Export" button to download the file to your device
