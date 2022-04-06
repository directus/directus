# Item Page

> The Item Page is a tailored form for managing Items and their Field values. This page also includes options for
> archiving, reverting, and commenting on the Item.

[[toc]]

## Create an Item

<video autoplay muted loop controls title="Create an Item">
	<source src="" type="video/mp4" />
</video>

To create an Item, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Click <span mi btn>add</span> in the Page Header. The Item Page will open.
3. Fill in Item details as desired.
4. Click <span mi btn>check</span> in the Page Header.

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will skip step two above and
automatically open the Item Page.

:::

## Edit an Item

![Update an Item](image.webp)

To update an Item's Field Values, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Click on the desired Item. The Item Page will open.
3. Update Item details as desired.
4. Click <span mi btn>check</span> in the header.

::: tip Other Save Options

To the right of the primary Save button, there is a <span mi icon>more_vert</span> icon which contains the following
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

## Archive an Item

![Archive an Item](image.webp)

To archive an Item, follow the steps below. [Learn More](/configuration/data-model/#archive)

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item. The Item Page will open.
3. Click <span mi btn warn>archive</span> located in the header and a popup will appear.
4. Click **"Archive"** to confirm the action.

::: warning Requires Configuration

Archiving is only available if an Archive Field has been configured within the Collection's data model settings.

:::

## Delete an Item

![Delete an Item](image.webp)

To delete an Item, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item. The Item Page will open.
3. Click <span mi btn dngr>delete</span> located in the header and a popup will appear.
4. Click **"Delete"** to confirm the action.

::: danger

This action permanently removes the Item from the database. Proceed with caution!

:::

:::tip Archive as a Soft-Delete

If you wish to remove an Item from view or use, but keep it stored, you may consider
[archiving the Item](#archive-an-item) instead.

:::

## Batch Delete, Archive or Edit Items

<video autoplay muted loop controls title="Batch Edit Items">
	<source src="" type="video/mp4" />
</video>

It is possible to delete, archive, or edit multiple Items at once from the Collection Page. Deletion will permanently
delete Items from the database, this cannot be reverted. When batch editing, the Item Page opens, allowing you to make
the same edit across multiple Items. Follow the steps below to batch delete, archive, or edit Items.

1. Navigate to the Content Module and select the desired Collection.
2. Choose a [Layout](/#adjust-item-layouts) that supports multiple Item selection from the Sidebar.\
   (e.g. The Table or Card Layout)
3. Click the Items you wish to select:
   - **Table Layout:** Click <span mi icon>check_box_outline_blank</span> in the left-most column.
   - **Card Layout:** Click <span mi icon>radio_button_unchecked</span> in the upper left hand corner of each Card.

Once Items are selected, the following icons will appear in the Page Header: <span mi btn muted>delete</span>
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

:::danger DANGER!

These actions are destructive, proceed with caution.

:::

## Revert an Item

<video autoplay muted loop controls title="Revert Items">
	<source src="" type="video/mp4" />
</video>

As you update Field Values on Items, Directus saves these [Revisions](/getting-started/glossary/#revisions) so that you
can compare and revert the current state of an Item to previous states. To revert an Item, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item. The Item Page will open.
3. Click **"Revisions"** in the page sidebar.
4. Click on the revision you wish to preview.
5. Click on the "Revert" button located in the drawer's header.
6. Confirm the action within the dialog by clicking **"Revert"**.

:::tip

Items can also be reverted [programmatically via the API](/reference/system/revisions/).

:::

## Comment on an Item

<video autoplay muted loop controls title="Comment on an Item">
	<source src="" type="video/mp4" />
</video>

Comments, a collaborative tool, are left on an Item in the sidebar and remain there for you and other team-members to
refer to. To create a comment, follow the steps below.

1. Navigate to the Content Module and select the desired Collection.
2. Select the desired Item. The Item Page will open.
3. Click **"Comments"** in the page sidebar.\
4. Type your message into the input.
5. Click the **"Submit"** button.

:::tip Mentions

You can also search and mention any User by typing the **"@"** symbol along with their name or email in your comment.
They will then receive an in-app notification as well as an email which direct them to your comment.

:::

:::tip Edit and Delete Comments

Each comment displays the time it was created in its upper right-hand corner. Hover over this and the
<span mi icon>more_horiz</span> menu will appear. Click this menu if you wish to <span mi icon>edit</span> edit or
<span mi icon>delete</span> delete the comment.

:::
