# Collection Page

> This is the main gateway to your content items, providing a highly configurable Layout for browsing and visualizing
> the items within a collection. The header of this page includes key action buttons for creating, deleting, and batch
> editing items.

[[toc]]

## Creating an Item

1. Navigate to the collection where you want to add an item
2. Click on the "Create Item" (+ icon) button located in the header
3. Complete the Item Detail form
4. Click the "Save Item" (✓ icon) button located in the header

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step
#2 above.

:::

## Manually Sorting Items

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
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

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to a collection of items
3. Choose a layout that supports manual ordering (eg: the default "table" mode)
4. Set the Order Field and Order Direction
   - Table Layout: Click on the field's column header, clicking again changes order direction
   - Card Layout: Adjust the two dropdowns in the layout's subheader

::: tip Sort vs Order

**Ordering** is a non-destructive action (does _not_ change your data) used to browse items alphabetically or
numerically. **Sorting** (when enabled) saves a value in a [Sort](/reference/query/#sort) field, which can then be used
to return data in a custom order.

:::

## Adjusting Item Layouts

**[Learn more about Layouts](/getting-started/glossary/#layouts)**

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to browse
3. Click "Layout Options" in the page sidebar
4. Choose the desired "Layout" you want to use
5. Configure any other layout options

### Table Layout

Supports all forms of data, and is therefore the default within the Content module. It includes the following
features/options:

- Toggle & Reorder Field Columns (Option)
- Row Spacing (Option)
- Manual Item Ordering
- Column Sort
- Column Resizing
- Select All

### Card Layout

This tiled layout is ideal for collections that prioritize an image, and is the default for both the
[User Directory](/app/user-directory/) and [File Library](/reference/files/). It includes the following
features/options:

- Image Source (Option)
- Title (Option)
- Subtitle (Option)
- Image Fit (Option)
- Fallback Icon (Option)
- Card Size
- Sort Field & Direction
- Select All

### Calendar Layout

An excellent choice for temporal (date/time) data, this Layout allows you to choose between a Month, Week, Day, and List
view. The following options are included:

- Display Template
- Start Date Field
- End Date Field

### Map Layout

For geospatial/geographic data, the Map Layout provides a world map for points, lines, and other geometry. The following
options are available:

- Basemap
- Location Field
- Display Template
- Enable Clustering

## Searching Items

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to search
3. Type your search query into the input (magnifying glass icon) located in the header

## Filtering Items

**[Learn more about Filtering](/configuration/filter-rules/).**

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to filter
3. Click on Filter (filter icon) located in the header
4. Click the "Add Filter" dropdown and select the field to filter on
5. Adjust the operator (eg: "Contains") as needed by clicking on it
6. Enter a value in the field filter's input(s)
7. Remove unwanted filters by hovering over the field and clicking "X"

## Viewing Archived Items

**[Learn more about Archive](/configuration/data-model/#archive).**

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to view
3. Click "Archive" in the page sidebar
4. Choose the desired view: `Show Items` (default), `Show Archived Items`, or `Show Items + Archived Items`

## Bookmarking Item Presets

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to bookmark
3. Configure the page as desired (eg: layout, options, search, filters, order, etc)
4. Click the "Create Bookmark" (bookmark icon) button in the header beside the page title
5. Rename bookmarks by right-clicking them in the navigation sidebar and selecting "Rename Bookmark"
6. Delete bookmarks by right-clicking them in the navigation sidebar and selecting "Delete Bookmark"

## Importing / Exporting Items

### Import

**[Learn more about Import Data from a File](/reference/system/utilities/#import-data-from-file)**

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to import
3. Click "Import / Export" in the page sidebar
4. Choose the desired file containing items to import in the accepted format: either CSV or JSON
5. Click the "Start Import" button to import the items from the chosen file

### Export

1. Navigate to the collection of the items you want to export
2. Optional: Configure the dataset as desired (eg: layout, options, search, filters, order, etc)
3. Click "Import / Export" in the page sidebar
4. Choose the desired format: either CSV, JSON or XML
5. Choose whether you want to use your current Filters and Settings in the export
6. Click the "Start Export" button to download the file to your device
