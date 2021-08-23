# Roles

> Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
> platform.

Each User is assigned a single Role which determines their [Permissions](/concepts/permissions/) within the App and API.
Roles also include options for configuring platform access, Two-Factor Auth, Module Navigation, and Collection
Navigation. You can create an unlimited number of roles, so organize your users in whatever way feels most appropriate.

Two default roles, _Public_ and _Administrators_, are available after installing a clean copy of Directus.

#### Relevant Guides

- [Creating a Role](/guides/roles/#creating-a-role)
- [Configuring a Role](/guides/roles/#configuring-a-role)
- [Configuring Role Permissions](/guides/permissions/#configuring-role-permissions)
- [Configuring System Permissions](/guides/permissions/#configuring-system-permissions)
- [Deleting a Role](/guides/roles/#deleting-a-role)

### Public Role

Not technically a role, "Public" can't be found in the `directus_roles` table. Instead, it represents the _lack_ of a
role, providing a place to configure permissions for _unauthenticated_ users. This role can not be deleted.

::: warning Private by Default

All of the data within Directus is private by default. Permissions within the public role can be added by administrators
on a case-by-case basis.

:::

### Administrators Role

During the installation process, Directus automatically creates an "Administrators" Role, which is used to provide the
initial admin user with full platform access. However this is just a _normal_ role, and so it can still be updated,
renamed, or even deleted. Keep in mind that your project must maintain at least one role with Admin Access at all times.
