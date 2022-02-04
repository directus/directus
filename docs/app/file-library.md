# File Library

> Directus includes a full-featured Digital Asset Management (DAM) system for storing, organizing, browsing, and
> transforming your various files and assets.

[[toc]]

## Browsing Files

This module aggregates all files within the project into one consolidated library. This listing page has the same
features and functionality as the [Collection Page](/app/content-collections/).

## Viewing or Editing a File

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
- **Folder** — The current parent folder that contains the file
- **Metadata** — Metadata JSON dump of the file's EXIF, IPTC, and ICC information

#### Action Buttons

- **Save** — Saves any edits made to the page
- **Edit** — Saves any edits made to the page
- **Download** — Saves any edits made to the page
- **Move Folder** — Saves any edits made to the page
- **Delete** — Permanently removes this file and its metadata. This action is permanent and can not be undone.

## Editing an Image

Clicking the "Edit" action button on the File Detail opens an image editor for rotating, cropping, or mirroring the
file.

1. From the **File Library**, click a file to open it's detail page
2. Click the edit button in the top right to open the image editor
3. Make your changes and hit save in the top right to save the updates to the file

## Replacing a File

Clicking the image Preview on the File Detail page opens a modal where you can replace the file. This is useful if you
want to change the file, but keep existing file info and maintain all of the file's relationships.

## Uploading a File

There are many ways that a file can be uploaded into Directus via the App. We'll cover the primary method below, but
keep in mind that files can also be added directly through different interfaces.

1. From the **File Library**, click on the **"Create Item"** (+ icon) button located in the header
2. **Upload** the file by:
   - Dragging a file from your desktop to the modal
   - Click the modal area to manually select a file from your device
   - Clicking the "..." icon and choosing "Import from URL"
