---
description: The File Library Module aggregates all files within the Directus Project into one consolidated library.
readTime: 7 min read
---

# File Library

> The File Library Module aggregates all files within the Directus Project into one consolidated library. It is a
> full-featured Digital Asset Management (DAM) system for storing, organizing, browsing, and transforming your various
> files and assets.

![File Library](https://cdn.directus.io/docs/v9/app-guide/file-library/file-library-20220305A/file-library-20220307A.webp)

::: warning More Documents on Folder and File Management

This is a non-technical, no-code guide to the File Library Module. Please note there is documentation on programmatic
[Folder](/reference/system/folders) and [File](/reference/files) management via the API.

:::

## How it Works

::: tip Required Knowledge

Familiarity with the [Collections Page](/user-guide/content-module/content/collections) will be helpful but not
necessary.

:::

The File Library acts as one big [Folder](#folders) to store all uploaded [Files](#files). Sub-folders can be created
within the File Library to help Files stay organized. Folders and File information are stored in regular Collections,
which means [User and Role access permissions](/user-guide/user-management/users-roles-permissions) are fully
configurable and granular on both Folders and Files. Multiple files can be uploaded at once through the app and also
programmatically via the API. Any type of file can be uploaded, _not just images_. When a Folder is selected from the
Navigation Bar, the [File Listing Page](#folders) is presented. This page has all the same features and functionalities
as the [Collections Page](/user-guide/content-module/content/collections).

<video title="How the File Library Works" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/file-library/file-library-20220305A/how-it-works-20220305A.mp4" type="video/mp4"/>
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
   - Click the popup area to manually select a file from your device.
   - Click <span mi icon>more_vert</span> in the popover and choose **"Import from URL"**.
4. Optional: Click the File Display to open the File Details Page and fill in information as desired.

## Files

When a file is clicked in the File Listing Page, the File Details Page appears. This is a custom form for viewing assets
and embeds, with core Fields included out-of-the-box (see below), and the ability for Administrators to add additional
custom Fields. This page has the same features and functionality as the
[Item Page](/user-guide/overview/glossary#items).

![Files](https://cdn.directus.io/docs/v9/app-guide/file-library/file-library-20220305A/files-20220305A.webp)

### Action Buttons

Notice the following Buttons in the Header:

- <span mi btn >check</span> – Saves any edits made to the file.
- <span mi btn sec>tune</span> – Please see [Edit an Image](#edit-an-image) to learn more.
- <span mi btn sec>save_alt</span> – Downloads the file to your current device.
- <span mi btn sec>drive_file_move</span> – Moves selected File(s) to another Folder.
- <span mi btn dngr>delete</span> – Permanently removes the File and its metadata. This action is permanent and cannot
  be undone.

::: tip Deleting Files Linked to Items

By default, Directus will not allow you to delete a File until you remove it from any and all related Items. However,
this behavior can be reconfigured so that Files automatically update when the image is deleted by setting the relational
constraint of your File Field to `SET NULL` or `CASCADE` when the File is deleted.

:::

### File Details

The Files Collection comes pre-configured with the following Fields out of the box. New Fields can be created and
customized as needed in **Settings > Data Model**. However the pre-configured Fields cannot be changed or deleted.

![File Details](https://cdn.directus.io/docs/v9/app-guide/file-library/file-library-20220305A/file-details-20220305A.webp)

- **Preview** – A preview of the image or file.
- **Title** – A title for the File.
- **Description** – A description of the File.
- **Tags** – Keywords used for search-ability.
- **Location** – An optional location _(e.g. where a photo was taken)_.
- **Storage** – Which storage adapter is used to store the file asset.
- **Filename (Disk)** – LOCKED. This is the actual name of the file in storage.
- **Filename (Download)** – Allows you to set the name of the file when it is downloaded.

### File Sidebar

The file sidebar also includes the following details, which are not editable and serve as metadata.

![File Sidebar](https://cdn.directus.io/docs/v9/app-guide/file-library/file-library-20220305A/file-sidebar-20220305A.webp)

- **Type** – The MIME type of the file, displayed in the App as a formatted media type.
- **Dimensions** – _Images only_. The width and height of the image in pixels.
- **Size** – The file-size the asset takes up in the storage adapter.
- **Created** – The timestamp of when the file was uploaded to the Project.
- **Owner** – The User that uploaded the file to the Project.
- **Modified** – The timestamp of when the file was last modified.
- **Edited By** – The User that modified the File.
- **Folder** – The current parent folder that contains the File.
- **Metadata** – Metadata JSON dump of the File's Exif, IPTC, and ICC information.

## Edit an Image

Rotate, crop, flip, adjust aspect ratios, or set focal points of an image.

1. From the **File Library**, click a file to open its detail page.
2. Click the <span mi btn sec>tune</span> button in the top right to open the image editor.
3. Make your changes and click <span mi btn>check</span> in the top right to save the updates.

::: danger Irreversible Change

Edits overwrite the original file on disk. This can't be reversed.

:::

## Set a Focal Point

By default, Directus will crop images around the center when specific sizes are requested. Focal points change the
center point to specific coordinates.

1. From the **File Library**, click a file to open its detail page.
2. Click the <span mi btn sec>tune</span> button in the top right to open the image editor.
3. Click the <span mi btn sec>location_searching</span> button to select a focal point.
4. Make your changes and click <span mi btn>check</span> in the top right to save the updates.

## Upload a File

We covered the File Library's three upload methods in [How it Works](#how-it-works). Keep in mind that files can also be
added through different Interfaces as well. For example, Users can upload an Avatar image when they fill in their User
Details. Similarly, Items with an Image Field will have a file upload Interface on the Item Detail page. Files can also
be [uploaded programmatically via the API](/reference/files).

## Replace a File

When a file is replaced, its existing info and all relationships are kept.

<video alt="Replace a File" loop muted controls autoplay playsinline>
  <source src="https://cdn.directus.io/docs/v9/app-guide/file-library/file-library-20220608A/replace-a-file-20220608A.mp4" type="video/mp4">
</video>

1. Click the Image Preview on the File Detail page. A popup will appear.
2. Upload your file. You have 3 options:
   - Drag a file from your desktop to the popup.
   - Click the popup area to manually select a file from your device.
   - Click <span mi icon>more_vert</span> in the popover and choose **"Import from URL"**.
