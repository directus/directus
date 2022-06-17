# Content

> The Content Module is the primary way for Users to interact with Items in a Collection. Regardless of what your data
> model contains _(be it blog posts, event bookings, IoT fleets, geo-positions, CRM, or whatever!)_ the Content Module
> enables Users to view and manage, sort and search, or import and export data.

[[toc]]

::: tip Before You Begin

To efficiently use this Module, you will need to know about [Collections](/getting-started/glossary/#collections),
[Items](/getting-started/glossary/#items) and [Fields](/getting-started/glossary/#fields).

<!--
@TODO getting-started > 30-90 min tutorial
Link to tutorial
-->

:::

## Collection Page

![Collection Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/content-20220415A/collection-page-20220415A.webp)

The Content Module is composed of Collection Pages and Item Pages. Use the Navigation Bar on the left to move between
Collections. Each Collection Page displays all Items in its Collection and comes with highly configurable
[Layouts](/getting-started/glossary/#layouts) for browsing, visualizing, and managing Items. The Page Header includes
key action buttons for sorting, searching, filtering, creating, editing, archiving, and deleting multiple Items. To
learn more, see our guide on the [Collection Page](/app/content/collections).

:::tip

This Module is for managing Items. Collections are not managed through this Module, as that creates changes in the
fundamental data model. Administrators manage Collections via the Settings menu. To learn more, see our guide on
[data model configuration](/configuration/data-model).

:::

## Item Page

![Article Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/content-20220415A/item-page-20220215A.webp)

When an Item is clicked on within the Collection Page, its Item Page is opened. This is a form primarily for viewing,
editing and deleting an Item. Options for commenting on, sharing, archiving, and reverting the Item are included as
well. To learn more, see our guide on the [Item Page](/app/content/items).

::: tip Manage Items via the API

This section explains how to create, view, update, and delete Items within the Directus App. However, all actions
performed in the app can also be done programmatically.\
Learn how to [manage Items via the API](/reference/items/).

:::

## Data Sharing

<video title="Data Sharing" autoplay muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content/content-20220415A/data-shares-20220415A.mp4" type="video/mp4" />
</video>

In a given Project, some Collections will likely be hidden for the Public as well as other Roles. There may be cases
when you want to share an Item with a person _(or people)_ that don't have the permissions to see it. This is where
Shares come in to play. You can share Item from a Collection with anyone, regardless of their permissions and even if
they are not Users within the project. To learn more, see our guide on [Data Sharing](/app/content/data-sharing).
