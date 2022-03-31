# User Directory

> The User Directory is the management system for all Users within a Project. [Users](/getting-started/glossary#users)
> are the individual accounts for logging in to the App. Each user belongs to a [Role](/getting-started/glossary#roles)
> which defines its [Permissions](/getting-started/glossary#permissions).

![User Directory Page](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-20220222A.webp)

[[toc]]

## How it Works

This Module is a management system that enables one to view, invite, create, edit, and delete Users. In order to
understand and use this Module effectively, you will need to understand
[Users, Roles, and Permissions](/configuration/users-roles-permissions.md).

## Access Permissions

The permissions configured for your Role will determine what you can see and do inside the User Directory. Roles with
_Admin Access_ enabled are created with full Permissions. Roles with _App Access_ enabled are created with some limited
Permissions configured by default. Roles that have neither _Admin_ nor _App Access_ enabled (such as the built-in
_Public_ Role) are created with no access permissions _(to anything)_ by default. Default permissions can be fully
configured in **Settings > Roles & Permissions**.

## User Directory Page

Lists all Users in a Project, with a navigation that allows quick access to Users by Role. This page has the same
functionality as other [Content Pages](/app/content-collections/).

<video title="User Directory Options" autoplay muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-options-20220222A.mp4" />
	<p>
		Your browser is not displaying the video for some reason. Here's a <a href="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-options-20220222A.mp4">link to the video</a> instead.
	</p>
</video>

- **Select All** – Selects all Users currently in queue.
- **Card Size** – Toggles size of User Displays.
- **Sort Field** – Selects Field used to Users by.
- **Sort Direction** – Toggles ascending & descending sort order.
- **Search** – Enables classic type-based searching.
- **Filter** – Enables advanced query-based search.
- <span mi btn sec>person_add</span> – [Invite people](/configuration/users-roles-permissions/#inviting-a-user) to
  become Users via email.
- <span mi btn>add</span> – [Create User](/configuration/users-roles-permissions/#creating-a-user) manually.

_The following are only visible once Users are selected._

- <span mi btn warn>edit</span> – Opens a User Details page to apply a single edit across multiple Users.
- **<span mi btn dngr>delete</span>** – Deletes one or more Users.

### Layout Options

The **Sidebar > Layout Options** _(denoted by <span mi icon>layers</span> when Sidebar is minimized)_ allows you to
adjust how Users are displayed on the User Directory.

![User Directory Layout Options](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-directory-layout-options-20220222A.webp)

#### Layout

- **Layout** – Toggles User Display from a dropdown menu.
- **Image Source** – Selects the image Field for the User Display.
- **Title** – Sets a title for the User via Display Templates.
- **Subtitle** – Sets a subtitle for the User via Display Templates.

#### Layout Setup

- **Image Fit** – Displays the image as cropped or contained.
- **Fallback Icon** – Sets a default icon for Users that have no image set.

## Viewing a User

<video autoplay muted loop controls>
	<source src="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/viewing-a-user-20220222A.mp4" />
	<p>
		Your browser is not displaying the video for some reason. Here's a <a href="https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/viewing-a-user-20220222A.mp4">link to the video</a> instead.
	</p>
</video>

Users are referenced throughout the app, often for accountability purposes. Hovering over a User in this context will
provide a popover with basic information. Clicking that popover will navigate you to a view of that User's profile page.

## User Profile Page

![The User Page](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-profile-20220222A.webp)

A User's profile page can be accessed from the User Directory or by clicking the User Menu at the bottom of the
[Module Bar](/app/overview/#_1-module-bar). The profile page has the same features and functionality as the
[Item Page](/app/content-items/). Administrators can customize the Fields on this page, but the following are available
by default.

### User Details

![User Details](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-details-20220222A.webp)

- **First Name** – The given name.
- **Last Name** – The family/surname.
- **Email** – A unique email address.
- **Password** – A hashed system password.
- **Avatar** – An image to represent the User.
- **Location** – The city, country, office, or branch name.
- **Title** – The professional staff title.
- **Description** – A freeform text description.
- **Tags** – Keywords for search-ability.

### User Preferences

![User Preferences](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-preferences-20220222A.webp)

- **Language** – The preferred App language/locale.
- **Theme** – Light or Dark mode (or based on system preferences).
- **Multi-Factor Authentication** – Configuration for MFA.
- **Email Notifications** – Receive emails for notifications.

### Admin Options

![Admin Options](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/admin-options-20220222A.webp)

- **Status** – Sets User status as Draft, Invited, Active, Suspended, Archived.
- **Role** – Defines the User's Role.
- **Token** – Accepts any string as User access token. At least 19-20 characters recommended, but we give you the tools
  and flexibility to set this according to you own internal security policies.
- **Provider** – _read-only:_ SSO provider associated with User. See our built-in [SSO options](/configuration/sso).
- **External Identifier** – Displays external identifier generated by SSO provider.

### Read-only Info

![User Profile Sidebar Information](https://cdn.directus.io/docs/v9/app-guide/user-directory/user-directory-20220222A/user-profile-sidebar-information-20220309A.webp)

Information in the Sidebar _(denoted by <span mi icon dark>info</span> when Sidebar is minimized)_ also includes the
following read-only details:

- **User Key** – The Primary Key of the Usser.
- **Last Page** – The last App page accessed by the user.
- **Last Access** – The timestamp of the User's last App or API action.

## More Help

Looking for technical support for your non-enterprise project? Chat with thousands of engineers within our growing
[Community on Discord](https://discord.com/invite/directus)
