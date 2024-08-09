---
description: Users represent the distinct people and entities that interact with your project.
readTime:
---

# Users

> Users represent the distinct people _(and entities)_ that interact with your project. Each user can be assigned a
> role, and any number of policies, which defines a user's access permissions.

::: tip Learn More

To configure users programmatically, see our API documentation on [users](/reference/system/users).

:::

Within the Data Studio, the [User Directory](/user-guide/user-management/user-directory) is the primary place to manage
users. However, certain controls are included in **Settings > Access Control > [Role]** as well, which is what the
following sections will focus on.

## Enable User Registration

![User registration settings showing a user registration checkbox, a verify email checkbox, the selection of a user role, and an email filter.](https://marketing.directus.app/assets/0d221e5b-a5f1-45f9-ba5a-71610b24724d.png)

To allow user registration directly from the login page of the Data Studio as well as via public API endpoints, follow
these steps.

1. Navigate to **Settings > Settings**.
2. Enable User Registration.
3. Select a role for new users who register through this interface. Note: only non-admin roles can be selected.
4. Optionally, enable email verification and create an email address filter.

## Invite a User

![How to invite a User](https://marketing.directus.app/assets/512793d0-be69-4ee6-9bc2-963e34f656a7.gif)

To invite people to become users via email and automatically assign them a role in the process, follow these steps.

1. Navigate to **Settings > Access Control > [Role]**.
2. Click <span mi btn muted>person_add</span> in the page header.
3. Enter one or more email addresses, separated by a comma and a space.
4. Click **Invite** to confirm.

::: tip

Instead of comma-separated emails, you can also add new emails line-by-line.

:::

## Create a User

![How to create a User](https://marketing.directus.app/assets/2e6c2a86-dbc1-46f8-b6bd-b08ac1d7d728.gif)

To create a user and assign their role _(and other details)_ follow these steps.

1. Navigate to **Settings > Access Control > [Role]**.
2. Under the **Users in Role** section, click **Create New** and a drawer will open.
3. Fill in the user's details as desired. The newly created user will now be visible under **Users in Role**.
4. Click <span mi btn>check</span> in the page header to confirm and the drawer will close.

## Assign Role to Existing User

![How to assign role to an existing user](https://marketing.directus.app/assets/2e6c2a86-dbc1-46f8-b6bd-b08ac1d7d728.gif)

To assign a role to an existing user, follow these steps.

1. Navigate to **Settings > Access Control > [Role]**.
2. Under the **Users in Role** section, click **Add Existing** and a drawer will open.
3. Select users as desired.
4. Click <span mi btn>check</span> to confirm and the drawer will close. The added user(s) will now be visible under
   **Users in Role**.
5. Click <span mi btn>check</span> in the page header to confirm.

## Remove User's Role

![How to remove a user from a role](https://marketing.directus.app/assets/11408529-78a6-4037-a3b8-c1cf08603d50.gif)

To remove a user from a role, follow these steps.

1. Under the **Users in Role** section, click <span mi icon dngr>close</span> and the user will be removed from the
   role.
2. Click <span mi btn>check</span> in the page header to confirm.

The user(s) now have a `NULL` role, public permissions, until [assigned a new role](#assign-role-to-existing-user).
