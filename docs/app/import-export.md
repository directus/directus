- Folders in the File Library and Role Groups in the User Directory do not represent new Collections.

# Import / Export

> The Content, User Directory, and File Library modules allow importing and exporting of multiple Items stored as files.
> This makes it quick and easy for no-code Users to handle tasks like uploading and downloading new customer
> information; pulling down sales data for transformation, reports, and analysis; and beyond.

[[toc]]

::: tip Before You Begin

To use this utility, you will need to be familiar with [Collections](/getting-started/glossary/#collections),
[Items](/getting-started/glossary/#items), and [Fields](/getting-started/glossary/#fields).

:::

:::tip Import / Export via the API

This page details Importing and Exporting of Items as files via the no-code app. However, you can also
[Import](/reference/system/utilities/#import-data-from-file) and
[Export](/reference/system/utilities/#export-data-to-a-file) Items as files programmatically via the API.

:::

## Import Items

<video autoplay muted loop controls title="Import Data From a File">
	<source src="" type="video/mp4" />
</video>

To import Items from a file, follow the steps below.

1. Navigate to the desired Module and Collection.\
   Note: the User Directory and File Library are each composed of one Collection.
2. Click **"Import / Export"** in the Sidebar.
3. Click into the import search box. A file browser will open.
4. Select the desired file and click **"open"**.
5. Click **"Start Import"** to import the Items.

The new Items will now be in the Collection. The file itself will not be saved in the Directus Project.

:::tip Importing CSV Files

Any CSV column header that does not match a Field Name in the Collection will be ignored. If two columns in the CSV have
the same header, then _(moving from left-to-right)_ the values from the second column will be used to create the new
Items.

:::

:::tip Importing JSON Files

Any value from a key that does not match a Field Name in the Collection will be ignored. If a JSON object has two keys
with the same value, the second key-value pair _(moving from top-to-bottom)_ will be used to create the new Items.

:::

## Export Items

<video autoplay muted loop controls title="Export Data to a File">
	<source src="" type="video/mp4" />
</video>

When exporting Items, the [Export Items Menu](#export-items-menu) provides granular control over exactly which Items and
Fields are exported, how they are exported, and where they are exported. To export Items, follow the steps below.

1. Navigate to the desired Module and Collection.\
   Note: the User Directory and File Library are each composed of one Collection.
2. Optional: Configure the dataset as desired _(e.g. layout, options, search, filters, order, etc.)_.
3. Click **"Import / Export"** in the Sidebar
4. Click **"Export Items"** and the [Export Items Menu](#export-items-menu) will appear.
5. Choose the desired format: CSV, JSON or XML.
6. Configure any other export details as desired.
7. Click <span mi btn>download</span> to download the file.

:::tip Exporting to File Library

When downloading 2,500 or more Items, you will be required to download into the Directus Project's File Library. You can
also choose to download to the File Library in the [Export Items Menu](#export-items-menu). In either case, you can
navigate to the File Library to download your file locally.

:::

## Export Items Menu

<video autoplay muted loop controls title="Export Data to a File">
	<source src="" type="video/mp4" />
</video>

- **Format** — Choose to export Items as CSV, JSON, or XML.
- **Limit** — Set the maximum number of Files to be exported, starting from first Item.
- **Export Location** — Download the export file directly to your machine or to the File Library.
- **Folder** — Choose the Folder to download to _(if export location is the Folder Library)_.
- **Sort Field** — Choose Field to sort Items by.
- **Sort Direction** — Choose to sort Items in ascending or descending order.
- **Full-Text Search** — Limit exported Items to ones which match as search results.
- **Filter** — Limit exported Items with a Filter.
- **Fields** — Add, remove and re-order the Item Fields that will be exported.

:::tip Layout Impacts Export Fields

When most Layouts are configured, every single Field will be exported by default and must be manually removed in the
Export Items Menu if unwanted. However, the Table Layout is special. By default, it will export the Fields that are
displayed, but this can also be modified in the Export items Menu.

:::

## Relational Data

Assuming a User has the necessary access permissions, Field Values from other Collections can be imported and exported.

<video autoplay muted loop controls title="Importing Relational Data">
	<source src="" type="video/mp4" />
</video>

- Exports the `id` or uses dot-notation `relational_field.field_name` for Fields on related Collections.
- Able to return all Fields or specify a single related Field.
- Multiple objects will be stored in a list.

## Exporting File Assets and Media

Some Collections may directly or [relationally](#relational-data) include images, videos or other file types among their
Fields. It is not possible to import/export files of any kind because they cannot be stored in CSV, JSON, or XML.

To import and export Files, please see the [File Library Module](/app/file-library/).
