# Item Page

> A tailored form for viewing and editing an item's fields. This page also includes options for archiving, reverting,
> deleting, and commenting on the item.

[[toc]]

::: warning Permissions

The actions on this page assume the current user has permission to perform that action. However, certain features may be
disabled or hidden based on permissions.

:::

## Updating an Item

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to update
3. Click on the item within the current layout (eg: on the row of the table)
4. Update the Item Detail form
5. Click the "Save Item" (✓ icon) button located in the header

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

## Deleting an Item

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to delete
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Delete Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Delete"

::: tip Deleting from the Item Detail page

You can also click on an item to navigate to its Detail page. From there, you can click on the "Delete Item" (trash
icon) button located in the header.

:::

## Archiving an Item

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to archive
3. Select the item(s) within the desired layout (eg: the checkbox on the table row)
4. Click the "Archive Item" (trash icon) button located in the header
5. Confirm the action within the dialog by clicking "Archive"

::: warning Requires Configuration

This feature is only available if an Archive column has been configured in the Collection's data model settings.

:::

::: tip Archiving from the Item Detail page

You can also click on an item to navigate to its Detail page. From there, you can click on the "Archive Item" (archive
icon) button located in the header.

:::

## Reverting an Item

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to archive
3. Click on an item to navigate to its Detail page
4. Click "Revisions" in the page sidebar
5. Click on the revision you wish to preview
6. Click on the "Revert" button located in the drawer's header
7. Confirm the action within the dialog by clicking "Revert"

## Commenting on an Item

1. Navigate to the [Content Module](/app/overview#1.-module-bar)
2. Navigate to the collection of the item you want to comment on
3. Click on an item to navigate to its Detail page
4. Click "Comments" in the page sidebar
5. Type your message within the input
6. Click the "Submit" button

### Mentions

You can also mention any user by typing `@` along with their name or email in your comment. They will then receive a
notification which will direct them to your comment.
