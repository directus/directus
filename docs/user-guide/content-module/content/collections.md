---
description:
  The Collection Page displays all Items within a Collection and comes with highly configurable Layouts for browsing,
  visualizing, and managing these Items.
readTime: 6 min read
---

# Collection Page

> The Collection Page displays all Items within a Collection and comes with highly configurable Layouts for browsing,
> visualizing, and managing these Items.

::: tip Before You Begin

To use the Collection Page, you will need to know about [Collections](/user-guide/overview/glossary#collections),
[Items](/user-guide/overview/glossary#items) and [Fields](/user-guide/overview/glossary#fields).

<!--
@TODO getting-started > 30-90 min tutorial
Link to tutorial
-->

:::

## Toggle Hidden Collections

<video autoplay playsinline muted loop controls title="Toggle Hidden Collections">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220816/toggle-hidden-collections-20220816A.mp4" type="video/mp4" />
</video>

Some projects may have dozens or even hundreds of collections, which can be overwhelming to sort through. To ease this
problem, Admins can choose to [hide collections by default](/app/data-model/collections#toggle-collection-visibility) on
the Navigation bar. Users can then show or hide hidden collections as desired. To toggle collection visibility, follow
these steps.

1. Navigate to the Content Module.
2. Right-click in the Navigation Bar.
3. Click **Show/Hide Hidden Collections** to toggle visibility.

::: tip

This functionality is purely aesthetic, provided to help you _visually cleanup_ the Navigation Bar. For admins who'd
like to block users' access permissions, please see
[users, roles and permissions](/user-guide/user-management/users-roles-permissions).

:::

## Adjust Page Layout

<video autoplay playsinline muted loop controls title="Layouts">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/adjust-page-layout-20220415A.mp4" type="video/mp4" />
</video>

Layouts determine how you view or interact with Items in a Collection. Whether your Collection contains blog posts,
project management tasks, geo-coordinates, temporal data or beyond; Layouts present Items in a more human-friendly way.
[Learn More](/user-guide/content-module/layouts)

## Search Items

<video autoplay playsinline muted loop controls title="Search Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/search-items-20220419A.mp4" type="video/mp4" />
</video>

Find all Items with one or more Fields containing your searched value, excluding any Items which have been
[filtered out](#filter-items). To search through a Collection's Items, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Select <span mi icon>search</span> in the Page Header and a search bar will appear.
3. Type in the value to search for.

## Filter Items

<video autoplay playsinline muted loop controls title="Filter Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/filter-items-2022019A.mp4" type="video/mp4" />
</video>

Filters allow you to conditionally select Items from a Collection. Use-cases include customizing Item search results,
restricting Item access permissions for specific Users or Roles, building dashboard analytics with the Insights module,
and more. To Learn More, see our guide on [Filters](/user-guide/content-module/filters).

## Manually Sort Items

<video autoplay playsinline muted loop controls title="Batch Edit Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/manually-sort-items-20220415A.mp4" type="video/mp4" />
</video>

Drag and drop Items to custom sort them as desired. This is only possible on certain Layouts, such as the default
[Table Layout](/user-guide/content-module/layouts#table-layout). To sort a Collection's Items, follow these steps.

1. Be sure [a sort field](/app/data-model/collections#sort-field) has been configured under **"Settings > Data Model >
   Collection"**.\
   _(Shown in the video)_
2. Navigate to the Content Module and select the desired Collection.
3. In the Sidebar, be sure a [Layout](#adjust-page-layout) is chosen that supports manual sorting.
4. Enable manual sorting:
   - For the Table Layout, toggle <span mi icon>sort</span> in the configured Sort column.
5. Drag Items by their handle into a new position.

::: warning Manual Sorting Requires Configuration

Only available if a [sort field](/app/data-model/collections#sort-field) has been configured.

:::

::: tip

Sorting saves a value in a [Sort Field](/reference/query#sort). This value is used to return data in a custom order.
This means that while the values in this Sort Field do get updated and modified, values in other Fields are not changed.

:::

## Automatically Sort Items

<video autoplay playsinline muted loop controls title="Automatically Sort Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/automatically-sort-items-20220415A.mp4" type="video/mp4" />
</video>

Sort Items alphabetically or numerically, in ascending or descending order. Sorting is not possible on certain Layouts,
such as the Map Layout. Layouts that do support automatic sorting have controls in slightly different locations. To
learn more, see [Layouts](/user-guide/content-module/layouts).

::: tip

Automatic sorting is a non-destructive action which does not change your data.

:::

## View Archived Items

<video autoplay playsinline muted loop controls title="View Archived Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/view-archived-items.mp4" type="video/mp4" />
</video>

The no-code app allows you to hide archived Items, display them alongside other Items, or display archived Items only.
To learn how to archive an Item, see our guide on the
[Item Page](/user-guide/content-module/content/items#archive-an-item). To change whether an archived Item is displayed,
follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Click **"Archive"** in the Sidebar.
3. Choose the desired view:
   - **"Show Items"**
   - **"Show Archived Items"**
   - **"Show Items + Archived Items"**

::: warning Archiving Requires Configuration

Only available if an [Archive field](/app/data-model/collections#archive) has been configured.

:::

## Create a Bookmark

<video autoplay playsinline muted loop controls title="Create Presets and Bookmarks">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/presets-and-bookmarks-20220415A.mp4" type="video/mp4" />
</video>

Save how a Collection Page looks so that you can return to the exact same view later. This includes details such as the
Layout, search queries, filters, custom sort & order, etc. To create a Bookmark from the Collection Page, follow these
steps.

1. Navigate to the desired collection.
2. Click <span mi btn muted>bookmark</span> in the page header.
3. Enter a **Name** _(and optionally)_ an **Icon** and **Color**.
4. Click **Save** to confirm.

Your Bookmark will appear in the Navigation Bar, under the associated Collection Page.

::: tip Learn More

To learn more, see our guide on [Presets and Bookmarks](/user-guide/settings/presets-bookmarks).

:::

## Import / Export Items

![Import and Export Items](https://cdn.directus.io/docs/v9/app-guide/content/content-collections/content-collections-20220415A/imports-exports-20220416A.webp)

The Content, User Directory and File Library modules allow importing and exporting of multiple Items stored as files.
This makes it quick and easy to handle tasks like uploading and downloading new customer information; pulling down sales
data for transformation, reports, analysis, and beyond. To learn more, see how to
[Import and Export Items](/user-guide/content-module/import-export) in file format.

## Batch Delete, Archive or Edit Items

<video autoplay playsinline muted loop controls title="Batch Edit Items">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/batch-edit-items-20220415A.mp4
" type="video/mp4" />
</video>

It is possible to delete, archive, or edit multiple Items at once from the Collection Page. Deletion will permanently
delete Items from the database, this cannot be reverted. When batch editing, the Item Page opens, allowing you to make
the same edit across multiple Items. Follow these steps to batch delete, archive, or edit Items.

1. Navigate to the Content Module and select the desired Collection.
2. Choose a [Layout](/user-guide/content-module/layouts) that supports multiple Item selection from the Sidebar.\
   (e.g. The Table or Card Layout)
3. Click the Items you wish to select:
   - **Table Layout:** Click <span mi icon>check_box_outline_blank</span> in the left-most column.
   - **Card Layout:** Click <span mi icon>radio_button_unchecked</span> in the upper left-hand corner of each Card.

Once Items are selected, the following buttons will appear in the Page Header: <span mi btn muted>delete</span>
<span mi btn muted>archive</span> <span mi btn muted>edit</span>

**Delete**\
4. Click <span mi btn dngr>delete</span> in the header and a popup will appear.\
5. Click **"Delete"** to confirm the action.

**Archive**\
4. Click <span mi btn muted>archive</span> in the header and a popup will appear.\
5. Click **"Delete"** to confirm the action.

**Edit**\
4. Click <span mi btn muted>edit</span> in the header and the Item Page will open.\
5. Update Item details as desired.\
6. Click <span mi btn>check</span> to confirm batch edits on all Items.
