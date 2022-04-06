# Collection Page

> The Collection Page displays all Items within a Collection. The page comes with highly configurable Layouts for
> browsing, visualizing, and managing these Items.

[[toc]]

## Search Items

<video autoplay muted loop controls title="Search Items">
	<source src="" type="video/mp4" />
</video>

Input a string or number into the search bar to find all Items that have one or more Fields that contain your string or
number, not including any Items which have been [filtered out](#filter-items). To search through a Collection's Items,
follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Select <span mi icon>search</span> in the Page Header and a search bar will appear.
3. Type in the string or number to search by. The page will display Items that have a matching string or number value in
   one or more of its Fields.

## Filter Items

![Filter Items](image.webp)

It is possibly to conditionally [filter](/app/filters/) which Items are displayed on the Collection page. To filter a
Collection's Items, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Select <span mi icon>filter_list</span> in the Page Header.
3. Apply any [Filters](/app/filters/) as needed.

## Manually Sort Items

<video autoplay muted loop controls title="Batch Edit Items">
	<source src="" type="video/mp4" />
</video>

Drag-and-drop Items to custom-sort them as desired. This is only possible on certain Layouts, such as the default
[Table Layout](/app/content-layouts/#table-layout). To sort a Collection's Items, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. In the Sidebar, choose a [Layout](/app/content-layouts) that supports manual sorting.
3. Enable manual sorting:
   - For the Table Layout, toggle <span mi icon>sort</span> in the configured Sort column.
4. Drag Items by their handle into a new position.

::: warning Sorting Requires Configuration

Only available if a Sort column has been configured in the Collection's Data Model Settings.

:::

::: tip

The new sort order is saved automatically, so make sure you wait until the App's loading indicator finishes before
navigating away from the page.

:::

:::tip

Sorting saves a value in a [Sort Field](/reference/query/#sort). This value is used to return data in a custom order.
The key takeaway is that while the values in this Sort Field do get updated and modified, values in other Fields are not
changed.

:::

## Order Items

![Order Items](image.webp)

Order and browse Items alphabetically or numerically. Ordering Items is not possible on certain Layouts, such as the Map
Layout. To order a Collection's Items, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. In the Sidebar, choose a [Layout](/app/content-layouts/#adjust-item-layouts) that supports ordering.\
   (e.g. "table" or "card" mode)
3. Set the Order Field and Order Direction.
   - **Table Layout:** Click on the Field's column Header, clicking again changes order direction.
   - **Card Layout:** Adjust the Sort Field and Sort Direction in the Layout Subheader.

::: tip

Ordering is a non-destructive action which does not change your data.

:::

## View Archived Items

![View Archived Items](image.webp)

An Item can be [archived](/app/content-items/#archive-an-item) so that it exists within the database but is not
displayed with other "active" Items in the app. To view an archived Item, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Click **"Archive"** in the Sidebar.
3. Choose the desired view: `Show Items` (default), `Show Archived Items`, or `Show Items + Archived Items`.

## Bookmark Item Presets

![Bookmark Item Presets](image.webp)

Bookmarks allow you to save how a Collection Page looks so that you can return to the exact same view later. This
includes details such as the Layout, searches, filters, sorting, ordering, etc. To Bookmark a Collection, follow these
steps.

1. Navigate to the Content Module and select the desired Collection.
2. Configure the page as desired (eg: layout, options, search, filters, order, etc).
3. Click the <span mi icon>bookmark_border</span> in the header next to the page title.
4. **Optional:** Rename or Delete a bookmark by right-clicking it in the navigation sidebar and selecting **"Rename
   Bookmark"** or **"Delete Bookmark"**.
