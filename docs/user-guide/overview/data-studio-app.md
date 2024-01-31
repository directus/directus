---
description: An introduction to the Directus studio app and it's components.
readTime: 3 min read
---

# Data Studio App

> The App is a no-code presentation layer for your data, content, and assets. It uses an intuitive left-to-right visual
> hierarchy for general organization and navigation.

The Directus Studio App provides users with a user-friendly and intuitive interface that allows for the seamless
creation and management of collections, definition of relationships, and control over access permissions.

The App also enables users to create flows and dashboards for internal applications.

<img src="https://cdn.directus.io/docs/v9/app-guide/overview/app-overview-20220810A.svg" alt="Directus Application Overview" class="no-shadow" />

## 1. Module Bar

The leftmost section of the App is the module bar, which includes the:

- **Project Logo** — Displays your configured project logo and project color (defaults to the Directus logo and color).
  If configured, clicking this component will navigate to the Project URL. During platform activity, an indeterminate
  progress indicator will also be shown here.
- **Module Navigation** — Allows navigating between the different modules your user has access to. Customizing the
  Module Navigation is done within the [Project Settings > Modules](/user-guide/settings/project-settings#modules), but
  the default module list includes:
  - [Content](/user-guide/content-module/content/collections) — The primary way to view and interact with database
    content
  - [User Directory](/user-guide/user-management/user-directory) — A dedicated section for the platform's system Users
  - [File Library](/user-guide/file-library/files) — An aggregate of all files uploaded and managed within the platform
  - [Insights](/user-guide/insights/dashboards) — Access to infinitely customizable data dashboards
  - [App Guide](/user-guide/overview/data-studio-app) — A tailored, in-app portal for the platform's concepts, guides,
    and reference
  - [Settings](/user-guide/settings/project-settings) — An admin-only section for configuring the project and system
    settings
- **Notifications** - Opens a drawer of notifications, such as from
  [mentions](/user-guide/content-module/content/items#mentions).
- **Current User Menu** — This component displays the authenticated user's name and avatar.
  - Sign Out — Hovering over the User Menu exposes the button to log out of the platform.

## 2. Navigation Bar

The navigation bar is based on the current module, and includes:

- **Project Name** — Shows an icon and tooltip indicating the API's connection strength, and the name of your current
  project, which can be configured under [Project Settings > General](/user-guide/settings/project-settings#general).
- **Navigation** — This is a dynamic navigation based on your current module. Some modules also support
  [Bookmark Presets](/user-guide/overview/glossary#presets), which are a customizable links to specific data-sets.

## 3. Page

This is where the current page's content is shown, including:

- **Header** — A fixed section at the top of each page, the header includes:
  - Page Icon — Clicking this navigates back to the previous page.
  - Module Name — Clicking this navigates to the parent module/section.
  - Page Title — Displays dynamic title of the current page.
  - Action Buttons — Right-aligned contextual buttons for specific page actions.
- **Page Content** — This displays the content of the page you navigated to.

## 4. Sidebar

The sidebar provides additional context and options for the current page, including:

- **Page Components** — Lists any contextual page components available. The "Info" component is available on every page,
  explaining the page's general purpose and relevant details. Clicking any sidebar component will accordion it open. If
  the App window is large enough, the sidebar will automatically open, and can be closed by clicking the "X" in the
  top-right.
- **Notifications Tray** — Fixed to the bottom of the page sidebar, this button opens a tray of recent user
  notifications, and provides a link to your Activity Log page.
