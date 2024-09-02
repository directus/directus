---
description:
  Directus offers an extremely granular, yet easy to configure permissions system. When you create a role, all
  permissions are turned off by default.
readTime:
---

# Permissions

> Directus offers an extremely granular, yet easy to configure permissions system. When you create a role, all
> permissions are turned off by default. From here, you explicitly reconfigure its permissions for each collection as
> desired.

::: tip Learn More

To configure permissions programmatically, see our API documentation on [permissions](/reference/system/permissions).

:::

## Configure Permissions

![How to configure role permissions](https://marketing.directus.app/assets/d6eacb7e-7657-44fc-91a0-c3f21306b34a.gif)

To configure a role's access permissions, follow these steps.

1. Navigate to **Settings > Access Control > [Role]** and scroll to **Permissions**.\
   Each collection is a row. Its [CRUDS permissions](/user-guide/user-management/users-roles-permissions#directus-permissions)
   are in columns.
2. Click the icon of the collection and permission type that you want to set and a tooltip will appear. If you'd like to
   adjust permissions for Directus system collections, then click **System Collections** to expand the menu and access
   these collections.
3. Click the icon in the relevant collection row and CRUDS permission column and a popup menu will appear with the
   following permission levels:
   - <span mi icon muted>check</span> **All Access** — Grants permission to all items in the collection.
   - <span mi icon muted>block</span> **No Access** — Denies permission to all items in the collection.
   - <span mi icon muted>rule</span> **Use Custom** — Opens the custom access permissions drawer.
4. From here, there are two possibilities:
   - If you selected <span mi muted>check</span> **All Access** or <span mi muted>block</span> **No Access**, setup is
     complete.
   - If you chose <span mi icon muted>rule</span> **Use Custom**, please see
     [Configure Custom Permissions](#configure-custom-permissions).

::: warning Admin Roles

If you configured the role's details to have **Admin Access**, permission configuration is disabled.

:::

## Configure Custom Permissions

![How to configure custom role permissions](https://marketing.directus.app/assets/68e68b6c-a503-457f-8c9b-73d5b226639a.gif)

To configure custom access permissions for a role, follow these steps.

1. Follow the steps to [configure permissions](#configure-permissions) and choose <span mi icon muted>rule</span> **Use
   Custom** on step four.
2. Configure custom access permission validations as desired. For each CRUDS permission, you will have one or more of
   the following sub-menus:

   - **Item Permissions** — Set [filters](/user-guide/content-module/filters) to define items the role is granted
     permissions.
   - **Field Permissions** — Toggle to limit which fields the role is granted permissions.
   - **Field Validation** — Set [filters](/user-guide/content-module/filters) to define valid field values on create or
     update.
   - **Field Presets** — Use JSON to set default field values on [create](/reference/items#create-an-item) or
     [update](/reference/items#update-an-item) of an item. The value will then appear on the item page, and can be
     overwritten if desired.

3. Click <span mi btn>check</span> in the side drawer header to confirm and save custom access permissions.

## Toggle All Collection Permissions

![How to toggle all collection permissions](https://marketing.directus.app/assets/9903d727-6d97-4a1b-84f8-3f6bdc10b73a.gif)

To grant or restrict all CRUDS permissions to a collection at once, follow these steps.

1. Navigate to **Settings > Access Control > [Role]**.
2. Mouse over the desired collection's name and the following options will appear:
   - **All** — Click to enable all CRUDS permissions for a collection.
   - **None** — Click to restrict all CRUDS permissions for a collection.

## Reset System Permissions

![How to reset system permissions](https://marketing.directus.app/assets/7db0408a-a456-43e7-bfe4-6bb9aef2374d.gif)

This is only available when **App Access** is enabled when you configure role details. If you made any custom
configurations to system collections, these will be reverted. To reset system permissions, follow these steps.

1. Navigate to **Settings > Access Control > [Role]**.
2. At the bottom of **Permissions**, click **System Collections** to show system collections.
3. Scroll to the bottom and choose to **Reset System Permissions to:**
   - **App Access Minimum** — Reconfigures permissions on system collections to the bare minimum that are required to
     log in to the app.
   - **Recommended Defaults** — Reconfigures permissions on system collections to the recommended defaults.
4. Click **Reset** to confirm.

::: tip

You may notice that when you toggle on **App Access Minimum** permissions will be hard-coded so they cannot be
restricted. However, you are free to reconfigure the **Recommended Defaults**.

:::
