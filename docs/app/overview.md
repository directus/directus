# The Application

> The App is a no-code presentation layer for your data, content, and assets. It uses an intuitive left-to-right visual
> hierarchy for general organization and navigation.

<img src="../assets/app-overview.svg" alt="Directus Application Overview" class="no-shadow" />

## 1. Module Bar

The leftmost section of the App is the module bar, which includes the:

- **Project Logo** — Displays your configured project logo and project color (defaults to the Directus logo and color).
  If configured, clicking this component will navigate to the Project URL. During platform activity, an indeterminate
  progress indicator will also be shown here.
- **Module Navigation** — Allows navigating between the different modules your user has access to. Customizing the
  Module Navigation is done within the [Project Settings](/app/settings), but the default module list includes:
  - [Content](/app/content-collections/) — The primary way to view and interact with database content
  - [User Directory](/app/user-directory) — A dedicated section for the platform's system Users
  - [File Library](/app/file-library) — An aggregate of all files uploaded and managed within the platform
  - [Insights](/app/insights) — Access to infinitely customizable data dashboards
  - [App Guide](/app/overview/) — A tailored, in-app portal for the platform's concepts, guides, and reference
  - [Settings](/app/settings) — An admin-only section for configuring the project and system settings
- **Notifications** - Opens a drawer of notifications, such as from [mentions](/app/content-items/#mentions).
- **Current User Menu** — This component displays the authenticated user's name and avatar.
  - Sign Out — Hovering over the User Menu exposes the button to log out of the platform.

## 2. Navigation Bar

The navigation bar is based on the current module, and includes:

- **Project Name** — Shows an icon and tooltip indicating the API's connection strength, and the name of your current
  project, which can be configured under [Project Settings](/app/settings).
- **Navigation** — This is a dynamic navigation based on your current module. Some modules also support
  [Bookmark Presets](/getting-started/glossary/#presets), which are a customizable links to specific data-sets.

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
