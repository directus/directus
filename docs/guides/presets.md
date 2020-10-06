# Presets & Bookmarks

> Presets define the default state of Collection Detail

## Creating a Preset

1. Navigate to **Settings > Presets & Bookmarks**
2. Click the **Create Preset** action button in the header
3. Complete the **other preset form fields** outlined below

* **Collection** — The collection of this preset; supports any project collection, Directus Files, or Directus Users
* **Scope** — The users that will have access to this preset, either Global, a specific Role, or an individual User
* **Layout** — The collection detail's layout this preset applies to
* **Name** — If left blank, this preset will act as a Default for the collection/layout; if given a name, it will be shown as a bookmark

After you have completed the form, the layout preview will be populated with live data. You can now tailor the layout as desired by updating the preview or the filter component in the page sidebar.

Each preset saves the following information for the collection/preset:

* **Search Query** — Any full-text search entered into the search bar
* **Filters**
* **Layout Query**
* **Layout Options**

## Deleting a Preset

1. Navigate to **Settings > Presets & Bookmarks > [Preset]**
2. Click the red **Delete Preset** action button in the header
3. Confirm this decision by clicking **Delete** in the dialog

:::danger Irreversible Change
This action is permanent and can not be undone. Please proceed with caution.
:::
