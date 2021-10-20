# Users, Roles & Permissions

> [Users](/getting-started/glossary#users) are the individual accounts for authenticating into the API and App. Each
> user belongs to a [Role](/getting-started/glossary#roles) which defines its access
> [Permissions](/getting-started/glossary#permissions).

[[toc]]

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

The User Detail is only editable by the current user and admins, and the following fields are only available to admins:

- **Status** — Determines if an account is able to access the platform or not. Only the `active` state is able to
  authenticate, all others are simply descriptive inactive states.
  - **Draft** — An incomplete user; no App/API access
  - **Invited** — Has a pending invite to the project; no App/API access until accepted
  - **Active** — The only status that has proper access to the App and API
  - **Suspended** — A user that has been temporarily disabled; no App/API access
  - **Archived** — A soft-deleted user; no App/API access
- **Role** — The user's role determines their permissions and access
- **Token** — A user's token is an alternate way to [authenticate into the API](/reference/api/authentication) using a
  static string. When NULL, the token is disabled. When enabled, ensure that a secure string is used.

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

## Creating a Role

1. Navigate to **Settings > Roles & Permissions**
2. Click the **Create Role** action button in the header
3. Enter a unique **Role Name**
4. Enabling **App Access** allows logging in to the App
5. Enabling **Admin Access** gives full permission to project data and Settings

## Configuring a Role

- **Permissions** — Defines the role's access permissions
- **Role Name** — This is the name of the role
- **Role Icon** — The icon used throughout the App when referencing this role
- **Description** — A helpful note that explains the role's purpose
- **App Access** — Allows logging in to the App
- **Admin Access** — Gives full permission to project data and Settings
- **IP Access** — An allow-list of IP addresses from which the platform can be accessed, empty allows all
- **Require 2FA** — Forces all users within this role to use two-factor authentication
- **Users in Role** — A list of all users within this role
- **Module Navigation** — Overrides the visible modules
- **Collection Navigation** — Overrides the collection module's navigation

## Deleting a Role

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Click the red **Delete Role** action button in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: warning Users in a Deleted Role

If you delete a role that still has users in it, those users will be given a `NULL` role, which denies their App access
and limits them to the [Public Role](/concepts/roles/#public-role) permissions. They can then be reassigned to a new
role by an admin.

:::

::: warning Last Admin

You must maintain at least one role/user with Admin Access so that you can still properly manage the project.

:::

::: warning Public Role

You can not delete the Public role, as it is part of the core platform. To disable it completely, simply turn off all
Public access permissions.

:::

## Configuring Permissions

Directus possesses an extremely granular, yet easy to configure, permissions system. When creating a new role,
permissions are disabled for all project collections by default — allowing you to give explicit access to only what is
required. Individual permissions are applied to the role, and each is scoped to a specific collection and CRUD action
(create, read, update, delete).

::: warning Saves Automatically

Every change made to the permissions of a role is saved automatically and instantly.

:::

::: warning Admin Roles

If a role is set to **Admin Access** then it is granted complete access to the platform, and therefore the permission
configuration field is disabled.

:::

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Permissions** section
3. **Click the icon** for the collection (row) and action (column) you want to set
4. Choose the desired permission level: **All Access**, **No Access**, or **Use Custom**

**If you selected "All Access" or "No Access" then setup is complete.** If you chose to customize permissions then
continue with the appropriate guide below based on the relevant _action_.

### Create (Custom Access)

5. **Field Permissions** control which fields accept a value on create. Fields are individually toggled.
6. **Field Validation** define the rules for field values on create
7. **Field Presets** control the field defaults when creating an item

### Read (Custom Access)

5. **Item Permissions** control which items can be read, as defined by the [Filter Rules](/reference/filter-rules)
   entered.
6. **Field Permissions** control which fields can be read. Fields are individually toggled.

::: warning Read Field Permissions

The Directus App always requires read access to the Primary Key field (eg: `id`) so it can uniquely identify items.
Also, if a Collection has "Archive" or "Sort" fields configured, those fields will also need read access to use the
App's soft-delete and manual sorting features.

:::

### Update (Custom Access)

5. **Item Permissions** control which items can be updated, as defined by [Filter Rules](/reference/filter-rules).
6. **Field Permissions** control which fields can be updated. Fields are individually toggled.
7. **Field Validation** define the rules for field values on update, as defined by
   [Filter Rules](/reference/filter-rules).
8. **Field Presets** control the field defaults when updating an item

### Delete (Custom Access)

5. **Item Permissions** control which items can be deleted, as defined by the [Filter Rules](/reference/filter-rules/))
   entered.

---

### Configuring Public Permissions

The Public permissions control what project data is accessible without authentication. This is managed via the Public
"role", which is included in the system by default and can not be deleted.

::: warning Private by Default

All of the data within the platform is private by default. Permissions for the public role can be granted on a
case-by-case basis by administrators.

:::

### Configuring System Permissions

In addition to permissions for _your_ custom collections, you can also customize the permissions for _system_
collections. It is important to note that when [App Access](/guides/roles/#configuring-a-role) is enabled for a role,
Directus will automatically add permission for the necessary system collections. To edit system permissions, simply
click "System Collections" at the bottom of the permissions configuration.

There are two pre-configured options you can use for resetting the role's system permissions and ensure proper App
access. To access these, click "System Collections" to expand, and then click one of the buttons at the bottom of the
listing.

- **App Access Minimum** — The minimum permissions required to properly access the App
- **Recommended Defaults** — More permissive but balanced for a better App user experience

## Configuring Workflows

Workflows are a way to add structured stages to the flow of content authoring. They are primarily defined through the
permissions for a Collection, but can be further enhanced via email notifications, custom interfaces, and automation.
Directus supports endlessly configurable workflows, so we will only cover one simple example below.

1. To create a structured workflow for **Articles**, the first step is [Creating a Field](#) to track the article
   "status" — we'll call it **Status**, but it can be named anything.
2. Next, create different Roles for each stage of the workflow, such as `author` and `manager`.
3. Finally, configure the Role permissions based on the possible values of that Status field, such as `draft`, `review`,
   `approved`, and `published`, so that they are properly restricted to create content and update the status.
   - The Author can create content, but only save a status of `draft` or `review`.
   - The Manager has additional permissions that allow them to save statuses of `approved` or `published`.
