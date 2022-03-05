# File Library

> The File Library Module aggregates all files within the project into one consolidated library. It is a full-featured
> Digital Asset Management (DAM) system for storing, organizing, browsing, and transforming your various files and
> assets.

![File Library](image.webp)

::: warning There are two Documents on File Management

This is a non-technical [Files](/reference/files/).

:::

[[toc]]

## How it Works

::: tip Required Knowledge

Familiarity with the [Collections Page](<(/app/content-collections/)>) will be helpful but not necessary.

:::

The File Library acts as one big [Folder](#folders) to store all uploaded [Files](#files). Sub-folders can be created
within the File Library to help Files stay organized. User and Role access permissions are fully configurable and
granular on both Folders and Files. Any type of file can be uploaded, _not just images_. When a Folder is selected from
the Navigation Bar, the [File Listing Page](#folders) is presented, which has all the same features and functionality as
the [Collections Page](/app/content-collections/).

<video title="User Directory Options" autoplay muted loop controls>
	<source src="" />
	<p>
		Your browser is not displaying the video for some reason. Here's a <a href="">link to the video</a> instead.
	</p>
</video>

1. Select a Folder. There are two options:
   - Choose desired Folder from the Navigation Bar.
   - Click <span mi btn sec>create_new_folder</span> in the Page Header, name your folder, and click **"Save"**.
2. Click <span mi btn>add</span> in the Page Header. A popover will appear.
3. Upload your file. You have 3 options:
   - Drag a file from your desktop to the popup.
   - Click the modal area to manually select a file from your device.
   - Click <span mi icon>more_vert</span> in the popover and choose **"Import from URL"**.
4. Fill in any other information as desired.

## Files

When a file is clicked in the File Listing Page, the File Details Page appears. This is a custom form for viewing assets
and embeds, with core Fields included out-of-the-box (see below), and the ability for administrators to add additional
custom Fields. This page has the same features and functionality as the
[Item Details Page](/getting-started/glossary/#items).

![File Overview](https://cdn.directus.io/docs/v9/app-guide/file-library/viewing-or-editing-a-file-20220215A.webp)

### Action Buttons

Notice the following Buttons in the Header:

- <span mi btn >check</span> – Saves any edits made to the file.
- <span mi btn sec>tune</span> – Please see [Editing an Image](#edit-an-image) to learn more.
- <span mi btn sec>save_alt</span> – Downloads the file to your current device.
- <span mi btn sec>drive_file_move</span> – Moves the file to another folder.
- <span mi btn dngr>delete</span> – Permanently removes the file and its metadata. This action is permanent and cannot
  be undone.

::: tip Cannot Delete File When Linked to Another Item

Directus will not allow you to delete a File until you remove it from any and all related Items.

:::

### File Details

![File Details](image.webp)

The Directus Files Collection comes pre-configured with the following Fields, which cannot be deleted or edited.
However, new Fields can be added and customized as needed in **Settings > Data Model**.

- **Preview** – A preview of the image or File.
- **Title** – A title for the File.
- **Description** – A description of the File.
- **Tags** – Keywords used for search-ability.
- **Location** – An optional location _(e.g. where a photo was taken)_.
- **Storage** – Which storage adapter is used to store the file asset.
- **Filename (Disk)** – LOCKED. This is the actual name of the file in storage.
- **Filename (Download)** – Allows you to set the name of the file when it is downloaded.

### File Sidebar

The file sidebar also includes the following details:

![File Sidebar](image.webp)

- **Type** – The MIME type of the file, displayed in the App as a formatted media type.
- **Dimensions** – (Images Only) The width and height of the image in pixels.
- **Size** – The file-size the asset takes up within the storage adapter.
- **Created** – The timestamp of when the file was uploaded to the Project.
- **Owner** – The Directus user that uploaded the file to the Project.
- **Modified** – The timestamp of when the file was last modified.
- **Edited By** – The Directus user that modified the File.
- **Folder** – The current parent folder that contains the File.
- **Metadata** – Metadata JSON dump of the File's EXIF, IPTC, and ICC information.

## Edit an Image

On the File Details page, click <span mi btn sec>tune</span> to open an image editor for rotating, cropping, or
mirroring the file.

<video alt="Image Editing" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/editing-an-image-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, click a file to open its detail page.
2. Click the <span mi btn sec>tune</span> button in the top right to open the image editor.
3. Make your changes and click <span mi btn>check</span> in the top right to save the updates.

## Upload a File

We covered how to upload files through the File library in [How it Works](#how-it-works). Keep in mind that files can
also be added through different Interfaces. For example, Users can upload an Avatar image when they fill in their User
Details. Similarly, Items with an Image Field will have a file upload Interface on the Item Detail page. Files can also
be [uploaded via the API](/reference/files/).

## Replace a File

This is useful if you want to change the file, but keep existing file info and maintain all of the file's relationships.

<video alt="Replacing a File" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/replacing-a-file-20220215A.mp4" type="video/mp4">
</video>

1. Click the image Preview on the File Detail page. A popup will appear.
2. Upload your file. You have 3 options:
   - Drag a file from your desktop to the popup.
   - Click the modal area to manually select a file from your device.
   - Click <span mi icon>more_vert</span> in the popover and choose **"Import from URL"**.

## Folders

![Folders](image.webp)

## Create a Folder

<video alt="Creating a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/create-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, click on the <span mi btn sec>create_new_folder</span> button located in the header.
2. Fill in the folder name.
3. Click "Save".

## Rename a Folder

<video alt="Renaming a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/rename-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, right-click on the folder you wish to rename and select "Rename Folder".
2. Update the folder name.
3. Click "Save".

## Move a Folder

<video alt="Moving a Folder" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/move-a-folder-20220215A.mp4" type="video/mp4">
</video>

1. From the **File Library**, right-click on the folder you wish to move and select "Move to Folder"
2. Select a folder that will be the new parent folder
3. Click "Save"

## Delete a Folder

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
