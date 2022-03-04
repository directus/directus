# File Library

> The File Library Module aggregates all files within the project into one consolidated library. It is a full-featured
> Digital Asset Management (DAM) system for storing, organizing, browsing, and transforming your various files and
> assets.

![File Library](image.webp)

::: tip There are two Documents on File Management

[Files](/reference/files/).

:::

[[toc]]

## How it Works

::: tip Required Knowledge

idk yet

:::

There are no imposed limits on the types of files. `.jpg`, `.mp4`, `.json`, `.pdf`, `.xlsx` or any other file type can
be stored as needed. This File listing page has the same features and functionality as the
[Collection Page](/app/content-collections/).

- Any files. See more below in [Files Overview](#files-overview).
- folders as well as their option.

<video title="User Directory Options" autoplay muted loop controls>
	<source src="" />
	<p>
		Your browser is not displaying the video for some reason. Here's a <a href="">link to the video</a> instead.
	</p>
</video>

1. Select a Folder. There are two options:
   - Choose desired Folder from the Navigation Bar.
   - Click to create
2. Click to create a File
3. Fill in info
4. Optional Edit:
5. Optional Delete:

## Files

Provides a custom form for viewing assets and embeds, with core fields included out-of-the-box (see below), and the
ability for administrators to add additional custom fields. This page has the same features and functionality as the
[Item Page](/getting-started/glossary/#items).

![File Overview](https://cdn.directus.io/docs/v9/app-guide/file-library/viewing-or-editing-a-file-20220215A.webp)

### Action Buttons

Notice the following Buttons in the Header:

- <span mi btn >check</span> – Saves any edits made to the file.
- <span mi btn sec>tune</span> – Refer [Editing an Image](#editing-an-image).
- <span mi btn sec>save_alt</span> – Downloads the file to your current device.
- <img src="../assets/buttons/move-file.png" alt="Move to Folder" height="32" style="vertical-align: middle; margin: 2px 0; box-shadow: none">
  – Move the file to another folder.
- <span mi btn dngr>delete</span> – Permanently removes the file and its metadata. This action is permanent and can not
  be undone.

::: tip Cannot Delete File When Linked to Another Item

Must remove file from any and all Items in order to delete.

:::

### File Details

![File Details](image.webp)

The Directus Files Collection comes pre-configured with these Fields. The Fields cannot be deleted or edited. However,
new Fields can be added and customized as needed in **Settings > Data Model**.

- **Preview** – A preview of the image or file.
- **Title** – A title for the file.
- **Description** – A description of the file.
- **Tags** – Keywords used for search-ability.
- **Location** – An optional location, eg: where a photo was taken.
- **Storage** – Which storage adapter is used to store the file asset.
- **Filename (Disk)** – LOCKED. This is the actual name of the file in storage.
- **Filename (Download)** – This allows you to set the name of the file when it is downloaded.

### File Sidebar

The file sidebar also includes the following details:

![File Sidebar](image.webp)

- **Type** – The MIME type of the file, displayed in the App as a formatted media type.
- **Dimensions** – (Images Only) The width and height of the image in pixels.
- **Size** – The file-size the asset takes up within the storage adapter.
- **Created** – The timestamp of when the file was uploaded to the project.
- **Owner** – The Directus user that uploaded the file to the project.
- **Modified** – The timestamp of when the file was last modified.
- **Edited By** – The Directus user that modified the file.
- **Folder** – The current parent folder that contains the file.
- **Metadata** – Metadata JSON dump of the file's EXIF, IPTC, and ICC information.

## Editing an Image

On the File Details page, click <span mi btn sec>tune</span> to open an image editor for rotating, cropping, or
mirroring the file.

<video alt="Image Editing" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/editing-an-image-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, click a file to open it's detail page.
2. Click the <span mi btn sec>tune</span> button in the top right to open the image editor.
3. Make your changes and hit <span mi btn>check</span> in the top right to save the updates.

## Replacing a File

Click the image Preview on the File Detail page. This opens a modal, allowing the file to be replaced. This is useful if
you want to change the file, but keep existing file info and maintain all of the file's relationships.

<video alt="Replacing a File" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/replacing-a-file-20220215A.mp4" type="video/mp4">
</video>

## Uploading a File

There are many ways that a file can be uploaded into Directus via the App. We'll cover the primary method below, but
keep in mind that files can also be added directly through different Interfaces. _(e.g. Users can upload their own
Avatar, files with an Image Field will have a file upload Interface on the Item Detail page, etc.)_

<video alt="Uploading a File" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/upload-a-file-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, click on the <span mi btn >add</span> button located in the Header.
2. **Upload** the file. There are three options:
   - Drag a file from your desktop to the modal.
   - Click the modal area to manually select a file from your device.
   - Click the <span mi icon>more_vert</span> icon and choose "Import from URL".

## Folders

![Folders](image.webp)

## Creating a Folder

<video alt="Creating a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/create-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, click on the <span mi btn sec>create_new_folder</span> button located in the header.
2. Fill in the folder name.
3. Click "Save".

## Renaming a Folder

<video alt="Renaming a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/rename-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, right-click on the folder you wish to rename and select "Rename Folder".
2. Update the folder name.
3. Click "Save".

## Moving a Folder

<video alt="Moving a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/move-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, right-click on the folder you wish to move and select "Move to Folder"
2. Select a folder that will be the new parent folder
3. Click "Save"

## Deleting a Folder

<video alt="Deleting a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/delete-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, right-click on the folder you wish to delete and select "Delete Folder"
2. Click "Delete"

::: tip

When you delete a folder, any nested files and folders will be moved one level up.

:::

## Extensibility Options

Directus Core is completely open-source, modular and extensible. Extensions allow you to expand or modify any part of
Directus to fit your needs. Here are some great resources to get started down that track.

- [Extensions > Introduction](/extensions/introduction/)
- [Extensions > Creating Extensions](/extensions/creating-extensions/)
- [Contributing > Introduction](/contributing/introduction/)
- [Contributing > Codebase Overview](/contributing/codebase-overview/)

::: tip Accelerated Development

Working on an enterprise project and looking to outsource or financially sponsor the development of a Shares extension?
Contact [our team](https://directus.io/contact/)

:::

## More Help

Looking for technical support for your non-enterprise project? Chat with thousands of engineers within our growing
[Community on Discord](https://discord.com/invite/directus)
