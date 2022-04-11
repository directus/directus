# Content

> The Content Module is the primary way for Users to interact with Items in a Collection _(i.e. database content)_,
> enabling Users to browse/view, create, sort, order, upload, download, edit, share, archive, and delete Items.

[[toc]]

::: tip Before You Begin

To use this module, you will need to know what [Collections](/getting-started/glossary/#collections),
[Items](/getting-started/glossary/#items) and [Fields](/getting-started/glossary/#fields) are in general. After that,
the controls to view and manage Items are quite intuitive, so its easy to get started.

:::

## Collection Page

![Collection Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/collection-page-20220215A.webp)

The Content Module is composed of Collections Pages and Item Pages. Each Collection Page displays all Items in its
Collection. It comes with highly configurable [Layouts](/getting-started/glossary/#layouts) for browsing, visualizing,
and managing Items. The Page Header includes key action buttons for sorting, searching, filtering, creating, as well as
editing, archiving, and deleting multiple Items. When you navigate into the Content Module, you land directly on a
Collection Page. Use the [Navigation Bar](/app/overview/#_2-navigation-bar) on the left to move between Collection
Pages. [Learn More](/app/content-collections)

:::tip

This Module is for management of Items _(i.e. content)_. Collections are not managed through this Module, as that
creates changes in the data model. Administrators manage Collections through the Settings menu.
[Learn More](/configuration/data-model)

:::

## Item Page

![Article Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/item-page-20220215A.webp)

When an Item is clicked on the Collection Page, its Item Details Page is opened. This is a form primarily for viewing
and editing an Item's Field Values, but also includes options for commenting on, sharing, archiving, reverting, and
deleting the Item. [Learn More](/app/content-items)

::: tip Manage Items via the API

In this section of the documentation, we show you how to create, view, update, and delete Items within the Directus App.
However, these actions can also be done [programmatically via the API](/reference/items/).

:::

## Layouts

<video alt="Layouts" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

[Layouts](/getting-started/glossary/#layouts) determine how you view or interact with Items in a Collection.
[Learn More](/app/content-layouts/).

## Import / Export Items

![Import / Export Multiple Items](image.webp)

It is possible to import and export a Collection's Items. This can be done [in the app](/app/content-import-export/) or
[programmatically via the API](reference/system/utilities/#import-data-from-file). Imports can be of typ CSV or JSON
while exports can be CSV, JSON or XML. Learn how to import and export Items. [Learn More](/app/content-import-export/)

## Data Sharing

<video alt="Data Sharing" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

Data sharing allows you to share a view of an Item with anyone, regardless of their permissions.
[Learn More](/app/data-sharing)
