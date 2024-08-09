---
description:
  Roles are essentially a bundle of pre-configured access permissions which you can (re)assign to any number of users.
readTime:
---

# Roles

> Roles are a bundle of pre-configured policies which you can (re)assign to any number of users. Roles can also contain
> other roles.

::: tip Learn More

To configure roles programmatically, see our API documentation on [roles](/reference/system/roles).

:::

## View a Role

To view an existing role, navigate to **Settings > User Roles > [Role]**. Now you can see the role's policies and other
details.

## Create a Role

To create a role, follow these steps.

1. Navigate to **Settings > User Roles**.
2. Click <span mi btn>add</span> in the page header.
3. Enter a unique **Role Name**.
4. Click **Save** to confirm.

::: tip

Next, you will likely need to [configure the role's details](#configure-role-details) and
[configure the role's policies](#configure-role-policies).

:::

## Configure Role Details

In addition to defining permissions, roles come with a number of other configuration options. To configure a role's
details, follow these steps.

1.  Navigate to **Settings > Access Control > [Role]**.
2.  Configure the following options as desired:

    - **Permissions** — Configures [access permissions](#configure-permissions) for the role.
    - **Role Name** — Sets the name of the role.
    - **Role Icon** — Sets icon used when referencing this role.
    - **Description** — Adds a note to help explain the role's purpose.
    - **App Access** — Auto-configures minimum permissions required to log in to the App.
    - **Admin Access** — Auto-configures full permissions to project data and Settings. Must be toggled off to restore
      ability to restrict permissions.
    - **IP Access** — Allow list of IP addresses, IP ranges and CIDR blocks for this role. To add an entry, type it in
      and hit `Enter` / `Return` to confirm. Leave empty to allow all IP addresses.

      | Type       | Example Value   |
      | ---------- | --------------- |
      | IP Address | 1.2.3.4         |
      | IP Range   | 1.1.1.1-2.2.2.2 |
      | CIDR Block | 1.2.3.0/24      |

    - **Require MFA** — Forces all users within this role to use multi-factor authentication.
    - **Users in Role** — Lists all users within this role.

3.  Click <span mi btn>check</span> in the page header to confirm.

::: tip App Access vs Admin Access

Roles with _App Access_ enabled are created with the minimum permissions required to login to the app and access their
own profile information. Roles that have neither _Admin_ nor _App Access_ enabled are created with public permissions.
You can always reconfigure permissions later.

:::

## Delete a Role

To delete a role, follow these steps.

1. Navigate to **Settings > Access Control > [Role]**.
2. Click <span mi btn dngr>delete</span> in the page header and a popup will appear.
3. Click **Delete** to confirm.

::: warning Users in a Deleted Role

If you delete a role that still has users in it, those users will be given a `NULL` role, which limits them to public
permissions. However, you can always assign them a new role.

:::

::: tip Built-in Roles

Directus does not allow you to delete the built-in public role or administrator role. To learn more, please see the
introductory section on [Directus Roles](/user-guide/user-management/users-roles-permissions#directus-roles).

:::
