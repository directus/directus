# Items

> A tailored form for viewing and editing an Item's Fields. This page also includes options for archiving, reverting,
> deleting, and commenting on the Item.

[[toc]]

## Create an Item

<video autoplay muted loop controls title="Create an Item">
	<source src="" type="video/mp4" />
</video>

1. Navigate to the Collection that you want to add an Item to.
2. Click <span mi btn>add</span> in the Page Header.
3. Fill in the Item Details Form as desired.
4. Click <span mi btn>check</span> in the Page Header.

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step
#2 above and go directly open the Item Details Form.

:::

## Update an Item

![Update an Item](image.webp)

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to update
3. Click on the item within the current layout (eg: on the row of the table)
4. Update the Item Detail form
5. Click <span mi btn>check</span> in the header.

::: tip Other Save Options

To the right of the primary Save button there is a "..." icon which contains the following alternate save options:

- Save and Stay (⌘S)
- Save and Create New (⌘⇧S)
- Save as Copy

:::

::: tip Singletons

If the Collection is configured as a "Singleton" in the data model settings, then the App will automatically skip step
#3 above.

:::

## Archive an Item

![Archive an Item](image.webp)

[Learn More](/app/content-items/#archive-an-item)

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to archive
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Archive Item" (archive icon) button located in the header
5. Confirm the action within the dialog by clicking "Archive"

::: warning Requires Configuration

This feature is only available if an Archive column has been configured in the Collection's data model settings.

:::

::: tip Archiving from the Item Detail page

You can also click on an item to navigate to its Detail page. From there, you can click on the "Archive Item" (archive
icon) button located in the header.

:::

## Delete an Item

![Delete an Item](image.webp)

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to delete
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Delete Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Delete"

::: tip Deleting from the Item Detail page

You can also click on an item to navigate to its Detail page. From there, you can click on the "Delete Item" (trash
icon) button located in the header.

:::

## Batch Delete, Archive or Edit Items

![Batch Delete, Archive or Edit Items](image.webp)

It is possible to select multiple Items to batch edit/delete from the Collections Page. Deletion will permanently delete
Items from the database, this cannot be reverted. On batch editing, the Item Details Form opens, allowing you to make
the same edit across multiple Items.

<video autoplay muted loop controls title="Batch Edit Items">
	<source src="" type="video/mp4" />
</video>

1. Navigate to the [Content Module](/app/overview/#_1-module-bar).
2. Navigate to the Collection you wish to sort.
3. In the [Sidebar](/app/overview/#_4-sidebar), choose a [Layout](/#adjust-item-layouts) that supports multiple
   selection (e.g. "table" or "card" mode).
4. Click the Items you wish to select.
   - **Table Layout:** Click <span mi icon>check_box_outline_blank</span> in the far left column to select Items.
   - **Card Layout:** Click <span mi icon>radio_button_unchecked</span> in the top left hand corner to select Items.

Once Items are selected, <span mi btn dngr>delete</span> and <span mi btn warning>edit</span> appear in the Page Header.
There are two options:

**Edit**\
5. Click <span mi btn warning>edit</span> and the Item Details Form will open.\
6. Make edits to Fields as desired.\
7. Click <span mi btn>check</span> to confirm batch edits on all Items.

**Delete**\
5. Click <span mi btn dngr>delete</span> and a popup will appear.\
6. Click **"Delete"**.

:::danger DANGER!

These actions are destructive, proceed with caution.

:::

## Revert an Item

![Revert an Item](image.webp)

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to archive
3. Click on an item to navigate to its Detail page
4. Click "Revisions" in the page sidebar
5. Click on the revision you wish to preview
6. Click on the "Revert" button located in the drawer's header
7. Confirm the action within the dialog by clicking "Revert"

## Comment on an Item

![Comment on an Item](image.webp)

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to comment on
3. Click on an item to navigate to its Detail page
4. Click "Comments" in the page sidebar
5. Type your message within the input
6. Click the "Submit" button

### Mentions

You can also mention any user by typing `@` along with their name or email in your comment. They will then receive a
notification which will direct them to your comment.
