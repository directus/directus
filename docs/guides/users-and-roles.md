# Managing Users, Roles & Permissions

> New Directus projects automatically include an "Admin" role, and a single user configured during installation. You can then extend and customize these as much as is needed.

## Creating a Role

1. Navigate to **Settings > Roles & Permissions**
2. Click the **Create Role** action button in the header
3. Enter a unique **Role Name**
4. Enabling **App Access** allows logging in to the App
5. Enabling **Admin Access** gives full permission to project data and Settings

## Deleting a Role

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Click the red **Delete Role** action button in the header
3. Confirm this decision by clicking **Delete** in the dialog

:::warning Users in a Deleted Role
If you delete a role that still has users in it, those users will be given a `NULL` role, which denies their App access and limits them to the [Public](#) permissions. They can then be reassigned to a new role by an admin.
:::

:::warning Last Admin
You must maintain at least one role/user with Admin Access so that you can still properly manage the project.
:::

### Customizing the Module Navigation

The options in the [Module Bar](#) can be overridden with custom options per role. When this setting is empty, the default modules are used.

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Module Navigation** field
3. Click the **Add a new item** button to add a module
4. Choose an **Icon** to display for the module
5. Choose a **Name** for the module
6. Enter a relative (App) or absolute (external) **link** for the module
7. Use the drag handles to **drag-and-drop** the modules into the desired order

If you are looking to replicate the default modules, paste the following configuration into the Module Navigation field using the [Raw Value](#) field label option.

```json
Collections
box
/collections
User Directory
people_alt
/users
File Library
folder
/files
Documentation
info
/docs
```

:::warning Settings Module
The settings module is not controlled by this configuration. It is always added to the end of the list for any user's with Admin Access.
:::

::: Customizing Existing Modules
You can enter the link to an existing module to customize its name or icon. For example, you can use `/collections` to override the Collections module.
:::

### Customizing the Collection Navigation

The collections in the [Navigation Bar](#) can be overridden with custom options per role. When this setting is empty, all collections that the user has permission to see are shown alphabetically in a single, unlabeled group.

1. Navigate to **Settings > Roles & Permissions > [Role Name]**
2. Scroll to the **Collection Navigation** field
3. Click the **Add New Group** button to add a Grouping
4. Enter a **Group Name**, or leave it empty to simply show a divider
5. Choose if the group's **Accordion** will be...
   * Always Open (Default)
   * Start Open
   * Start Collapsed
6. Click the **Add New Collection** button to add a Collection
7. Choose a **Collection** from the dropdown
8. Use the drag handles to **drag-and-drop** the groups/collections into the desired order

## Configuring Permissions


## Creating a User

* Draft
* Invited
* Active
* Suspended
* Archived
