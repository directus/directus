# Content

> The Content Module is the primary way for Users to interact with Items in a Collection _(i.e. database content)_,
> enabling Users to browse/view, create, sort, order, upload, download, edit, share, archive, and delete Items.

::: tip Assumed Knowledge

You will need to know what [Collections](/getting-started/glossary/#collections),
[Items](/getting-started/glossary/#items) and [Fields](/getting-started/glossary/#fields) are in general. After that,
the controls to manage Items are quite intuitive, so its easy to get started in this Module. However, things gets more
nuanced as a Project grows in complexity. To use the Module effectively and fully, you will also need to understand how
to configure [Collections](/configuration/data-model) and the [relationships](/configuration/relationships/) between
Collections; how [Filters](/app/filters) work; and also how
[Users, Roles, and Permissions](/configuration/users-roles-permissions/) work together.

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

This module is only for management of Items _(i.e. content)_. Collections are not managed through this Module, as that
creates changes in the data model. Administrators manage Collections through the Settings menu.
[Learn More](/configuration/data-model)

:::

## Item Details Page

![Article Overview](https://cdn.directus.io/docs/v9/app-guide/content/content/item-page-20220215A.webp)

When an Item is clicked on the Collection Page, its Item Details Page is opened. This is a form primarily for viewing
and editing an Item's Field Values, but also includes options for commenting on, sharing, archiving, reverting, and
deleting the Item.

::: warning Permissions

Users and Roles with [limited access permissions](/configuration/users-roles-permissions) to Collections, Items, or Item
Fields may not be able to view and manage Items as usual.

:::
