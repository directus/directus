# Users

> Users are the individual accounts for authenticating into the API and App. Each user belongs to a Role which defines
> its Permissions. [Learn more about Users](/concepts/users/).

## Creating a User

1. Navigate to the **User Library**
2. Click the **Create User** action button in the header
3. Enter an **Email Address**
4. Optional: Complete the **other user form fields**

## Inviting a User

1. Navigate to the **User Library**
2. Click the **Invite Users** button in the header
3. Enter **one or more email addresses**, separated by new lines, in the modal
4. Click **Invite**

At this point the invited user(s) will receive an email with a link to the App where they set a password and enable
their account.

## Configuring a User

1. Navigate to the **User Library**
2. **Click on the user** you wish to manage
3. **Complete the form** of [User Fields](/concepts/application/#user-detail)

::: warning User Preferences

This section of the User Detail is only visible/editable by the current user, and admins.

:::

#### Status

The User's Status determines if an account is able to access the platform or not. Only the `active` state is able to
authenticate, all others are simply descriptive inactive states.

- **Draft** — An incomplete user; no App/API access
- **Invited** — Has a pending invite to the project; no App/API access until accepted
- **Active** — The only status that has proper access to the App and API
- **Suspended** — A user that has been temporarily disabled; no App/API access
- **Archived** — A soft-deleted user; no App/API access

::: warning Admin Only

Only admins can adjust this field's value.

:::

#### Role

Setting the user's role determines their access, permissions, and App presentation. You can adjust a user's role from
the User Detail page, or from the _Users in Role_ field within **Settings > Roles & Permissions > [Role Name]**.

::: warning Admin Only

Only admins can adjust this field's value.

:::

#### Token

A user's token is an alternate way to [authenticate into the API](/reference/api/authentication) using a static string.
When NULL, the token is disabled. When enabled, ensure that a secure string is used.

## Archiving a User

1. Navigate to the **User Library**
2. Click the user you with to archive to go to their User Detail page
3. Click the orange **Archive User** action button in the header
4. Confirm this decision by clicking **Archive** in the dialog

::: warning Disables Access

Archiving uses _soft-delete_, therefore archived users are unable to access the App or API.

:::

## Deleting a User

1. Navigate to the **User Library**
2. Select one or more users you wish to delete
3. Click the red **Delete User** action button in the header
4. Confirm this decision by clicking **Delete** in the dialog

::: danger Irreversible Change

Unlike the soft-delete of archiving, this process is a hard-delete. Therefore, this action is permanent and can not be
undone. Please proceed with caution.

:::
