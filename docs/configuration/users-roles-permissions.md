# Users, Roles & Permissions

> [Users](/getting-started/glossary/#users) are the individual accounts for authenticating into the API and App. Each
> user belongs to a [Role](/getting-started/glossary/#roles) which defines its access
> [Permissions](/getting-started/glossary/#permissions).

[[toc]]

<!--

:::tip Before You Begin


:::
-->

## Overview

While this page focuses on configuration of Roles and Permissions, it is important to remember that Roles and
Permissions are inherently intwined with Users. This is because every User must be assigned a Role to define their
access permissions.

Directus comes with two Roles out of the box, Admin and Public. The Admin role provides full Permissions for all data in
the app, and this cannot be limited. This Admin Role provides full, app-wide control to the Project owners,
administrators, and creators. The Public role comes with all permissions turned off by default and these can be fully
reconfigured as needed. This Public role determines the access permissions given for any unauthenticated request to app
data including un-authenticated users, visitors to your website or any other web request to your Directus Project's API.

In addition, Admins can create as many Roles as they wish and configure permissions granularly.

<!--
Roles with _App Access_ enabled are created with some limited Permissions configured by default, so they can access the app and their own profile information.
Roles that have neither _Admin_ nor _App Access_ enabled (such as the built-in _Public_ Role) are created with Public access permissions.
### Configure Public Permissions

The Public permissions control what project data is accessible without authentication. This is managed via the Public
"role", which is included in the system by default and can not be deleted.

::: warning Private by Default

All of the data within the platform is private by default. Permissions for the public role can be granted on a
case-by-case basis by administrators.

:::

-->

## Create a Role

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Roles & Permissions**
2. Click <span mi btn>add</span> in the header
3. Enter a unique **Role Name**
4. Enabling **App Access** allows logging in to the App
5. Enabling **Admin Access** gives full permission to project data and Settings
6. Click on **Save** to save the role

## Configure a Role

- **Permissions** — Configure [access permissions](#configure-permissions) for the role
- **Role Name** — This is the name of the role
- **Role Icon** — The icon used throughout the App when referencing this role
- **Description** — A helpful note that explains the role's purpose
- **App Access** — Allows logging in to the App
- **Admin Access** — Gives full permission to project data and Settings
- **IP Access** — An allow-list of IP addresses from which the platform can be accessed, empty allows all
- **Require 2FA** — Forces all users within this role to use two-factor authentication
- **Users in Role** — A list of all users within this role

## Delete a Role

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Roles & Permissions
   <span mi icon dark>chevron_right</span> [Role Name]**
2. Click <span mi btn dngr>delete</span> in the header
3. Confirm this decision by clicking **Delete** in the dialog

::: warning Users in a Deleted Role

If you delete a role that still has users in it, those users will be given a `NULL` role, which denies their App access
and limits them to Public permissions. They can then be reassigned to a new role by an admin.

:::

::: warning Last Admin

You must maintain at least one role/user with Admin Access so that you can still properly manage the project.

:::

::: warning Public Role

You can not delete the Public role, as it is part of the core platform. To disable it completely, simply turn off all
Public access permissions.

:::

## Configure Permissions

Directus possesses an extremely granular, yet easy to configure, permissions system. When creating a new role,
permissions are disabled for all project collections by default — allowing you to give explicit access to only what is
required. Individual permissions are applied to the role, and each is scoped to a specific collection and CRUD action
(create, read, update, delete).

::: warning Saves Automatically

Every change made to the permissions of a role is saved automatically and instantly.

:::

::: warning Admin Roles

If a role is set to **Admin Access** then it is granted complete access to the platform, and Permission configuration is
disabled.

:::

1. Navigate to **Settings <span mi icon dark>chevron_right</span> Roles & Permissions
   <span mi icon dark>chevron_right</span> [Role Name]**
2. Scroll to the **Permissions** section
3. **Click the icon** for the collection (row) and action (column) you want to set
4. Choose the desired permission level: <span mi icon>check</span> **All Access**, <span mi icon>block</span> **No
   Access**, or <span mi icon>rule</span> **Use Custom**

If you selected **"<span mi icon>check</span> All Access"** or **"<span mi icon>block</span> No Access"** then setup is
complete. If you chose to customize permissions then continue with the appropriate guide below based on the relevant
_action_.

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

5. **Item Permissions** control which items can be updated, as defined by [Filter Rules](/reference/filter-rules/).
6. **Field Permissions** control which fields can be updated. Fields are individually toggled.
7. **Field Validation** define the rules for field values on update, as defined by
   [Filter Rules](/reference/filter-rules/).
8. **Field Presets** control the field defaults when updating an item

### Delete (Custom Access)

5. **Item Permissions** control which items can be deleted, as defined by the [Filter Rules](/reference/filter-rules/)
   entered.

---

### Configure System Permissions

In addition to permissions for _your_ custom collections, you can also customize the permissions for _system_
collections. To edit system permissions, follow these steps:

1. Go to **Roles and Permissions** and select the desired Role.\
   _You will be taken to the permissions configuration page._
2. Click **System Collections** at the bottom of the page.
3. Find the desired System Collection.
4. Set permissions as desired.

There are two pre-configured options you can use for resetting the role's system permissions and ensure proper App
access. To access these, click "System Collections" to expand, and then click one of the buttons at the bottom of the
listing.

- **App Access Minimum** — The minimum permissions required to properly access the App
- **Recommended Defaults** — More permissive but balanced for a better App user experience

:::tip Remember

When App Access is enabled, Directus will automatically add _(and hardcode)_ permissions for the necessary system
collections for that Role.

:::

## Configure Workflows

Workflows are a way to add structured stages to the flow of content authoring. They are primarily defined through the
permissions for a Collection, but can be further enhanced via email notifications, custom interfaces, and automation.
Directus supports endlessly configurable workflows, so we will only cover one simple example below.

1. To create a structured workflow for **Articles**, the first step is
   [Creating a Field](/configuration/data-model/#creating-a-field) to track the article "status" — we'll call it
   **Status**, but it can be named anything.
2. Next, create different Roles for each stage of the workflow, such as `author` and `manager`.
3. Finally, configure the Role permissions based on the possible values of that Status field, such as `draft`, `review`,
   `approved`, and `published`, so that they are properly restricted to create content and update the status.
   - The Author can create content, but only save a status of `draft` or `review`.
   - The Manager has additional permissions that allow them to save statuses of `approved` or `published`.
