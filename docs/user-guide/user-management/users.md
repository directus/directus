---
description: Users represent the distinct people and entities that interact with your project.
readTime:
---

# Users

> Users represent the distinct people _(and entities)_ that interact with your project. Each user can be assigned a
> role, which defines a user's access permissions.

::: tip Learn More

To configure users programmatically, see our API documentation on [users](/reference/system/users).

:::

Within the Data Studio, the [User Directory](/user-guide/user-management/user-directory) is the primary place to manage
users. However, certain controls are included in **Settings > Roles & Permissions > [Role]** as well, which is what the
following sections will focus on.

## Invite a User

<video title="Invite a User" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/users-20220909/invite-a-user-20220907A.mp4" type="video/mp4" />
</video>

To invite people to become users via email and automatically assign them a role in the process, follow these steps.

1. Navigate to **Settings > Roles & Permissions > [Role]**.
2. Click <span mi btn muted>person_add</span> in the page header.
3. Enter one or more email addresses, separated by a comma and a space.
4. Click **Invite** to confirm.

::: tip

Instead of comma-separated emails, you can also add new emails line-by-line.

:::

## Create a User

<video title="Create a User" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/users-20220909/create-new-user-20220907A.mp4" type="video/mp4" />
</video>

To create a user and assign their role _(and other details)_ follow these steps.

1. Navigate to **Settings > Roles & Permissions > [Role]**.
2. Under the **Users in Role** section, click **Create New** and a drawer will open.
3. Fill in the user's details as desired. The newly created user will now be visible under **Users in Role**.
4. Click <span mi btn>check</span> in the page header to confirm and the drawer will close.

## Assign Role to Existing User

<video title="Add an Existing User" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/users-20220909/assign-to-existing-role-20220909A.mp4" type="video/mp4" />
</video>

To assign a role to an existing user, follow these steps.

1. Navigate to **Settings > Roles & Permissions > [Role]**.
2. Under the **Users in Role** section, click **Add Existing** and a drawer will open.
3. Select users as desired.
4. Click <span mi btn>check</span> to confirm and the drawer will close. The added user(s) will now be visible under
   **Users in Role**.
5. Click <span mi btn>check</span> in the page header to confirm.

## Remove User's Role

<video title="Remove User from Role" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/configuration/users-roles-permissions/users-20220909/remove-user-role-20220908A.mp4" type="video/mp4" />
</video>

To remove a user from a role, follow these steps.

1. Under the **Users in Role** section, click <span mi icon dngr>close</span> and the user will be removed from the
   role.
2. Click <span mi btn>check</span> in the page header to confirm.

The user(s) now have a `NULL` role, public permissions, until [assigned a new role](#assign-role-to-existing-user).
