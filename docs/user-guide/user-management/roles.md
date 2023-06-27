---
description:
  Roles are essentially a bundle of pre-configured access permissions which you can (re)assign to any number of users.
readTime:
---

# Roles

> Roles are essentially a bundle of pre-configured access permissions which you can (re)assign to any number of users.

:::tip Learn More

To configure roles programmatically, see our API documentation on [roles](/reference/system/roles).

:::

## View a Role

<video title="Create a Role" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/roles-20220909/view-a-role-20220908A.mp4" type="video/mp4" />
</video>

To view an existing role, navigate to **Settings > Roles & Permissions > [Role]**. Now you can see the role's
permissions and other details.

## Create a Role

<video title="Create a Role" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/roles-20220909/create-a-role-20220908A.mp4" type="video/mp4" />
</video>

To create a role, follow these steps.

1. Navigate to **Settings > Roles & Permissions**.
2. Click <span mi btn>add</span> in the page header.
3. Enter a unique **Role Name**.
4. Toggle **App Access** and **Admin Access** as desired.\
   To learn more, see [configure role details](#configure-role-details).
5. Click **Save** to confirm.

:::tip

Next, you will likely need to [configure the role's details](#configure-role-details) and
[configure the role's permissions](#configure-role-permissions).

:::

## Configure Role Details

<video title="Configure Role Details" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/roles-20220909/configure-role-details-20220907A.mp4" type="video/mp4" />
</video>

In addition to defining permissions, roles come with a number of other configuration options. To configure a role's
details, follow these steps.

1. Navigate to **Settings > Roles & Permissions > [Role]**.
2. Configure the following options as desired:
   - **Permissions** — Configures [access permissions](#configure-permissions) for the role.
   - **Role Name** — Sets the name of the role.
   - **Role Icon** — Sets icon used when referencing this role.
   - **Description** — Adds a note to help explain the role's purpose.
   - **App Access** — Auto-configures minimum permissions required to log in to the App.
   - **Admin Access** — Auto-configures full permissions to project data and Settings. Must be toggled off to restore
     ability to restrict permissions.
   - **IP Access** — Adds IP addresses to allow list. Type IP in and hit `Enter` (PC) or `return` (Mac) to confirm.
     Leave empty to allow all IP addresses.
   - **Require MFA** — Forces all users within this role to use multi-factor authentication.
   - **Users in Role** — Lists all users within this role.
3. Click <span mi btn>check</span> in the page header to confirm.

:::tip App Access vs Admin Access

Roles with _App Access_ enabled are created with the minimum permissions required to login to the app and access their
own profile information. Roles that have neither _Admin_ nor _App Access_ enabled are created with public permissions.
You can always [reconfigure permissions](/app/users-roles-permissions/permissions#configure-permissions)
later.

:::

## Delete a Role

<video title="Create a Role" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/roles-20220909/delete-a-role-20220907A.mp4" type="video/mp4" />
</video>

To delete a role, follow these steps.

1. Navigate to **Settings > Roles & Permissions > [Role]**.
2. Click <span mi btn dngr>delete</span> in the page header and a popup will appear.
3. Click **Delete** to confirm.

::: warning Users in a Deleted Role

If you delete a role that still has users in it, those users will be given a `NULL` role, which limits them to public
permissions. However, you can always
[assign them a new role](/app/users-roles-permissions/users#assign-role-to-existing-user).

:::

:::tip Built-in Roles

Directus does not allow you to delete the built-in public role or administrator role. To learn more, please see the
introductory section on [Directus Roles](/app/users-roles-permissions#directus-roles).

:::
