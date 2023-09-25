---
description:
  Presets store the state of a Collection Page. They can be used to set layout defaults or define bookmarks to specific
  datasets.
readTime: 3 min read
---

# Presets

> Presets are items which store the state of a Collection Page. This allows you to set layout defaults or define
> bookmarks to specific datasets.

::: tip Before You Begin

We recommend you read through the [Quickstart Guide](/getting-started/quickstart) to get an overview of the platform
first, then see our guide on the [Collection Page](/user-guide/content-module/content/collections) so you're familiar
with its features and functionalities.

:::

::: tip Learn More

To manage Presets and Bookmarks programmatically, see our [API guide on Presets](/reference/system/presets).

:::

Remember, a [Collection Page](/user-guide/content-module/content/collections) enables you to customize how its items are
presented. That is, it lets you sort, search, or filter items and even change
[Layouts](/user-guide/content-module/layouts). In some cases, you may need to apply the same display adjustments again
and again. Presets save these adjustments, like a snapshot. You can create presets for all project collections, as well
as `directus_activity`, `directus_files` and `directus_users`.

Admins can access and manage all presets under **Settings > Presets and Bookmarks**.

## Create a Preset

<video title="Create a Preset" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/presets-bookmarks/presets-bookmarks-20220819/create-a-preset-20220819B.mp4" type="video/mp4" />
</video>

There are two types or presets, Defaults and Bookmarks.

A _Default_ determines how a user will initially view a Collection Page. When a user makes adjustments to a given
Collection Page, these are automatically saved as the Default, so the adjustments remain even if the user navigates away
and then returns.

A _Bookmark_ creates another custom display of the Collection Page, which can be accessed any time on the
[Navigation Bar](/user-guide/overview/data-studio-app#_2-navigation-bar). Users can also
[create a Bookmark](/user-guide/content-module/content/collections#create-a-bookmark) for personal use from within the
Content Module.

The method to create a preset shown here is for Admin use only. For Administrators, the process to create either a
Default or a Bookmark is almost exactly the same. The key difference is that if you set a value for **Name**, the preset
becomes a Bookmark. If **Name** is left blank, the preset will be a Default. To create a preset, follow these steps.

1. Navigate to **Settings > Presets & Bookmarks**.
2. Click <span mi btn>add</span> in the header.
3. Configure your preset item's values as desired:
   - **Collection** — Sets the collection this preset will apply to. Notice the layout preview below, which populates
     with live data from the selected collection.
   - **Scope** — Defines which users have access to this preset.
   - **Layout** — Selects a Layout for the preset, which is adjusted from the Sidebar.
   - **Name** — Sets a name, which determines if the preset is a Default or Bookmark. Note that this field supports
     [Translation Strings](/user-guide/content-module/translation-strings.html).
4. Scroll down to the **Layout Preview** section and make any other adjustments or configurations as desired. Each
   preset saves all of the information needed to recreate this Layout Preview, just as it is shown.
5. Click <span mi btn>check</span> to confirm.

::: tip Preset Priority

Multiple Defaults can be created for the same Collection Page for the same user. When this happens, the preset priority
is: User, then Role, then Global.

:::

## Edit a Preset

<video title="Edit a Preset" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/presets-bookmarks/presets-bookmarks-20220819/edit-a-preset-20220819A.mp4" type="video/mp4" />
</video>

1. Navigate to **Settings > Presets & Bookmarks > [preset]**.
2. Reconfigure your preset as desired.
3. Click <span mi btn>check</span> to confirm.

## Delete a Preset

<video title="Delete a Preset" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/presets-bookmarks/presets-bookmarks-20220819/delete-a-preset-20220819A.mp4" type="video/mp4" />
</video>

1. Navigate to **Settings > Presets & Bookmarks > [preset]**.
2. Click <span mi btn dngr>delete</span> in the page header and a popup will appear. Click **Confirm**.

::: danger Irreversible Change

This action is permanent and cannot be undone. Please proceed with caution.

:::
