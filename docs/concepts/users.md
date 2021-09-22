# Users

> Directus Users are the individual accounts that let you authenticate into the API and App. Each user belongs to a Role
> which defines its granular Permissions.

To use the App or API, you'll need a valid Directus User. Each user is assigned to a [Role](/concepts/roles/) that
determines what they have access to see and do. This means that the experience of users may vary significantly depending
on their role's access. For example, while some users may see _all_ platform content, others may only see a smaller
subset of Modules, Collections, or Fields.

#### Relevant Guides

- [Setting up your User Profile](/guides/users/#setting-up-your-user-profile)
- [Creating a User](/guides/users/#creating-a-user)
- [Inviting a User](/guides/users/#inviting-a-user)
- [Configuring a User](/guides/users/#configuring-a-user)
- [Archiving a User](/guides/users/#archiving-a-user)
- [Deleting a User](/guides/users/#deleting-a-user)

## User Fields

Directus ships with a basic set of user fields that are displayed on the User Detail pages. While these system fields
are required/locked, you can extend the Directus Users Collection with any number of custom fields to create a fully
tailored [User Directory](/concepts/application/#user-directory). To add fields within system collections, simply follow
the normal guide for [Creating a Field](/guides/fields/#creating-a-field).

Below are the system User fields included by default.

- **First Name** — The user's given name
- **Last Name** — The user's family name
- **Email** — The user's email address used for login/authenticating and email updates
- **Password** — The private string used for login/authenticating (stored as a secure hash)
- **Avatar** — An image displayed throughout the App that represents the user
- **Location** — Can be used for the user's city, country, office name, etc
- **Title** — The name of the position the user holds at their company or organization
- **Description** — A description or bio of the user
- **Tags** — A set of keywords useful when searching within the User Directory
- **Language** — (User Preference) The language to use for this user's App language
- **Theme** — (User Preference) Light, Dark, or Auto (based on the user's OS preferences)
- **Two-Factor Auth** — (User Preference) Enables authenticating with 2FA
- **Status** — (Admin Only) Determines if the user is active within the App/API
- **Role** — (Admin Only) The user's role determines their permissions and access
- **Token** — (Admin Only) A static string used for authenticating within the API

The sidebar's info component also includes the following readonly details:

- **User Key** — The primary key of the user
- **Last Page** — The last App page accessed by the user
- **Last Access** — The timestamp of the user's last App or API action
