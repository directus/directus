---
description:
  The Item Page is a tailored form for managing Items and their Field values. This page also includes options for
  archiving, reverting, and commenting on the Item.
readTime: 5 min read
---

# Item Page

> The Item Page is a tailored form for managing Items and their Field values. This page also includes options for
> archiving, reverting, and commenting on an Item.

::: tip Programmatically Manage Items

This page shows you how to manage Items within the no-code app. However, you can also [manage](/reference/items) Items
programmatically via the API.

<!--
@TODO Reference > Items
Add links once "archive item" is created
[archived]()
[reverted](/reference/system/revisions#revisions)
[commented on](/reference/system/activity#create-a-comment)
-->

:::

## Create an Item

<video autoplay playsinline muted loop controls title="Create an Item">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/create-an-item-20220415A.mp4" type="video/mp4" />
</video>

To create an Item, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Click <span mi btn>add</span> in the Page Header to open the Item Page.
3. Fill in Item details as desired.
4. Click <span mi btn>check</span> in the Page Header.

::: tip Singletons

If the collection is configured as a [Singleton](/app/data-model/collections#collection-setup) in the data model
settings, the App will skip step two above and automatically open the Item Page.

:::

## Edit an Item

<video autoplay playsinline muted loop controls title="Edit an Item">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/edit-an-item-20220415A.mp4" type="video/mp4" />
</video>

To edit an Item's field values, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Click on the desired Item to open the Item Page.
3. Update Item details as desired.
4. Click <span mi btn>check</span> in the header.

::: tip Other Save Options

To the right of the primary Save button, there is a <span mi icon>more_vert</span> menu that contains the following
alternate save options:

<span mi icon>check</span> Save and Stay (⌘S)\
<span mi icon>add</span> Save and Create New (⌘⇧S)\
<span mi icon>done_all</span> Save as Copy\
<span mi icon>undo</span> Discard all Changes

:::

::: tip Singletons

If the Collection is configured as a "Singleton" in Data Model Settings, then the App will skip step two above and
automatically open the Item Page.

:::

## Advanced Save Options

<video autoplay playsinline muted loop controls title="Advanced Save Options">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220816/advanced-save-options-20220816A.mp4" type="video/mp4" />
</video>

To do an advanced save when you create or edit an item, follow these steps.

1. Begin to [create an item](#create-an-item) or [edit an item](#edit-an-item).
2. Click <span mi icon muted>more_vert</span> to open the context menu.
3. Click to choose your advanced save method. You have four options:
   - **Save and Stay**
   - **Save and Create New**
   - **Save as Copy**
   - **Discard all Changes**

## Archive an Item

<video autoplay playsinline muted loop controls title="Archive an Item">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/archive-an-item-20220415A.mp4" type="video/mp4" />
</video>

To archive an Item, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item to open the Item Page.
3. Click <span mi btn warn>archive</span> located in the header and a popup will appear.
4. Click **"Archive"** to confirm the action.

::: warning Requires Configuration

Requires an [Archive field](/app/data-model/collections#archive) to be configured within the Collection's data model
settings.

:::

## Revert an Item

<video autoplay playsinline muted loop controls title="Revert an Item">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/revert-an-item-20220415A.mp4" type="video/mp4" />
</video>

As you update Field Values on Items, Directus saves these [Revisions](/user-guide/overview/glossary#revisions), and they
can be compared side-by-side to the current state. To revert an Item, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item to open the Item Page.
3. Click **"Revisions"** in the page sidebar.
4. Click on the revision you wish to preview and a side menu will appear.
5. Go to **"Revisions Made"** in the side menu and view the revision differences.
6. Click <span mi btn muted>restore</span> to revert the Item's values and return to the Item Page.
7. Click <span mi btn>check</span> to confirm and exit to the Collection Page.

::: tip Revision Preview

You will also see a **"Revision Preview"** button in the side menu navigation, which will let you preview all the Item's
values for that revision.

:::

::: tip

You can also revert Items [programmatically via the API](/reference/system/revisions).

:::

## Comment on an Item

<video autoplay playsinline muted loop controls title="Comment on an Item">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/comment-on-an-item-20220415A.mp4" type="video/mp4" />
</video>

Comments is a collaborative tool that are left on an Item in the sidebar and remain there for you and other team members
to view. To create a comment, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item to open the Item Page.
3. Click **"Comments"** in the page sidebar.
4. Type your message into the input box.
5. Click the **"Submit"** button.

::: tip Mentions

You can also search and mention any User by typing the **"@"** symbol along with their name or email to send an in-app
notification, as well as an email directing them to your comment.

:::

::: tip Edit and Delete Comments

Each comment displays the time it was created in its upper right-hand corner. Hover over this and the
<span mi icon>more_horiz</span> menu will appear. Click <span mi icon>edit</span> to edit or <span mi icon>delete</span>
to delete the comment.

:::

## Delete an Item

<video autoplay playsinline muted loop controls title="Comment on an Item">
	<source src="https://cdn.directus.io/docs/v9/app-guide/content/content-items/content-items-20220415A/delete-an-item-20220415A.mp4" type="video/mp4" />
</video>

To delete an Item, follow these steps.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item to open the Item Page.
3. Click <span mi btn dngr>delete</span> located in the header and a popup will appear.
4. Click **"Delete"** to confirm the action.

::: tip Soft-Delete

If you wish to remove an Item from view or use without fully deleting it, consider
[archiving the Item](#archive-an-item) instead.

:::

## Live Preview an Item

Live preview allows you to preview your content changes without having to publish them. To preview an Item, follow these
steps:

1. Navigate to **Settings** > **Data Model** and choose the Collection.
2. Add the **"Preview URL"** in the "Preview URL" section.
3. Go to the Content Module and select the Collection.
4. Choose the Item you want to preview.
5. Toggle **"Enable Preview"** at the top of the page.
6. Make changes to your Item and save. The preview will appear on the right side of your screen.

<video title="Live Preview an Item" autoplay playsinline muted loop controls>
	<source src="https://marketing.directus.app/assets/48140637-b543-47c1-bad4-71e72b751c44.mp4" type="video/mp4" />
</video>

## Implement Content Versioning on an Item

To implement Content Versioning on an item in your collection, follow these steps:

1. Navigate to **Settings** > **Data Model** and choose the Collection.
2. Locate the "**Content Versioning**" section and toggle to enable it.
3. Go to the specific item for which you want to create a new version. You will see a "**Main**" version at the top of
   your item view.
4. Select "**Create Version**" from the dropdown.
5. When prompted, give your new version a key and a name. For instance, you can use "draft" as the key and "My Draft" as
   the name.
6. Make the necessary updates and edits to the content in this new version. Your main version remains unaffected during
   this process. Save the version after making your changes.
7. From the dropdown, click "**Promote Version**". This allows you to review and promote changes as needed.
