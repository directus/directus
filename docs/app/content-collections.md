# Collection Page

> This is the main gateway to your content Items, providing a highly configurable Layout for browsing and visualizing
> the Items within a Collection. The Page Header includes key action buttons for sorting, filtering, creating, deleting,
> and batch editing Items.

[[toc]]

## Create an Item

<video autoplay muted loop controls title="Create an Item">
	<source src="" type="video/mp4" />
</video>

1. Navigate to the Collection that you want to add an Item to.
2. Click <span mi btn>add</span> in the Page Header.
3. Fill in the Item Details Form as desired.
4. Click <span mi btn>check</span> in the Page Header.

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step
#2 above.

:::

## Batch Edit or Delete Items

It is possible to select multiple Items to batch edit/delete from the Collections Page. Deletion will permanently delete
Items from the database, this cannot be reverted. On batch editing, the Item Details Form opens, allowing you to make
the same edit across multiple Items.

<video autoplay muted loop controls title="Batch Edit Items">
	<source src="" type="video/mp4" />
</video>

1. Navigate to the [Content Module](/app/overview/#_1-module-bar).
2. Navigate to the Collection you wish to sort.
3. In the [Sidebar](/app/overview/#_4-sidebar), choose a [Layout](/#adjust-item-layouts) that supports multiple
   selection (e.g. "table" or "card" mode).
4. Click the Items you wish to select.
   - **Table Layout:** Click <span mi icon>check_box_outline_blank</span> in the far left column to select Items.
   - **Card Layout:** Click <span mi icon>radio_button_unchecked</span> in the top left hand corner to select Items.

Once Items are selected, <span mi btn dngr>delete</span> and <span mi btn warning>edit</span> appear in the Page Header.
There are two options:

**Edit**\
5. Click <span mi btn warning>edit</span> and the Item Details Form will open.\
6. Make edits to Fields as desired.\
7. Click <span mi btn>check</span> to confirm batch edits on all Items.

**Delete**\
5. Click <span mi btn dngr>delete</span> and a popup will appear.\
6. Click **"Delete"**.

:::danger DANGER!

These actions are destructive, proceed with caution.

:::

## Manually Sort Items

<video autoplay muted loop controls title="Batch Edit Items">
	<source src="" type="video/mp4" />
</video>

1. Navigate to the [Content Module](/app/overview/#_1-module-bar).
2. Navigate to the Collection you want to sort Items in.
3. In the [Sidebar](/app/overview/#_4-sidebar), choose a [Layout](#adjust-item-layouts) that supports manual sorting
   (e.g. the default "table" mode).
4. Enable manual sorting. (eg: for the table Layout, click on the Sort column's header).
5. Drag Items by their handle into a new position.

The new sort order is saved automatically, so make sure you wait until the App's loading indicator finishes before
navigating away from the page.

::: warning Requires Configuration

This feature is only available if a Sort column has been configured in the Collection's Data Model Settings.

:::

## Order Items

![Order Items](image.webp)

1. Navigate to the [Content Module](/app/overview/#_1-module-bar).
2. Navigate to the Collection you wish to sort.
3. In the [Sidebar](/app/overview/#_4-sidebar), choose a [Layout](/#adjust-item-layouts) that supports ordering (e.g.
   "table" or "card" mode).
4. Set the Order Field and Order Direction.
   - **Table Layout:** Click on the Field's column Header, clicking again changes order direction.
   - **Card Layout:** Adjust the Sort Field and Sort Direction dropdowns in the Layout's Subheader.

::: tip Sort vs Order

**Ordering** is a non-destructive action (does _not_ change your data) used to browse Items alphabetically or
numerically. **Sorting** (when enabled) saves a value in a [Sort Field](/reference/query/#sort), which can then be used
to return data in a custom order.

:::

## Adjust Item Layouts

**[Learn more about Layouts](/getting-started/glossary/#layouts)**

![Adjust Item Layouts](image.webp)

1. Navigate to the [Content Module](/app/overview/#_1-module-bar).
2. Navigate to the Collection of the Items you want to browse.
3. In the page Sidebar, click **"Layout Options"**.
4. Choose the desired Layout you want to use.
5. Configure any other Layout options as desired.

### Table Layout

![Table Layout](image.webp)

Supports all forms of data, and is therefore the default within the Content module. It includes the following
features/options:

- Toggle & Reorder Field Columns (Option)
- Row Spacing (Option)
- Manual Item Ordering
- Column Sort
- Column Resizing
- Select All

### Card Layout

![Card Layout](image.webp)

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

![Calendar Layout](image.webp)

An excellent choice for temporal (date/time) data, this Layout allows you to choose between a Month, Week, Day, and List
view. The following options are included:

- Display Template
- Start Date Field
- End Date Field

### Map Layout

![Map Layout](image.webp)

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

## View Archived Items

**[Learn more about Archive](/configuration/data-model/#archive).**

![View Archived Items](image.webp)

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to view
3. Click "Archive" in the page sidebar
4. Choose the desired view: `Show Items` (default), `Show Archived Items`, or `Show Items + Archived Items`

## Bookmark Item Presets

![Bookmark Item Presets](image.webp)

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to bookmark
3. Configure the page as desired (eg: layout, options, search, filters, order, etc)
4. Click the "Create Bookmark" (bookmark icon) button in the header beside the page title
5. Rename bookmarks by right-clicking them in the navigation sidebar and selecting "Rename Bookmark"
6. Delete bookmarks by right-clicking them in the navigation sidebar and selecting "Delete Bookmark"

## Import / Export Items

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
