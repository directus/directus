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
  authenticate, all others are simply descriptive inactive states. - **Draft** — An incomplete user; no App/API access -
  **Invited** — Has a pending invite to the project; no App/API access until accepted - **Active** — The only status
  that has proper access to the App and API - **Suspended** — A user that has been temporarily disabled; no App/API
  access - **Archived** — A soft-deleted user; no App/API access
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

---

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

### Customizing the Module Navigation

The options in the [Module Bar](/concepts/application/#_1-module-bar) can be overridden with custom options per role.
When this setting is empty, the default modules are used.

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Module Navigation** field
3. Click the **Add a new item** button to add a module
4. Choose an **Icon** to display for the module
5. Choose a **Name** for the module
6. Enter a relative (App) or absolute (external) **link** for the module
7. Use the drag handles to **drag-and-drop** the modules into the desired order

If you are looking to replicate the default modules, paste the following configuration into the Module Navigation field
using the Raw Value field label option.

```json
[
	{
		"icon": "box",
		"name": "Collections",
		"link": "/collections"
	},
	{
		"icon": "people_alt",
		"name": "User Directory",
		"link": "/users"
	},
	{
		"icon": "folder",
		"name": "File Library",
		"link": "/files"
	},
	{
		"icon": "info",
		"name": "Documentation",
		"link": "/docs"
	}
]
```

::: warning Settings Module

The settings module is not controlled by this configuration. It is always added to the end of the list for any user's
with Admin Access.

:::

::: tip Customizing Existing Modules

You can enter the link to an existing module to customize its name or icon. For example, you can use `/collections` to
override the Collections module.

:::

### Customizing the Collection Navigation

The collections in the [Navigation Bar](/concepts/application/#_2-navigation-bar) can be overridden with custom options
per role. When this setting is empty, all collections that the user has permission to see are shown alphabetically in a
single, unlabeled group.

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Collection Navigation** field
3. Click the **Add New Group** button to add a Grouping
4. Enter a **Group Name**, or leave it empty to simply show a divider
5. Choose if the group's **Accordion** will be...
   - Always Open (Default)
   - Start Open
   - Start Collapsed
6. Click the **Add New Collection** button to add a Collection
7. Choose a **Collection** from the dropdown
8. Use the drag handles to **drag-and-drop** the groups/collections into the desired order

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

---

## Configuring Public Permissions

Public permissions are managed the same as [normal role permissions](#configuring-role-permissions), however they are
done through the Public Role.

## Configuring Role Permissions

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

5. **Item Permissions** control which items can be updated, as defined by the [Filter Rules](/reference/filter-rules))
   entered.
6. **Field Permissions** control which fields can be updated. Fields are individually toggled.
7. **Field Validation** define the rules for field values on update, as defined by the
   [Filter Rules](/reference/filter-rules) entered.
8. **Field Presets** control the field defaults when updating an item

### Delete (Custom Access)

5. **Item Permissions** control which items can be deleted, as defined by the [Filter Rules](/reference/filter-rules/))
   entered.

## Configuring System Permissions

In addition to setting permissions for your project's collections, you can also tailor the permissions for system
collections. It is important to note that when [App Access](/guides/roles/#configuring-a-role) is enabled for a role,
Directus will automatically add permission for the necessary system collections. To edit system permissions, simply
click the "System Collections" toggle, and then edit permissions using the same steps as with project collections.

::: tip Resetting System Permissions

To reset the role's system permissions for proper App access, expand the system collections and then click "Reset System
Permissions" at the bottom of the listing.

:::

## Configuring Workflows

Workflows are a way to add structured stages to the flow of content authoring. They are primarily defined through the
permissions for a Collection, but can be further enhanced via email notifications, custom interfaces, and automation.
Directus supports endlessly configurable workflows, so we will only cover one example below.

Let's assume you would like to create a structured workflow for an **Articles** collection. The first step is to
[Create a Field](/guides/fields/#creating-a-field) that can track the article "status" — we'll call it **Status**, but
it can be named anything.

Now you can configure your permissions based on the possible values of that Status field. In this case, those values
will be various content stages, such as `draft`, `review`, `approved`, and `published`.

Next, you will want to create different Roles to scope each stage of the workflow. Let's keep this simple and assume
there are only two roles called `author` and `manager`.

Finally, we would configure the permissions for these roles such that they are properly restricted to create content and
update the status.
