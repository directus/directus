# Users

> You are prompted to enter the details of your first admin user during the installation process.
> After that, you are free to create as many users as you'd like. There is no limit to the number of
> users in a project.

## Setting up your User Profile

@TODO

## Creating a User

1. Navigate to the **User Library**
2. Click the **Create User** action button in the header
3. Enter an **Email Address**
4. Optional: Complete the **other user form fields**

## Inviting a User

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Users in Role** field
3. Click the **Invite Users** button
4. Enter **one or more email addresses**, separated by commas, in the modal
5. Click **Invite**

At this point the invited user(s) will receive an email with a link to the App where they set a
password and enable their account.

## Configuring a User

1. Navigate to the **User Library**
2. Click on the user you wish to manage
3. Complete any of the [User Fields](/concepts/app-overview.md#user-detail)

<!-- prettier-ignore-start -->
::: User Preferences
This section of the User Detail is only visible/editable by the current user,
and admins.
:::
<!-- prettier-ignore-end -->

### Status

-   **Draft** — An incomplete user; no App/API access
-   **Invited** — Has a pending invite to the project; no App/API access until accepted
-   **Active** — The only status that has proper access to the App and API
-   **Suspended** — A user that has been temporarily disabled; no App/API access
-   **Archived** — A soft-deleted user; no App/API access

<!-- prettier-ignore-start -->
::: warning Admin Only
Only admins can adjust this field's value.
:::
<!-- prettier-ignore-end -->

### Role

Setting the user's role determines their access, permissions, and App presentation. You can adjust a
user's role from the User Detail page, or from the _Users in Role_ field within **Settings > Roles &
Permissions > [Role Name]**.

<!-- prettier-ignore-start -->
::: warning Admin Only
Only admins can adjust this field's value.
:::
<!-- prettier-ignore-end -->

### Token

A user's token is an alternate way to [authenticate into the API](/reference/api/authentication)
using a static string. When NULL, the token is disabled. When enabled, ensure that a secure string
is used.

## Archiving a User

1. Navigate to the **User Library**
2. Click the user you with to archive to go to their User Detail page
3. Click the orange **Archive User** action button in the header
4. Confirm this decision by clicking **Archive** in the dialog

<!-- prettier-ignore-start -->
::: warning Disables Access
Archiving uses _soft-delete_, therefore archived users are unable to
access the App or API.
:::
<!-- prettier-ignore-end -->

## Deleting a User

1. Navigate to the **User Library**
2. Select one or more users you wish to delete
3. Click the red **Delete User** action button in the header
4. Confirm this decision by clicking **Delete** in the dialog

<!-- prettier-ignore-start -->
::: danger Irreversible Change
Unlike the soft-delete of archiving, this process is a hard-delete.
Therefore, this action is permanent and can not be undone. Please proceed with caution.
:::
<!-- prettier-ignore-end -->
