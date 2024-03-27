---
description: Layouts are customized displays for viewing and interacting with the Items in a Collection.
readTime: 9 min read
---

# Layouts

> Layouts are customized displays for viewing and interacting with the Items in a Collection. This makes working with
> specific types of data models, such as map locations or calendar events, a more human-friendly experience.

## What's a Layout?

<video autoplay playsinline muted loop controls title="Layouts Montage">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/layouts-20220415A/layouts-montage-20220419A.mp4" type="video/mp4" />
</video>

Data models vary drastically in shape and purpose, from eCommerce platforms to IoT fleets and everything in between.
While excel-style data tables often closely resemble how the data is stored in the database, this is not always the most
human-friendly way to view the data. Layouts provide intuitive displays to view and interact with Items in a Collection.

## How it Works

<video autoplay playsinline muted loop controls title="Adjust Item Layouts">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/layouts-20220415A/adjust-page-layout-20220415A.mp4" type="video/mp4" />
</video>

To adjust an Item's Layout, follow these steps.

1. Navigate to the [Content Module](/user-guide/content-module/content) and select the desired Collection.
2. In the page Sidebar, click **"Layout Options"**.
3. Choose the desired Layout you want to use.
4. Customize the Layout as desired.

### Customization Controls

Customization controls can be found in the following three locations.

- **Layout Options** — Located in the Sidebar.
- **Subheader** — Located just below the Page Header and above the Page Area.
- **Page Area** — The center of the webpage, which displays all Items.

These controls typically fall into three general categories.

- **Styling and Formatting**\
  These are additional customizations to the way a Layout displays such as the size of each Item, how images are cropped,
  etc.

- **Field Values Displayed**\
  Most Layouts allow you to choose which Field Value(s) are used to represent each Item on the Collection Page. For example,
  with blog posts, it may be ideal to have the hero image, blog title, date, author, etc.

- **Manual and Automatic Sorting**\
  Certain Layouts may allow sorting Items by value in ascending and descending order, drag-and-drop repositioning of Items,
  etc.

### Key Takeaways

As you go through Layouts, it may be helpful to keep the following points in mind.

- **Layouts will not be universally usable for all Collections.**\
  Layouts are tailored to work with specific data-models. For example, in order to work properly, the Map Layout requires
  the Collection have a Map Field configured and the Calendar Layout requires the Collection have a datetime Field configured.

- **Controls are different for each Layout.**\
  Each Layout presents data differently, so certain customizations may not be functional with certain Layouts. For example,
  the Map Layout displays each Item as a pin on a map, so this Layout has no controls for sorting.

- **Controls for a Layout may be in different locations.**\
  Depending on the Layout, the same control may be under Layout Options in the sidebar, the subheader, or on the Page Area
  _(and Items themselves)_. For example, the Table Layout lets you set the Field Values displayed in the subheader while
  the Card Layout lets you set Field Values displayed in the Layout Options menu.

## Table Layout

<video autoplay playsinline muted loop controls title="Table Layout">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/Layouts-20221205/table-layout-20221202A.mp4" type="video/mp4" />
</video>

This Layout supports all forms of data, as it directly reflects how data is stored in a Collection. This is the default
Layout used in the Content Module. It includes the following controls.

**Layout Options**

- **Spacing** — Adjust the vertical space a row takes up.

**Subheader**

- **Adjust Column Width** — Click and drag the column divider to resize as desired.
- **Add Field** — Select <span mi icon>add</span> in the page subheader and select the desired Field(s).
- **Remove Field** — Select <span mi icon>arrow_drop_down</span> in the column title and click **"Hide Field"**.
- **Sort Items by Column** — Select <span mi icon>arrow_drop_down</span> in the column title and sort ascending or
  descending.
- **Set Text Alignment** — Select <span mi icon>arrow_drop_down</span> in the column title and set left, right, or
  center.
- **Toggle & Reorder Columns** — Click the column header, then drag-and-drop as desired.
- **Select All** — Click <span mi icon>check_box_outline_blank</span> in the selection column header.

**Page Area**

- **Select Item(s)** — Click <span mi icon>check_box_outline_blank</span> in the selection column for the desired
  Item(s).
- **Manually Sort Items** — Toggle <span mi icon>sort</span> in the configured Sort column to drag and drop
  <span mi icon>drag_handle</span> Items.

::: warning Manual Sorting Requires Configuration

Only available if you [configure a sort field](/app/data-model/collections#sort-field) in the Collection's Data Model
Settings.

:::

## Card Layout

<video autoplay playsinline muted loop controls title="Card Layout">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/Layouts-20221205/card-layout-20221205A.mp4
" type="video/mp4" />
</video>

This tiled Layout is ideal for Collections that prioritize an image _(e.g. a user or blog post)_. This is the default
for both the [User Directory](/user-guide/user-management/user-directory) and
[File Library](/user-guide/file-library/files). It includes the following controls.

**Layout Options**

- **Image Source** — Set the Field used as the display image.
- **Title** — Sets a display template to use as a title.
- **Subtitle** — Sets a display template to use as a subtitle.
- **Image Fit** — Set how an image fits inside the Card.
- **Fallback Icon** — Set a default icon to display when an Item has no image.

**Subheader**

- **Card Size** — Toggle the Card size as it appears in the Page Area.
- **Order Field** — Click to select the Field you wish to order by from the dropdown menu.
- **Order Direction** — Toggle ascending and descending order.
- **Select All** — Click **"<span mi icon>check_circle</span> Select All"** in the selection column header.

**Page Area**

- **Select Item(s)** — Click <span mi icon>radio_button_unchecked</span> in the selection column for the desired
  Item(s).

## Calendar Layout

<video autoplay playsinline muted loop controls title="Calendar Layout">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/Layouts-20221205/calendar-layout-20221205A.mp4" type="video/mp4" />
</video>

This Layout is ideal for Collections with time-oriented data _(e.g. events and appointments)_. It includes the following
controls.

**Layout Options**

- **Display Template** — Set a mix of Field values and text to represent Items on the calendar.
- **Start Date Field** — Choose Field to determine each Item's beginning time on the calendar.
- **End Date Field** — Choose Field to determine each Item's ending time on the calendar.
- **First Day of The Week** — Defines the beginning of the week on the calendar.

**Subheader**

- **Toggle Month and Year** — Move across time using the chevrons in the subheader.
- **Today** — Click to jump to the current date on the calendar.
- **Month Week Day List** — Adjust the time interval used to display Items in the Page Area.

**Page Area**

- **Select Item** — Click an Item on the calendar to open its Item Page.

::: tip Configuration Requirements

To use this Layout, the Collection will need at least one datetime [Field](/app/data-model/fields) to set a start time,
but ideally two datetime Fields _(to set a start time and end time)_.

:::

## Map Layout

<video autoplay playsinline muted loop controls title="Map Layout">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/Layouts-20221205/map-layout-20221205A.mp4" type="video/mp4" />
</video>

This Layout is ideal for Collections that emphasize geospatial data. It provides a world map, with Items displayed as
points, lines, and other geometry. The following options are available:

**Layout Options**

- **Basemap** — Choose the map provider used for the Collection.
- **Geospatial Field** — Select the geospatial field type to display on screen:
  - **Map JSON Point** — Supports latitude-longitude based, single-point locations.
  - **Map Geometry** — Supports geometric areas such as lines and polygons.
- **Display Template** — Choose the Fields displayed when hovering over an Item on the map.
- **Cluster Nearby Data** — Toggle whether or not nearby Items get clustered into a single pin.

**Subheader**\
_There is no Subheader on the Map Layout._

**Page Area**

- **Zoom** — Click <span mi icon>add</span> and <span mi icon>remove</span> in the upper left hand corner of the Page
  Area to zoom in and out.
- **Find my Location** — Click <span mi icon>my_location</span> to zoom into your current location on the map.
- **Reframe** — Click the square in the upper left-hand corner to resize and reframe the map area.
- **Select Item** — Click a single Item to enter its Item Page.
- **Select Items** — Click and drag to select multiple Items at once, opening the Item Page.

::: tip Configuration Requirements

To use this Layout, the Collection must have a Map Field configured.

<!--
@TODO configuration > data-model > fields
Link to Map Field
-->

:::

## Kanban Layout

<video autoplay playsinline muted loop controls title="Kanban Layout">
	<source src="https://cdn.directus.io/docs/v9/app-guide/layouts/Layouts-20221205/kanban-layout-20221205A.mp4" type="video/mp4" />
</video>

This Layout is ideal for Collections that serve as project management tools or to-do lists, where each Item represents a
task, because it groups Items onto columns according to their status _(e.g. "Not Started", "In Progress", "Under
Review", "Complete", or any other status defined)_. The following controls are available.

**Layout Options**

- **Group By** — Select the Field used to define Item status. See below for details.
- **Card Title** — Choose the Field use to serve as the title for each kanban board.
- **Card Text** — Choose a Field to display additional text on each Item.

**Layout Options > Advanced**

- **Card Tags** — Choose a Tag Field to be displayed on the Item.
- **Card Date** — Choose a Datetime Field to be displayed on each Item.
- **Card Image** — Choose an Image Field to be displayed on each Item.
- **Card Image Fit** — Toggle whether the image fit is cropped.
- **Card User** — Choose the User Created Field to display their avatar in the bottom right corner.
- **Show Ungrouped** — Toggle display of a column containing Items with no assigned status.

**Subheader**\
_There is no Subheader for the Kanban Layout._

**Page Area**

- **Create Task and Assign Status** — Click <span mi icon>add</span> in a status column and the Item Page will open.
- **Sort Panels** — Drag and drop Items to reposition or change task status.
- **Add Status Panel** — Click <span mi icon>add_box</span> and add a group name (i.e. new status column).
- **Edit or Delete Status Column** — Click <span mi icon>more_horiz</span> and then click <span mi icon>edit</span> to
  edit or <span mi icon>delete</span> to delete.

::: tip Configuration Requirements

To make this Layout work, you will need to configure an appropriate status [Field](/app/data-model/fields) on the
Collection, then identify this Field under **"Group By"** in the Layout Options menu.

:::
