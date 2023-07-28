# Fields

> Fields are database columns. Fields also enable you to manage the backend logic _(such as conditional display logic,
> input verification rules, etc.)_ and frontend design used to display its data _(e.g., whether data will display in a
> table or on a map)_.

## Overview

<video title="Fields Overview" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/data-model-20220805/fields-20220805A.mp4" type="video/mp4" />
</video>

To access a collection's fields, navigate to **Settings > Data Model > [Collection]**. From here, you can click a field
to access its **Configuration Drawer** and make advanced configurations. You also have the following controls for each
field.

**Fields and Layout** — Create, view, and configure a collection's fields as well as adjust how they are displayed and
ordered on the [Item Details Page](/user-guide/content-module/content/collections#item-page). This section also provides
access to the **Field Context Menu** and **Field Configuration Drawer**, described below.

**Field Context Menu <span mi icon>more_vert</span>** — Contains the following controls:

- [<span mi icon>edit</span> Edit Field](#configure-a-field) — Opens the **Field Configuration Drawer**.
- [<span mi icon>content_copy</span> Duplicate Field](#duplicate-a-field) — Duplicates a field along with all of its
  configuration options.
- [<span mi icon>visibility_off</span> Hide Field on Detail](#toggle-field-visibility-for-admins) — Toggle field
  visibility on the Item Detail Page for Admin Users.
- [Width](#adjust-field-width) — Fields have three different width options:
  - <span mi icon>border_vertical</span> Half Width — The field input is shown at half the form width.
  - <span mi icon>border_right</span> Full Width — The default. The field input is shown at the full form width.
  - <span mi icon>aspect_ratio</span> Fill Width — The field input is shown filling the full width of the page area.

**The Field Configuration Drawer** — Provides all [field configuration](#configure-a-field) options.

## Create a Field (Standard)

<video title="Create a Field (Standard)" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/create-a-field-20220805A.mp4" type="video/mp4" />
</video>

To make field configuration as intuitive and easy as possible, a template wizard is provided so that you can create
fields pre-configured for common use-cases. When you create a field this way, you will still have full power to
[configure the field](#configure-a-field) as desired.

1. Navigate to **Settings > Data Model > [Collection]**.
2. Under **Fields & Layout**, click the **Create Field** button.\
   A side drawer will open, with various pre-configured Interfaces to choose from.
3. Click to select the desired field and a basic configuration menu will open.
4. Add a **Field Key**, _which is also used as the default field name_.\
   Optional: Configure the other field details as desired.\
   Optional: Click [Continue in Advanced Field Creation Mode](#create-a-field-advanced).
5. When you are ready, click **Save** to confirm.

## Create a Field (Advanced)

<video title="Create a Field (Advanced)" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/create-a-field-advanced-20220805A.mp4" type="video/mp4" />
</video>

This field creation method opens the **Field Configuration Drawer** so you can customize every field detail from the
start. To create a field in advanced mode, follow these steps.

1. Navigate to **Settings > Data Model > [Collection Name]**.
2. Under **Fields & Layout**, click the **Create Field in Advanced Mode** button.\
   A dropdown menu will appear with various field types to choose from.
3. Click to choose the field type and the **Field Configuration Drawer** will open.
4. Configure your field as desired.
5. Click <span mi btn>check</span> to confirm.

::: tip Database Columns

Remember, a field is a database column. Therefore, you can create a column directly in the database and it will
automatically appear within Directus. You can then enhance the experience further by configuring it as desired.

:::

## Configure a Field

<video title="Configure a Field" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/configure-a-field-20220805A.mp4" type="video/mp4" />
</video>

Fields are configured in the **Field Configuration Drawer**, which is composed of eight sections. These provide
extensive customization options, from the database column's details, to how it is displayed and interacted with, and
even custom input validation and conditional display logic. To configure a field, follow these steps.

1. Navigate to **Settings > Data Model > [Collection Name]**.
2. Under **Fields & Layout**, click the field you want to update.\
   The **Field Configuration Drawer** will open.
3. Navigate to one of these sections and configure the field as desired:
   - **Schema** — Defines the database column schema for the field.
   - **Relationship** — Controls _and only appears when configuring relational_ field details.
   - **Translations** — Controls _and only appears when configuring translation_ field details.
   - **Field** — Sets details for the field input, which is displayed on the
     [item page](/user-guide/content-module/content/items).
   - **Interface** — Configures how you interact with the field's values.
   - **Display** — Configures how field values are displayed in the Data Studio.
   - **Validation** — Creates a filter to determine valid user input.
   - **Conditions** — Alters the current field's setup based on the values of other fields.
4. Click <span mi btn>check</span> to confirm.

::: tip Fields in System Collections

While all out-of-the-box fields within system collections are locked from configuration or deletion, you are able to
create new fields within system collections.

:::

## Duplicate a Field

<video title="Duplicate a Field" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/duplicate-a-field-20220805A.mp4" type="video/mp4" />
</video>

To duplicate a field, follow these steps.

1. Navigate to **Settings > Data Model > [Collection Name]**.
2. Click the <span mi icon>more_vert</span> icon for the field you want to duplicate.
3. Click the <span mi icon>content_copy</span> **Duplicate Field** option.
4. Choose the collection you'd like to create the field in and set the Field Name.

::: warning Relational and Primary Key Fields

Currently, it is not possible to duplicate relational fields or a collection's primary key.

:::

::: tip Duplicates Configurations Only

When you duplicate a field, all of its configuration settings will be copied as well. However, values stored within that
field will not be copied.

:::

## Toggle Field Visibility (for Admins)

<video title="Toggle Field Visibility (for Admins)" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/toggle-field-visibility-20220805A.mp4" type="video/mp4" />
</video>

For users with any _non-admin_ role, a field's visibility can be adjusted via
[access permissions](/user-guide/user-management/users-roles-permissions). However, you may want to hide certain fields
for admins as well. This is handy if the field is distracting or has no need to be seen on the item details page.

## Adjust Field Width

<video title="Group and Sort Field" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/adjust-field-width-20220805A.mp4" type="video/mp4" />
</video>

Adjusting the field width in **Fields and Layout** will change field width on the
[Item Detail Page](/user-guide/content-module/content#item-page). To adjust field width, follow these steps.

1. Click <span mi icon>more_vert</span> to open the field's context menu.
1. Choose one of the following:
   - <span mi icon>border_vertical</span> **Half Width** — The field is shown at half the form width.
   - <span mi icon>border_right</span> **Full Width** — The default. The field is shown at the full form width.
   - <span mi icon>aspect_ratio</span> **Fill Width** — The field is shown filling the full width of the page area.

## Manually Sort Fields

<video title="Group and Sort Field" autoplay muted loop controls playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/manually-sort-fields-20220805A.mp4" type="video/mp4" />
</video>

Adjusting the field order in **Fields and Layout** will change its order on the
[Item Page](/user-guide/content-module/content/collections#item-page). To manually sort fields, click
<span mi icon>drag_indicator</span> to drag and drop the field as desired.

## Delete a Field

<video autoplay muted loop controls title="" playsinline>
	<source src="https://cdn.directus.io/docs/v9/configuration/data-model/fields/fields-20220805/delete-a-field-20220805A.mp4" type="video/mp4" />
</video>

To permanently delete a field and all its stored values, follow these steps.

1. Navigate to **Settings > Data Model > [Collection Name]**.
2. Click the <span mi icon>more_vert</span> icon for the field you want to delete.
3. Click the <span mi icon dngr>delete</span> **Delete Field** option.
4. Confirm this decision by clicking **Delete** in the dialog.

::: danger Irreversible Change

This action is permanent and cannot be undone. Please proceed with caution.

:::
