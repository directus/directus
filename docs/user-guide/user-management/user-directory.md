---
description: The User Directory is the management system for all Users within a Project.
readTime: 7 min read
---

# User Directory

> The User Directory is the management system for all Users within a Project.
> [Users](/user-guide/overview/glossary#users) are the individual accounts for logging in to the App. Each User belongs
> to a [Role](/user-guide/overview/glossary#roles) which defines its
> [Permissions](/user-guide/overview/glossary#permissions).

![User Directory Page](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-20220222A.webp)

<!-- @TODO getting-started > learn-directus

::: tip Before You Begin

To use this Module effectively, you will need to understand
[Users, Roles and Permissions](/user-guide/user-management/users-roles-permissions).

:::
-->

## How it Works

This Module is a management system that enables one to view, invite, create, edit, and delete Users and User
information. Users can be created directly in the app, or invited to join via email.

When a User is created, they must also be assigned a Role. This Role defines the User's data access permissions within
Directus. In other words, it determines what a User can see and do inside the app.

The User Directory is composed of two pages: The User Directory Page and the User Details Page. It has all the same
features and functionality as the [Content Module](/user-guide/content-module/content/collections) such as manual and
automatic sorting, batch edit/delete/archive, import/export from files, etc.

## User Directory Page

<video title="User Directory Options" autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-options-20220222A.mp4" />
	<p>
		Your browser is not displaying the video for some reason. Here's a <a href="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-options-20220222A.mp4">link to the video</a> instead.
	</p>
</video>

The User Directory Page lists all Users in a Project, with a navigation that allows quick access to Users by Role. This
page has the same functionality as the [Collection Page](/user-guide/content-module/content/collections).

- **Select All** — Selects all Users currently in queue.
- **Card Size** — Toggles size of User Displays.
- **Sort Field** — Selects Field used to Users by.
- **Sort Direction** — Toggles ascending & descending sort order.
- **Search** — Enables classic type-based searching.
- **Filter** — Enables advanced query-based search.
- <span mi btn sec>person_add</span> —
  [Invite people](/user-guide/user-management/users-roles-permissions#inviting-a-user) to become Users via email.
- <span mi btn>add</span> — [Create User](/user-guide/user-management/users-roles-permissions#creating-a-user) manually.

_The following are only visible once Users are selected._

- <span mi btn warn>edit</span> — Opens a User Details page to apply a single edit across multiple Users.
- **<span mi btn dngr>delete</span>** — Deletes one or more Users.

### Layout Options

![User Directory Layout Options](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-layout-options-20220222A.webp)

The **Sidebar > Layout Options** _(denoted by <span mi icon>layers</span> when Sidebar is minimized)_ allows you to
adjust how Users are displayed on the User Directory. To learn more, see [Layouts](/user-guide/content-module/layouts).

## User Details Page

![The User Page](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-profile-20220222A.webp)

A User's profile page can be accessed from the User Directory or by clicking the User Menu at the bottom of the
[Module Bar](/user-guide/overview/data-studio-app#_1-module-bar). The profile page has the same features and
functionality as the [Item Page](/user-guide/content-module/content/items). Administrators can add and customize Fields
under [Settings > Data Model > Directus Users](/app/data-model), but the following are available by default.

- **First Name** — The given name.
- **Last Name** — The family/surname.
- **Email** — A unique email address.
- **Password** — A hashed system password.
- **Avatar** — An image to represent the User.
- **Location** — The city, country, office, or branch name.
- **Title** — The professional staff title.
- **Description** — A free-form text description.
- **Tags** — Keywords for search-ability.

### User Preferences

![User Preferences](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-preferences-20220222A.webp)

- **Language** — The preferred App language/locale.
- **Multi-Factor Authentication** — Configuration for MFA.
- **Email Notifications** — Receive emails for notifications.

### Theme

<!-- ![Theme]() -->

- **Appearance** — Light or Dark theme (or based on system preference).
- **Light Theme Customization** — Customization for `light` theme in use.
- **Dark Theme Customization** — Customization for `dark` theme in use.

### Admin Options

![Admin Options](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/admin-options-20220222A.webp)

- **Status** — Sets User status as Draft, Invited, Active, Suspended, Archived.
- **Role** — Defines the User's Role.
- **Token** — Allows generating a static User access token.
- **Provider** — _read-only:_ SSO provider associated with User. See our built-in [SSO options](/self-hosted/sso).
- **External Identifier** — Displays external identifier generated by SSO provider.

### Read-only Info

![User Profile Sidebar Information](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-profile-sidebar-information-20220309A.webp)

Information in the Sidebar _(denoted by <span mi icon dark>info</span> when Sidebar is minimized)_ also includes the
following read-only details:

- **User Key** — The Primary Key of the User.
- **Last Page** — The last App page accessed by the User.
- **Last Access** — The timestamp of the User's last App or API action.

## View a User

<video autoplay playsinline muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/viewing-a-user-20220222A.mp4" />
	<p>
		Your browser is not displaying the video for some reason. Here's a <a href="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/viewing-a-user-20220222A.mp4">link to the video</a> instead.
	</p>
</video>

Users are referenced throughout the app, often for accountability purposes. Hovering over a User in this context will
provide a popover with basic information. Clicking that popover will navigate you to a view of that User's profile page.

## Create a User

To create a User, follow these steps:

1. Navigate to the **User Library**.
2. Click <span mi btn>add</span> in the page header.
3. Enter an **Email Address**.
4. Optional: Fill in the other User details as desired.
5. Click <span mi btn>check</span> to save the User.

## Invite a User

To invite User(s) via email, follow these steps:

1. Navigate to the **User Library**.
2. Click <span mi btn sec>person_add</span> in the page header.
3. Enter one or more email addresses, separated by a comma and a space.\
   _Tip: You can also add emails on a new line._
4. Select the **Role** you want to assign to the User(s).
5. Click **Invite**.

After that, the invited User(s) will receive an email with a link to the App where they set a password and enable their
account.

## Edit User Details

To edit User details, follow these steps:

1. Navigate to the **User Library**.
2. Click on the User you wish to manage and the User Details Page will open.
3. Reset User details as desired.

The User Detail is only editable by the current User and admins, and the following fields are only available to admins:

- **Status** — Determines if an account is able to access the platform or not. Only the `active` state is able to
  authenticate, all others are simply descriptive inactive states.
  - **Draft** — An incomplete User; no App/API access.
  - **Invited** — Has a pending invite to the project; no App/API access until accepted.
  - **Active** — The only status that has proper access to the App and API.
  - **Suspended** — A User that has been temporarily disabled; no App/API access.
  - **Archived** — A soft-deleted User; no App/API access.
- **Role** — The User's role determines their permissions and access.
- **Token** — A User's token is an alternate way to [authenticate into the API](/reference/authentication) using a
  static string. When NULL, the token is disabled.

## Archive a User

To archive a User, follow these steps:

1. Navigate to the **User Library**.
2. Click the User you with to archive to go to their User Detail page.
3. Click on <span mi btn warn>archive</span> in the header.
4. Confirm this decision by clicking **Archive** in the dialog.

::: warning Disables Access

Archiving is equivalent to a _soft-delete_. These Users are unable to access the App or API.

:::

## Delete a User

To delete a User, follow these steps:

1. Navigate to the **User Library**.
2. Select one or more Users you wish to delete.
3. Click on <span mi btn dngr>delete</span> in the header.
4. Confirm this decision by clicking **Delete** in the dialog.

::: danger Irreversible Change

This action is permanent and can not be undone. Please proceed with caution. If you wish to soft-delete Users, see
[Archive a User](#archive-a-user).

:::
