# Permissions

> Permissions are attached directly to a Role, defining what Users can create, read, update, and delete within the
> platform. [Learn more about Permissions](/concepts/permissions/).

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

## Configuring Public Permissions

Public permissions are managed the same as [normal role permissions](#configuring-role-permissions), however they are
done through the Public Role.

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
