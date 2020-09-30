# App Overview

> The Directus App is the presentation layer for your data, content, and assets. It uses a left-to-right visual hierarchy for organization and navigation. Below we cover the App's global elements and individual pages.

## Global Elements

<img class="full shadow" src="https://svgshare.com/i/Q8H.svg" />
<img class="full no-margin" src="https://svgshare.com/i/Q8J.svg" />

### 1. Module Bar

* **Project Logo** — Displays your configured project logo and project color (defaults to the Directus logo and color). If configured, clicking this component will navigate to the Project URL. During platform activity, an indeterminate progress indicator will also be shown here.
* **Modules** — Any available [modules](#) are listed below the project logo. These may be turned off or reordered based on your [role's configuration](#), but by default this includes:
    * [Collections](#)
    * [User Directory](#)
    * [File Library](#)
    * [Documentation](#)
    * [Settings](#) — Admin only
    * [Custom Modules](#) — If configured
* **Current User Menu** — This component displays the authenticated user's name and avatar. Hovering over this menu exposes the Log Out button.

### 2. Navigation Bar

* **Project Name** — Shows the name of your current project (see [Project Settings](#)), as well as the quality of your project's API connection.
* **Navigation** — This is a dynamic navigation based on your current module. Some modules also support [Presets and/or Bookmarks](#), which are ways to link to more specific data-sets.

### 3. Page

* **Header** — A fixed section at the top of each page, the header includes:
    * Page Icon — Clicking this navigates back to the previous page
    * Module Title — Clicking this navigates to the parent module/section
    * Page Title — Displays the current page's title
    * Action Buttons — On the right-side of the header are contextual buttons for specific page actions. Please note that some primary action buttons have a "..." icon beside them that provides additional options when clicked.
* **Page Content** — This displays the content of the page you navigated to.

### 4. Page Sidebar

* **Page Components** — Lists any contextual page components available. The "Info" component is available on every page, explaining the page's general purpose and relevant details. Clicking any sidebar component will accordion it open. If the App window is large enough, the sidebar will automatically open, and can be closed by clicking the "X" in the top-right.
* **Notifications Tray** — Fixed to the bottom of the page sidebar, this button opens a tray of recent user notifications, and provides a link to the [Activity History](#) page.

## Collections

This module is the primary way for interacting with your database content. Here you can access your collections, browse their items, and navigate to individual item forms.

### Collection Browse

A page that lists the collections available to the current user. This is the landing page of the module, and effectively the same as its navigation listing.

### Item Browse

Provides a configurable layout to browse or visualize items within a given collection. Like other browse pages, there are many available features, including:

* [Creating Items](#)
* [Browsing Items](#)
	* [Searching](#)
	* [Layouts](#)
	* [Advanced Filter](#)
	* [Bookmarking](#)
* [Updating Items](#)
    * Batch
* [Deleting Items](#)
	* Batch
* [Export Data](#)

### Item Detail

Most layouts on the browse page support navigating to individual item detail pages, where you a presented with a [customizable form](#) for viewing/editing the item's content. Like other detail pages, there are many available features, including:

* [Updating an Item](#)
* [Reverting an Item](#)
* [Revisions](#)
* [Comments](#)

## User Directory

A module includes a comprehensive listing of all system users within your project. This page has the same features and configuration as [Item Browse](#).

### User Detail

Similar to other [Item Detail](#) pages, this page provides a custom form for viewing system users. This is also used for editing the "Profile Page" of the current user, which is accessible from the [User Menu](#).

Directus ships with a full-featured user system, with the following fields:

* First Name
* Last Name
* Email
* Password
* Avatar
* Location
* Title
* Description
* Tags
* Timezone (User Preference)
* Language (User Preference)
* Theme (User Preference)
* Two-Factor Auth (User Preference)
* Status (Admin Only)
* Role (Admin Only)
* Token (Admin Only)

The sidebar's info component also includes the following readonly details:

* User Key
* Last Access
* Last Page

::: Extending Users
While the fields included out-of-the-box are locked from schema changes, you can extend Directus Users to include additional proprietary fields within [Settings > Data Model](#).
:::

## File Library

This module aggregates all files within the project into one consolidated library. This page has the same features and configuration as [Item Browse](#).

### File Detail

Similar to other [Item Detail](#) pages, this page provides a custom form for viewing assets and embeds.

Directus ships with a full-featured system for digital asset management, with the following fields:

* Title
* Description
* Tags
* Location
* Storage
* Filename Disk
* Filename Download

The sidebar's info component also includes the following readonly details:

* Type
* Dimensions
* Size
* Created
* Owner
* Folder
* [Metadata](#)

::: Extending Files
While the fields included out-of-the-box are locked from schema changes, you can extend Directus Files to include additional proprietary fields within [Settings > Data Model](#).
:::

## Actvity History

### Activity Detail

# Settings

@TODO ToC style to Configuration Guides...
