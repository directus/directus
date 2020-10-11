# Users, Roles & Permissions

> Directus Users are the individual accounts that let you authenticate into the API and App. Each user belongs to a Role which defines its granular Permissions.

## Users

To use the App or API, you'll need a valid Directus User. Each user is assigned to a role that determines what they have access to see and do. For instance, some users have access to the App, while others can only connect to the API. Directus ships with a number of profile fields that help create a full-featured [User Directory](#), and setting fields that allow customizing your experience.

All Directus users are aggregated and shown on the [User Directory](#) page of the App

::: Extending Directus Users
While the included fields within Directus Users are required/locked, you can still _extend_ this collection with additional custom fields as needed. You can do this via the normal [Create a new Field](#) process from within the system collection.
:::

::: System vs Custom Users
If your project requires a users, members, customers, etc., we recommend creating your own collection to manage these instead of trying to repurpose the Directus Users system.
:::

### Relevant Guides

* [Setting up your User Profile](#)
* [Inviting a User](#)
* [Creating a User](#)
* [Archiving a User](#)
* [Deleting a User](#)

## Roles

Each user is assigned to one Role, which determines their permissions within the App and API. There is no limit to the number of roles you can create within Directus, so feel free to organize your users in whatever way feels most appropriate.

### Public Role

Public is not technically a role, and can't be found in the `directus_roles` table. Instead, it represents the _lack_ of a role, providing a place to configure permissions for unauthenticated users. This role can not be deleted, and has no permissions by default.

### Administrators Role

Upon installation, Directus automatically creates this initial role to grant access to the first admin user. It is just a normal role, and like any other it can be updated, renamed or deleted, however your project must maintain at least one role with [Admin Access](#) at all times.

### Relevant Guides

* [Creating a Role](#)
* [Deleting a Role](#)

## Permissions

Directus gives you granular, filter-based permissions for managing access-control.

### Relevant Guides

* [Managing Permissions](#)
