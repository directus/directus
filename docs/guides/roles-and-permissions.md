# Roles & Permissions

> During installation, Directus automatically includes an initial "Admin" role with complete project
> access. After that, you are free to extend and customize these as much as is needed.

## Creating a Role

1. Navigate to **Settings > Roles & Permissions**
2. Click the **Create Role** action button in the header
3. Enter a unique **Role Name**
4. Enabling **App Access** allows logging in to the App
5. Enabling **Admin Access** gives full permission to project data and Settings

## Configuring a Role

-   **Permissions** — Defines the role's access permissions
-   **Role Name** — This is the name of the role
-   **Role Icon** — The icon used throughout the App when referencing this role
-   **Description** — A helpful note that explains the role's purpose
-   **App Access** — Allows logging in to the App
-   **Admin Access** — Gives full permission to project data and Settings
-   **IP Access** — An allow-list of IP addresses from which the platform can be accessed, empty
    allows all
-   **Require 2FA** — Forces all users within this role to use two-factor authentication
-   **Users in Role** — A list of all users within this role
-   **Module Navigation** — Overrides the visible modules
-   **Collection Navigation** — Overrides the collection module's navigation

### Customizing the Module Navigation

The options in the [Module Bar](/concepts/app-overview) can be overridden with custom options per
role. When this setting is empty, the default modules are used.

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Module Navigation** field
3. Click the **Add a new item** button to add a module
4. Choose an **Icon** to display for the module
5. Choose a **Name** for the module
6. Enter a relative (App) or absolute (external) **link** for the module
7. Use the drag handles to **drag-and-drop** the modules into the desired order

If you are looking to replicate the default modules, paste the following configuration into the
Module Navigation field using the Raw Value field label option.

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

<!-- prettier-ignore-start -->
::: warning Settings Module
The settings module is not controlled by this configuration. It is always
added to the end of the list for any user's with Admin Access.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip Customizing Existing Modules
You can enter the link to an existing module to customize its name
or icon. For example, you can use `/collections` to override the Collections module.
:::
<!-- prettier-ignore-end -->

### Customizing the Collection Navigation

The collections in the [Navigation Bar](/concepts/app-overview) can be overridden with custom
options per role. When this setting is empty, all collections that the user has permission to see
are shown alphabetically in a single, unlabeled group.

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

## Configuring Role Permissions

Directus possesses an extremely granular, yet easy to configure, permissions system. When creating a
new role, permissions are disabled for all project collections by default — allowing you to give
explicit access to only what is required. Individual permissions are applied to the role, and each
is scoped to a specific collection and CRUD action (create, read, update, delete).

<!-- prettier-ignore-start -->
::: warning Saves Automatically
Every change made to the permissions of a role is saved automatically
and instantly.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: warning Admin Roles
If a role is set to **Admin Access** then it is granted complete access to
the platform, and therefore the permission configuration field is disabled.
:::
<!-- prettier-ignore-end -->

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Permissions** section
3. **Click the icon** for the collection (row) and action (column) you want to set
4. Choose the desired permission level: **All Access**, **No Access**, or **Use Custom**

If you selected _All Access_ or _No Access_ then setup is complete. If you chose to customize the
permissions, then a modal will open with additional configuration options. Continue with the
appropriate guide below based on the _action_ of the permission.

#### Create (Custom)

5. **Field Permissions** control which fields accept a value on create. Fields are individually
   toggled.
6. **Field Validation** define the rules for field values on create
7. **Field Presets** control the field defaults when creating an item

#### Read (Custom)

5. **Item Permissions** control which items can be read, as defined by the
   [Filter Rules](/reference/filter-rules) entered.
6. **Field Permissions** control which fields can be read. Fields are individually toggled.

#### Update (Custom)

5. **Item Permissions** control which items can be updated, as defined by the
   [Filter Rules](/reference/filter-rules)) entered.
6. **Field Permissions** control which fields can be updated. Fields are individually toggled.
7. **Field Validation** define the rules for field values on update, as defined by the
   [Filter Rules](/reference/filter-rules) entered.
8. **Field Presets** control the field defaults when updating an item

#### Delete (Custom)

5. **Item Permissions** control which items can be deleted, as defined by the
   [Filter Rules](/reference/filter-rules)) entered.

## Configuring System Permissions

In addition to setting permissions for your project's collections, you can also tailor the
permissions for system collections. It is important to note that when
[App Access](/concepts/users-roles-and-permissions) is enabled for a role, Directus will
automatically add permission for the necessary system collections. To edit system permissions,
simply click the "System Collections" toggle, and then edit permissions using the same steps as with
project collections.

<!-- prettier-ignore-start -->
::: tip Resetting System Permissions
To reset the role's system permissions for proper App access,
expand the system collections and then click "Reset System Permissions" at the bottom of the
listing.
:::
<!-- prettier-ignore-end -->

## Deleting a Role

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Click the red **Delete Role** action button in the header
3. Confirm this decision by clicking **Delete** in the dialog

<!-- prettier-ignore-start -->
::: warning Users in a Deleted Role
If you delete a role that still has users in it, those users will
be given a `NULL` role, which denies their App access and limits them to the [Public](/concepts/users-roles-and-permissions)
permissions. They can then be reassigned to a new role by an admin.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: warning Last Admin
You must maintain at least one role/user with Admin Access so that you can
still properly manage the project.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: warning Public Role
You can not delete the Public role, as it is part of the core platform. To
disable it completely, simply turn off all Public access permissions.
:::
<!-- prettier-ignore-end -->
