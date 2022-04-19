# Collection Page

> The Collection Page displays all Items within a Collection and comes with highly configurable Layouts for browsing,
> visualizing, and managing these Items.

[[toc]]

## Adjust Page Layout

<video autoplay muted loop controls title="Layouts">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/adjust-page-layout-20220415A.mp4" type="video/mp4" />
</video>

Layouts determine how you view or interact with Items in a Collection. Whether your Collection contains blog posts,
project management tasks, geo-coordinates, temporal data or beyond; Layouts display Items in a logical and intuitive
way. [Learn More](/app/layouts)

## Search Items

<video autoplay muted loop controls title="Search Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/search-items-20220419A.mp4" type="video/mp4" />
</video>

Find all Items with one or more Fields containing your searched value, excluding any Items which have been
[filtered out](#filter-items). To search through a Collection's Items, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Select <span mi icon>search</span> in the Page Header and a search bar will appear.
3. Type in the value to search for.

## Filter Items

<video autoplay muted loop controls title="Filter Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/filter-items-2022019A.mp4" type="video/mp4" />
</video>

Filters enable complex and granular filtered displays of Items. [Learn More](/app/filters/)

## Manually Sort Items

<video autoplay muted loop controls title="Batch Edit Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/manually-sort-items-20220415A.mp4" type="video/mp4" />
</video>

Drag and drop Items to custom-sort them as desired. This is only possible on certain Layouts, such as the default
[Table Layout](/app/layouts/#table-layout). To sort a Collection's Items, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. In the Sidebar, be sure a [Layout](#adjust-page-layout) is chosen that supports manual sorting.
3. Enable manual sorting:
   - For the Table Layout, toggle <span mi icon>sort</span> in the configured Sort column.
4. Drag Items by their handle into a new position.

::: warning Manual Sorting Requires Configuration

Only available if a Sort column has been configured in the Collection's Data Model Settings.

<!--@TODO config > Data Model Settings: Link -->

:::

:::tip

Sorting saves a value in a [Sort Field](/reference/query/#sort). This value is used to return data in a custom order.
This means that while the values in this Sort Field do get updated and modified, values in other Fields are not changed.

:::

## Automatically Sort Items

<video autoplay muted loop controls title="Automatically Sort Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/automatically-sort-items-20220415A.mp4" type="video/mp4" />
</video>

Sort Items alphabetically or numerically, in ascending or descending order. Sorting is not possible on certain Layouts,
such as the Map Layout. Layouts that support automatic sorting have controls for this in slightly different locations.
Controls are found under each Layout's respective section. The following Layouts currently support automatic sorting:

- [Table Layout](/app/layouts/#table-layout)
- [Card Layout](/app/layouts/#card-layout)

::: tip

Automatic sorting is a non-destructive action which does not change your data.

:::

## View Archived Items

<video autoplay muted loop controls title="View Archived Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/view-archived-items.mp4" type="video/mp4" />
</video>

To view an archived Item, follow the steps below. [Learn More](/app/content/items/#archive-an-item)

1. Navigate to the Content Module and select the desired Collection.
2. Click **"Archive"** in the Sidebar.
3. Choose the desired view:
   - **"Show Items"**
   - **"Show Archived Items"**
   - **"Show Items + Archived Items"**

## Create Presets and Bookmarks

<video autoplay muted loop controls title="Create Presets and Bookmarks">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/presets-and-bookmarks-20220415A.mp4" type="video/mp4" />
</video>

Save how a Collection Page looks so that you can return to the exact same view later, including details such as the
Layout, searches, filters, sorting, ordering, etc. [Learn More](/configuration/presets-bookmarks/)

## Import / Export Items

![Import and Export Items](https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/imports-exports-20220416A.webp)

No-code Users can import and export a Collection's Items in file-format. [Learn More](/app/import-export/)
