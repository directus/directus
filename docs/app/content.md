# Content

> The Content Module is the primary way for Users to interact with Items in a Collection _(i.e. database content)_.
> Users will have the tools they need to view and manage, sort and order, or even import and export data easily
> and intuitively no matter what your data model contains, from blog posts to event bookings, IoT fleet geo-positions to
> CRM, and everything in between.

[[toc]]

::: tip Before You Begin

To use this module, you will need to know what [Collections](/getting-started/glossary/#collections),
[Items](/getting-started/glossary/#items) and [Fields](/getting-started/glossary/#fields) are in general. After that,
the controls to view and manage Items are quite intuitive.

:::

## Collection Page

![Collection Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/content-20220415A/collection-page-20220415A.webp)

The Content Module is composed of Collection Pages and Item Pages. Use the Navigation Bar on the left to move between
Collections. Each Collection Page displays all Items in its Collection and comes with highly configurable
[Layouts](/getting-started/glossary/#layouts) for browsing, visualizing, and managing Items. The Page Header includes
key action buttons for sorting, searching, filtering, creating, editing, archiving, and deleting multiple Items.
[Learn More](/app/content-collections)

:::tip

This Module is for management of Items. Collections are not managed through this Module, as that creates changes in the
fundamental data model. Administrators manage Collections via the Settings menu. [Learn More](/configuration/data-model)

:::

## Item Page

![Article Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/content-20220415A/item-page-20220215A.webp)

When an Item is clicked on the Collection Page, its Item Details Page is opened. This is a form primarily for viewing
and editing an Item's Field Values, but also includes options for commenting on, sharing, archiving, reverting, and
deleting the Item. [Learn More](/app/content-items)

::: tip Manage Items via the API

This section explains how to create, view, update, and delete Items within the Directus App. However, these actions can
also be done [programmatically via the API](/reference/items/).

:::

## Data Sharing

<video title="Data Sharing" autoplay muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content/content-20220415A/data-shares-20220415A.mp4" type="video/mp4" />
</video>

Data sharing allows an Item to be viewed by anyone, regardless of their permissions. [Learn More](/app/data-sharing)
