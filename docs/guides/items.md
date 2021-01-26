# Items

> You can browse and manage items from within the App, via the [API Items Endpoint](/reference/api/items), or directly within the database. 
> If you're unfamiliar with Directus Items, please start by reading our [Understanding Items](/concepts/platform-overview#items) docs.

# Managing Items

Managing items includes the basics of Create, Read, Update, and Delete — as well as more specific features such as Archiving, Reverting, Commenting, and Reordering. 
Each of the guides below also includes a link to any relevant concepts.

<!-- prettier-ignore-start -->
:::warning Permissions
All of the action on this page assume that the current user has permission to perform the action. 
If they do not, then certain buttons or features may be disabled or altogether hidden.
:::
<!-- prettier-ignore-end -->

## Creating Items

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection where you want to add an item
3. Click on the "Create Item" (+ icon) button located in the header
4. Complete the Item Detail form
5. Click the "Save Item" (✓ icon) button located in the header

<!-- prettier-ignore-start -->
:::tip Singletons
If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step #3 above.
:::
<!-- prettier-ignore-end -->

## Updating Items

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the item you want to update
3. Click on the item within the desired layout (eg: on the row of the table)
4. Update the Item Detail form
5. Click the "Save Item" (✓ icon) button located in the header

<!-- prettier-ignore-start -->
:::tip Singletons
If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step #3 above.
:::
<!-- prettier-ignore-end -->

## Deleting Items

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the item you want to delete
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Delete Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Delete"

<!-- prettier-ignore-start -->
:::tip Deleting from the Item Detail page
You can also click on an item to navigate to its Detail page. From there, you can click on the "Delete Item" (trash icon) button located in the header.
:::
<!-- prettier-ignore-end -->

## Archiving an Item

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the item you want to archive
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Archive Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Archive"

<!-- prettier-ignore-start -->
:::warning Requires Configuration
This feature is only available if an Archive column has been configured in the Collection's data model settings.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
:::tip Archiving from the Item Detail page
You can also click on an item to navigate to its Detail page. From there, you can click on the "Archive Item" (archive icon) button located in the header.
:::
<!-- prettier-ignore-end -->

## Reverting Items

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the item you want to archive
3. Click on an item to navigate to its Detail page
4. Click "Revisions" in the page sidebar
5. Click on the revision you wish to preview
6. Click on the "Revert" button located in the drawer's header
7. Confirm the action within the dialog by clicking "Revert"

## Commenting on Items

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the item you want to comment on
3. Click on an item to navigate to its Detail page
4. Click "Comments" in the page sidebar
5. Type your message within the input
6. Click the "Submit" button

## Reordering Items

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the items you want to reorder
3. Choose a layout that supports reordering (eg: the default "table" mode)
4. Enable manual sorting. (eg: for the table layout, click on the Sort column's header)
5. Drag items by their handle into a new position

The new order is saved automatically, so make sure you wait until the App's loading indicator finishes before navigating away from the page.

<!-- prettier-ignore-start -->
:::warning Requires Configuration
This feature is only available if a Sort column has been configured in the Collection's data model settings.
:::
<!-- prettier-ignore-end -->

# Browsing Items

In order to view, update or delete a specific item, you first need to be able to find it. 
Directus includes a number of features to make browsing items as fast and efficient as possible, each of which are described below.

## Adjusting Item Layouts

**[Learn more about the concept of layouts.](#)**

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the items you want to browse
3. Click "Layout Options" in the page sidebar
4. Choose the desired "Layout" you want to use
5. Configure any other layout options that come after the layout dropdown

## Searching Items

**[Learn more about the concept of search.](#)**

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the items you want to search
3. Type your search query into the input located in the header

## Filtering Items

**[Learn more about the concept of filtering.](#)**

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the items you want to filter
3. Click "Advanced Filter" in the page sidebar
4. Click the "Add Filter" dropdown and select the field to filter on
5. Adjust the operator (eg: "Contains") as needed by clicking on it
6. Enter a value in the field filter's input(s)
7. Remove unwanted filters by hovering over the field and clicking "X"

## Bookmarking Item Presets

**[Learn more about the concept of bookmarks.](#)**

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the items you want to bookmark
3. Configure the page as desired (eg: layout, options, search, filters, order, etc)
4. Click the "Create Bookmark" (bookmark icon) button in the header beside the page title
5. Rename bookmarks by right-clicking them in the navigation sidebar and selecting "Rename Bookmark"
6. Delete bookmarks by right-clicking them in the navigation sidebar and selecting "Delete Bookmark"

## Exporting Items

**[Learn more about the concept of exporting.](#)**

1. Navigate to the [Collections Module](/concepts/app-overview#collections)
2. Navigate to the collection of the items you want to bookmark
3. Optional: Configure the dataset as desired (eg: layout, options, search, filters, order, etc)
4. Click "Export Data" in the page sidebar
5. Choose the desired format: either CSV or JSON
6. Choose whether you want to use your current Filters and Settings in the export
7. Click the "Export" button to download the file to your device
