# Collections

> The Collections Page displays all Items within a Collection. The page comes with highly configurable Layouts for
> browsing, visualizing, and managing these Items.

[[toc]]

## Search Items

<video autoplay muted loop controls title="Search Items">
	<source src="" type="video/mp4" />
</video>

When you input text into the search bar, it will return all Items that have a match within any Field, less Items which
have been filtered out already.

1. Navigate to the Content Module.
2. Navigate to the collection of the items you want to search.
3. Select <span mi icon>search</span> and a search bar will appear.

[overview > module bar]](/app/overview/#\_1-module-bar)

## Filter Items

**[Learn more about Filtering](/configuration/filter-rules/).**

1. Navigate to the [Content Module](/app/overview/#_1-module-bar)
2. Navigate to the collection of the items you want to filter
3. Click on Filter (filter icon) located in the header
4. Click the "Add Filter" dropdown and select the field to filter on
5. Adjust the operator (eg: "Contains") as needed by clicking on it
6. Enter a value in the field filter's input(s)
7. Remove unwanted filters by hovering over the field and clicking "X"

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

## View Archived Items

![View Archived Items](image.webp)

**[Learn more about Archive](/configuration/data-model/#archive).**

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
