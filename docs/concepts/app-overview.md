# App Overview

> The Directus App is the presentation layer for your data, content, and assets. It uses a left-to-right visual
> hierarchy for organization and navigation. Below we cover the App's global elements and individual pages.

## Global Elements

<img class="full shadow" src="../assets/app-overview.svg" />

### 1. Module Bar

- **Project Logo** — Displays your configured project logo and project color (defaults to the Directus logo and color).
  If configured, clicking this component will navigate to the Project URL. During platform activity, an indeterminate
  progress indicator will also be shown here.
- **Module Navigation** — Allows navigating between the different modules your user has access to. [Customizing the Module Navigation](/guides/roles-and-permissions/#customizing-the-module-navigation) is done within the Role's configuration, but the default module list includes:
  - [Collections](/concepts/app-overview/#collections-module)
  - [User Directory](/concepts/app-overview/#user-directory)
  - [File Library](/concepts/app-overview/#file-library)
  - [Documentation](/concepts/app-overview/#documentation)
  - [Settings](/concepts/app-overview/#settings) — Admin Roles Only
  - [Any Custom Modules](/concepts/app-extensions/#modules) — Only if Configured
- **Current User Menu** — This component displays the authenticated user's name and avatar.
    - [Sign Out](#) — Hovering over the User Menu exposes the button to log out of the platform.

### 2. Navigation Bar

- **Project Name** — Shows an icon and tooltip indicating the API's connection strength, and the name of your current project, which can be configured under [Project Settings](/guides/white-labeling/#project-settings).
- **Navigation** — This is a dynamic navigation based on your current module. Some modules also support [Presets and Bookmarks](/concepts/platform-overview/#presets-bookmarks), which are a customizable links to specific data-sets.

### 3. Page

- **Header** — A fixed section at the top of each page, the header includes:
  - Page Icon — Clicking this navigates back to the previous page.
  - Module Name — Clicking this navigates to the parent module/section.
  - Page Title — Displays dynamic title of the current page.
  - Action Buttons — Right-aligned contextual buttons for specific page actions.
- **Page Content** — This displays the content of the page you navigated to.

### 4. Page Sidebar

- **Page Components** — Lists any contextual page components available. The "Info" component is available on every page,
  explaining the page's general purpose and relevant details. Clicking any sidebar component will accordion it open. If
  the App window is large enough, the sidebar will automatically open, and can be closed by clicking the "X" in the
  top-right.
- **Notifications Tray** — Fixed to the bottom of the page sidebar, this button opens a tray of recent user
  notifications, and provides a link to the [Activity History](/concepts/app-overview/#activity-history) page.

## Collections Module

This module is the primary way for interacting with your database content. Here you can access your collections, browse
their items, and navigate to individual item forms.

### Collection Listing

A page that lists the collections available to the current user. This is the landing page of the module, and effectively
the same as its navigation listing.

### Collection Detail

This is the main gateway to your content items, providing a highly configurable Layout for browsing and visualizing the items within a collection. The header of this page includes key action buttons for creating, deleting, and batch editing items.

- [Adjusting a Collection Layout](/guides/collections/#adjusting-a-collection-layout)
- [Creating an Item](/guides/items/#creating-an-item)
- [Updating an Item](/guides/items/#updating-an-item)
- [Deleting an Item](/guides/items/#deleting-an-item)
- [Archiving an Item](/guides/items/#archiving-an-item)
- [Reordering Items](/guides/items/#reordering-items)
- [Exporting Items](/guides/items/#exporting-items)
- [Browsing Items](/guides/items/#browsing-items)
  - [Searching](/guides/items/#searching-items)
  - [Filtering](/guides/items/#filtering-items)
  - [Bookmarking](/guides/items/#bookmarking-item-presets)

### Item Detail

Most Collection Detail Layouts support navigating to individual item detail pages where you a presented with a
[customizable form](/guides/fields#adjusting-fields-layout) for viewing/editing the item's content. Like other detail
pages, there are many available features, including:

- [Adjusting Field Arrangement](/guides/fields/#adjusting-field-arrangement)
- [Updating an Item](/guides/items/#updating-an-item)
- [Archiving an Item](/guides/items/#archiving-an-item)
- [Reverting an Item](/guides/items/#reverting-an-item)
- [Deleting an Item](/guides/items/#deleting-an-item)
- [Commenting on an Item](/guides/items/#commenting-on-an-item)

## User Directory

This module includes a comprehensive listing of all system users within your project. This page has the same features and
configuration as [Collection Detail](/concepts/app-overview).

### User Detail

Similar to other [Item Detail](/concepts/app-overview/#item-detail) pages, this page provides a custom form for viewing system users.
This is also used for editing the "Profile Page" of the current user, which is accessible from the
[User Menu](/concepts/app-overview/#_1-module-bar). Directus ships with a full-featured user system, with the following fields:

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

::: tip Extending Users

While the fields included out-of-the-box are locked from schema changes, you can extend Directus Users to include
additional proprietary fields by following the normal [Creating a Field](/guides/fields/#creating-a-field) guide.

:::

## File Library

This module aggregates all files within the project into one consolidated library. This page has the same features and
configuration as [Collection Detail](/concepts/app-overview).

### File Detail

Similar to other [Item Detail](/concepts/app-overview) pages, this page provides a custom form for viewing assets and
embeds. Directus ships with a full-featured system for digital asset management, with the following fields:

- **Title** — Pulled from the file metadata if available, falls back to a formatted version of the filename
- **Description** — Pulled from the file metadata if available
- **Tags** — Pulled from the file metadata if available
- **Location** — Pulled from the file metadata if available
- **Storage** — The storage adapter where the asset is saved (readonly)
- **Filename Disk** — The actual name of the file within the storage adapter
- **Filename Download** — The name used when downloading the file via _Content-Disposition_

The sidebar's info component also includes the following readonly details:

- **Type** — The MIME type of the file, displayed in the App as a formatted media type
- **Dimensions** — (Images Only) The width and height of the image in pixels
- **Size** — The file-size the asset takes up within the storage adapter
- **Created** — The timestamp of when the file was uploaded to the project
- **Owner** — The Directus user that uploaded the file to the project
- **Folder** — The current parent folder that contains the file
- **Metadata** — Metadata JSON dump of the file's EXIF, IPTC, and ICC information

::: tip Extending Files

While the fields included out-of-the-box are locked from schema changes, you can extend Directus Files to include
additional proprietary fields within [Settings > Data Model](/concepts/data-model).

:::

## Documentation

This module is an internal set of guides, concepts, and reference docs for your project's specific version of Directus.
It also includes a dynamic [API Reference](/reference/api/introduction) that is dynamically tailored to your custom
schema. The docs are organized into these distinct sections:

- [Getting Started](/getting-started/introduction/) — Novice oriented, for a platform intro and installation.
- [Concepts](/concepts/platform-overview/) — Learning oriented, for understanding the platform.
- [Guides](/guides/projects/) — Problem oriented, follow along with steps while working.
- [Reference](/reference/command-line-interface/) — Information oriented, look up info and specs while working.
- [API Reference](/reference/api/introduction/) — Information oriented, look up API resources while working.
- [Extensions](/extensions/displays/) — Problem oriented — follow along with steps while working.
- [Contributing](/contributing/introduction/) — Contributor oriented — resources for working on Open-Source Core.

::: tip Updating the Docs

Our docs are written in markdown (with some additional VuePress styling like this hint box), and available for
editing/fixing via [GitHub](https://github.com/directus/directus).

:::

::: tip Public Docs

The latest version of the Directus Docs are also available publicly. This online version includes additional sections, such as how to install the platform. [https://docs.directus.io](https://docs.directus.io)

:::

## Activity History

This module provides a collective timeline of all actions taken within the project. This is a great way to audit user
activity or enforce accountability. This is the only system module that is not in the module bar by default — instead
being located within the notifications tray of the page sidebar. This page has the same features and configuration as
[Collection Detail](/concepts/app-overview/#collection-detail).

### Activity Detail

Unlike other item detail pages, activity items are **readonly** (for proper accountability) and open in a side drawer with the following fields:

- **User** — The Directus user that performed the action
- **Action** — The specific action taken, eg: Create, Update, Delete, Authenticate, etc
- **Date** — The timestamp of when the action was performed
- **IP Address** — The IP address of the device from which the action was performed
- **User Agent** — The description of the browser that was used to perform the action
- **Collection** — The collection affected by the action
- **Item** — The item (within the above Collection) affected by the action

## Settings

This module is only available to users within [Admin roles](/concepts/users-roles-and-permissions/#administrators-role).
This is where your project is configured, and the first place to go after installation. It includes the following
sections:

- [Project Settings](/guides/projects/#adjusting-project-settings)
- [Data Model](/concepts/data-model)
- [Roles & Permissions](/concepts/users-roles-and-permissions)
- [Presets & Bookmarks](/concepts/presets-and-bookmarks)
- [Webhooks](/guides/webhooks)
