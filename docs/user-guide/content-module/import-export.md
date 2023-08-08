---
description:
  The Content, User Directory, and File Library modules allow importing and exporting of multiple Items stored as files.
readTime: 4 min read
---

# Import / Export

> The Content, User Directory, and File Library modules allow importing and exporting of multiple Items stored as files.
> This makes it quick and easy to handle tasks like uploading and downloading new customer information; pulling down
> sales data for transformation, reports, analysis, and beyond.

::: tip Before You Begin

To use this utility, you will need to be familiar with [Collections](/user-guide/overview/glossary#collections),
[Items](/user-guide/overview/glossary#items), and [Fields](/user-guide/overview/glossary#fields).

<!--
@TODO Getting Started > Introduction
Link when ready
-->

:::

::: tip Import / Export via the API

This page details Importing and Exporting of Items as files via the no-code app. However, you can also
[Import](/reference/system/utilities#import-data-from-file) and
[Export](/reference/system/utilities#export-data-to-a-file) Items as files programmatically via the API.

:::

## Import Items

<video autoplay playsinline muted loop controls title="Import Data From a File">
	<source src="https://cdn.directus.io/docs/v9/app-guide/imports-exports/imports-exports-20220415A/import-items-20220416A.mp4" type="video/mp4" />
</video>

To import Items from a file, follow the steps below.

1. Navigate to the desired Module and Collection.\
   Note: the User Directory and File Library are each composed of just one Collection.
2. Click **"Import / Export"** in the Sidebar.
3. Click into the import search box. A file browser will open.
4. Select the desired file and click **"open"**.
5. Click **"Start Import"** to import the Items.

The Items will now be in the Collection. The file itself will not be stored in the Directus Project.

::: tip Importing Relational Files

It is possible to import relational Field values as well. For this task, the User performing the import will need access
permissions for the related Collection and a firm understanding of the relational data model.

<!--
@TODO config > import / export
Add link
-->

:::

## Export Items

<video autoplay playsinline muted loop controls title="Export Data to a File">
	<source src="https://cdn.directus.io/docs/v9/app-guide/imports-exports/imports-exports-20220415A/export-items-20220416A.mp4
" type="video/mp4" />
</video>

When exporting Items, the [Export Items Menu](#export-items-menu) provides granular control over exactly which Items and
Fields are exported, how they are exported, and where they are exported. To export Items, follow the steps below.

1. Navigate to the desired Module and Collection.\
   Note: the User Directory and File Library are each composed of one Collection.
2. Click **"Import / Export"** in the Sidebar.
3. Click **"Export Items"** and the [Export Items Menu](#export-items-menu) will appear.
4. Choose the desired format: CSV, JSON, XML, or YAML.
5. **Optional:** Configure any other export details as desired.
6. Click <span mi btn>download</span> to download the file.

::: tip Opening the file in Excel?

Export your file to CSV to seamlessly open in excel.

:::

::: tip Exporting to File Library

When downloading 2,500 or more Items, you will be required to download into the Directus Project's File Library. After
exporting, go to the File Library to download your file locally.

:::

::: tip Exporting Relational Files

It is possible to export relational Field values. For this task, the User performing the export will need access
permissions for the related Collection and a firm understanding of the relational data model.

<!--@TODO link to config access permissions when ready-->

:::

## Export Items Menu

<video autoplay playsinline muted loop controls title="Export Data to a File">
	<source src="https://cdn.directus.io/docs/v9/app-guide/imports-exports/imports-exports-20220415A/export-items-menu-20220416A.mp4" type="video/mp4" />
</video>

This menu provides granular control over exactly which Items and Fields are exported, how they are exported, and where
they are exported.

- **Format** — Choose to export Items as CSV, JSON, XML, or YAML.
- **Limit** — Set the maximum number of Items to be exported.
- **Export Location** — Download the export file directly to your machine or to the File Library.
- **Folder** — Choose the Folder to download to _(if export location is the Folder Library)_.
- **Sort Field** — Choose Field to sort Items by.
- **Sort Direction** — Choose to sort Items in ascending or descending order.
- **Full-Text Search** — Limit exported Items to ones which matched as search results.
- **Filter** — Limit exported Items with a Filter.
- **Fields** — Add, remove, and re-order the Item Fields that will be exported.

## File Assets and Media

Some Collections may directly or relationally include Fields referencing images, videos or other file types. It is not
possible to import or export files with this utility.

To import and export files, please see the [File Library Module](/user-guide/file-library/files).

::: tip What does Import/Export do in the File Library?!

Import/Export handles Field Values associated with the file _(e.g. id, title, description, etc.)_.

:::
