# Content

> The Content Module is the primary way for Users to interact with Items in a Collection _(i.e. database content)_,
> enabling Users to browse/view, create, sort, order, upload, download, edit, share, archive, and delete Items.

::: tip Before You Begin

To use this module, you will need to know what [Collections](/getting-started/glossary/#collections),
[Items](/getting-started/glossary/#items) and [Fields](/getting-started/glossary/#fields) are in general. After that,
the controls to view and manage Items are quite intuitive, so its easy to get started.

:::

## Collection Page

![Collection Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/collection-page-20220215A.webp)

The Content Module is composed of Collections Pages and Item Details Pages. Each Collection Page displays all Items in
its Collection. It comes with highly configurable [Layouts](/getting-started/glossary/#layouts) for browsing,
visualizing, and managing Items. The Page Header includes key action buttons for sorting, searching, filtering,
creating, and batch editing/archiving/deleting Items. When you navigate into the Content Module, you land directly on a
Collection Page. Use the [Navigation Bar](/app/overview/#_2-navigation-bar) on the left to move between Collection
Pages.

:::tip

This Module is for management of Items _(i.e. content)_. Collections are not managed through this Module, as that
creates changes in the data model. Administrators manage Collections through the Settings menu.
[Learn More](/configuration/data-model)

:::

## Item Details Page

![Article Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/item-page-20220215A.webp)

When an Item is clicked on the Collection Page, its Item Details Page is opened. This is a form primarily for viewing
and editing an Item's Field Values, but also includes options for commenting on, sharing, archiving, reverting, and
deleting the Item.

## Layouts

<video alt="Layouts" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

- control how Items are displayed on the Collections page
- Access from the sidebar
- ??

## Import / Export Items

![Import / Export Multiple Items](image.webp)

- can be done [in the app](/content-import-export/#import-export-items)
- can be done [programmatically](reference/system/utilities/#import-data-from-file)
- import CSV or JSON
- export CSV, JSON or XML
- Learn how to [import and export Items](/app/content-import-export/)

## Data Sharing

<video alt="Data Sharing" autoplay muted loop controls>
	<source src="" type="video/mp4" />
</video>

- Share Items with anyone, regardless of their permissions
- The shared Item's view permissions are created
- This means you can share with people who are not Users
