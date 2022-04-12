- File Size Limitations?
- Folders in the File Library and Role Groups in the User Directory do not represent new Collections.
- Should we move file import/export details into the config section?

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

This page explains how to Import and Export Items as files via the app interface. However, you can also
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
3. Select the file type to import: CSV or JSON.
4. Click **"Start Import"** to import the Items.

:::tip CSV File Details

Each column will need a header that matches a Field name from the Collection. Any CSV column header that does not match
a Field Name in the Collection will be ignored. If two columns in the CSV have the same header, the values from the
first column will be ignored and the second will be used to create the new Items.

:::

:::tip JSON File Details

If a JSON object has two key with the same value, the first will be ignored, and the object will be created using the
value of the second key.

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
3. Click "Import / Export" in the page sidebar.
4. Choose the desired format: CSV, JSON or XML.
5. Choose whether you want to use your current Filters and Settings in the export
6. Click the "Start Export" button to download the file to your device

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
- **Full-Text Search** — Limit exported Items to those with a Field Value that match the search.
- **Filter** — Limit export Items with a Filter.
- **Fields** — Add, remove and reposition the Item Fields that will be exported.
