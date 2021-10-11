# File Library

> Directus includes a full-featured Digital Asset Management (DAM) system for storing, organizing, browsing, and
> transforming your various files and assets.

[[toc]]

## Browsing Files

This module aggregates all files within the project into one consolidated library.

::: tip Collection Page This page has the same features and functionality as the
[Collection Page](/app/content/collection). :::

## Viewing or Editing a File

Provides a custom form for viewing assets and embeds, with core fields included out-of-the-box (see below), and the
ability for administrators to add additional custom fields.

::: tip Item Page This page has the same features and functionality as the [Item Page](/app/content/item). :::

#### File Info

- **Preview** — A preview of the image or file
- **Title** — A title for the file
- **Description** — A description of the file
- **Tags** — Keywords used for searchability
- **Location** — An optional location, eg: where a photo was taken
- **Storage** — Which storage adapter is used to store the file asset
- **Filename (Disk)** — LOCKED, this is the actual name of the file in storage
- **Filename (Download)** — This allows you to set the name of the file when it is downloaded

#### Action Buttons

- **Save** — Saves any edits made to the page
- **Edit** — Saves any edits made to the page
- **Download** — Saves any edits made to the page
- **Move Folder** — Saves any edits made to the page
- **Delete** — Permanently removes this file and its metadata. This action is permanent and can not be undone.

## Editing an Image

Clicking the "Edit" action button on the File Detail opens an image editor for rotating, cropping, or mirroring the
file.

1. Navigate to the **File Library**
2. Click a file to open it's detail page
3. Click the edit button in the top right to open the image editor
4. Make your changes and hit save in the top right to save the updates to the file

## Replacing a File

Clicking the image Preview on the File Detail page opens a modal where you can replace the file. This is useful if you
want to change the file, but keep existing file info and maintain all of the file's relationships.

## Uploading a File

There are many ways that a file can be uploaded into Directus via the App. We'll cover the primary method below, but
keep in mind that files can also be added directly through different interfaces.

1. Navigate to the **File Library**
2. Click on the **"Create Item"** (+ icon) button located in the header
3. **Upload** the file by:
   - Dragging a file from your desktop to the modal
   - Click the modal area to manually select a file from your device
   - Clicking the "..." icon and choosing "Import from URL"
