# File Library

> Directus includes a full-featured Digital Asset Management (DAM) system for storing, organizing, browsing, and
> transforming your various files and assets.

[[toc]]

## Browsing Files

![File Library Overview](../assets/app/file-library-overview.png)

This module aggregates all files within the project into one consolidated library. This listing page has the same
features and functionality as the [Collection Page](/app/content-collections/).

## Viewing or Editing a File

![File Overview](../assets/app/file-overview.png)

Provides a custom form for viewing assets and embeds, with core fields included out-of-the-box (see below), and the
ability for administrators to add additional custom fields. This page has the same features and functionality as the
[Item Page](/getting-started/glossary/#items).

#### File Info

- **Preview** — A preview of the image or file
- **Title** — A title for the file
- **Description** — A description of the file
- **Tags** — Keywords used for searchability
- **Location** — An optional location, eg: where a photo was taken
- **Storage** — Which storage adapter is used to store the file asset
- **Filename (Disk)** — LOCKED, this is the actual name of the file in storage
- **Filename (Download)** — This allows you to set the name of the file when it is downloaded

The file sidebar also includes the following details:

- **Type** — The MIME type of the file, displayed in the App as a formatted media type
- **Dimensions** — (Images Only) The width and height of the image in pixels
- **Size** — The file-size the asset takes up within the storage adapter
- **Created** — The timestamp of when the file was uploaded to the project
- **Owner** — The Directus user that uploaded the file to the project
- **Modified** - The timestamp of when the file was last modified
- **Edited By** — The Directus user that modified the file
- **Folder** — The current parent folder that contains the file
- **Metadata** — Metadata JSON dump of the file's EXIF, IPTC, and ICC information

#### Action Buttons

- <img src="../assets/buttons/save.png" alt="Save" height="30" style="vertical-align: middle; margin: 2px"> — Saves any
  edits made to the file
- <img src="../assets/buttons/settings.png" alt="Edit" height="30" style="vertical-align: middle; margin: 2px"> — Refer
  [Editing an Image](#editing-an-image)
- <img src="../assets/buttons/download.png" alt="Download" height="30" style="vertical-align: middle; margin: 2px"> —
  Downloads the file to your current device
- <img src="../assets/buttons/move-file.png" alt="Move to Folder" height="30" style="vertical-align: middle; margin: 2px">
  — Move the file to another folder
- <img src="../assets/buttons/delete.png" alt="Delete" height="30" style="vertical-align: middle; margin: 2px"> —
  Permanently removes the file and its metadata. This action is permanent and can not be undone.

## Editing an Image

Clicking the <img src="../assets/buttons/settings.png" alt="edit" height="30" style="vertical-align: middle"> action
button on the File Detail opens an image editor for rotating, cropping, or mirroring the file.

1. From the **File Library**, click a file to open it's detail page
2. Click the <img src="../assets/buttons/settings.png" alt="edit" height="30" style="vertical-align: middle"> button in
   the top right to open the image editor

![Image Editing](../assets/app/image-editing.png)

3. Make your changes and hit
   <img src="../assets/buttons/save.png" alt="save" height="30" style="vertical-align: middle"> in the top right to save
   the updates to the file.

## Replacing a File

Clicking the image Preview on the File Detail page opens a modal where you can replace the file. This is useful if you
want to change the file, but keep existing file info and maintain all of the file's relationships.

![Replace File](../assets/app/replace-file.gif)

## Uploading a File

There are many ways that a file can be uploaded into Directus via the App. We'll cover the primary method below, but
keep in mind that files can also be added directly through different interfaces.

![Upload File](../assets/app/upload-file.gif)

1. From the **File Library**, click on the
   <img src="../assets/buttons/add.png" alt="Add Item (+ Icon)" height="30" style="vertical-align: middle"> button
   located in the header
2. **Upload** the file by:
   - Dragging a file from your desktop to the modal
   - Click the modal area to manually select a file from your device
   - Clicking the <img src="../assets/buttons/options.png" alt="..." height="30" style="vertical-align: middle"> icon
     and choosing "Import from URL"

## Creating a Folder

![Create Folder](../assets/app/create-folder.gif)

1. From the **File Library**, click on the
   <img src="../assets/buttons/add-folder.png" alt="Create Folder (folder with plus icon)" height="30" style="vertical-align: middle">
   button located in the header
2. Fill in the folder name
3. Click "Save"

## Renaming a Folder

![Rename Folder](../assets/app/rename-folder.gif)

1. From the **File Library**, right-click on the folder you wish to rename and select "Rename Folder"
2. Update the folder name
3. Click "Save"

## Moving a Folder

![Move Folder](../assets/app/move-folder.gif)

1. From the **File Library**, right-click on the folder you wish to move and select "Move to Folder"
2. Select a folder that will be the new parent folder
3. Click "Save"

## Deleting a Folder

![Delete Folder](../assets/app/delete-folder.gif)

1. From the **File Library**, right-click on the folder you wish to delete and select "Delete Folder"
2. Click "Delete"

::: tip

When you delete a folder, any nested files and folders will be moved one level up.

:::
