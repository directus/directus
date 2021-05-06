# Projects

> A Project is a complete instance of Directus, including its **Database**, config file, asset storage, and any custom
> extensions. [Learn more about Projects](/concepts/projects/).

## Creating a Project

To install Directus, choose one of the following methods.

- [Command Line Interface (CLI)](/guides/installation/cli)
- [Docker](/guides/installation/docker)
- [Manually](/guides/installation/manual)

## Configuring a Project

All project configuration is handled by the `.env` file within the `/api` directory. This file accepts a number of
environment variables, each is explained in the following reference:

- [Environment Variables](/reference/environment-variables)

## Adjusting Project Settings

1. Navigate to **Settings > Project Settings**
2. Configure any of the following **branding fields**

- **Project Name** — The name used at the top of the [Navigation Bar](/concepts/application/#_2-navigation-bar) and on
  the login/public pages
- **Project URL** — The URL when clicking the logo at the top of the [Module Bar](/concepts/application/#_1-module-bar)
- **Project Color** — The color used behind the logo at the top of the
  [Module Bar](/concepts/application/#_1-module-bar), on the login/public pages, and for the browser's FavIcon
- **Project Logo** — A 40x40 pixel logo at the top of the [Module Bar](/concepts/application/#_1-module-bar) and on the
  login/public pages. The image is _inset_ within the 64x64 pixel square filled with the Project Color, so we recommend
  using a SVG or PNG logo with transparency to avoid a "boxy" look.

::: tip Browser FavIcon & Title

The Project Color is also used to set a dynamic favicon, and the Project Name is used in the browser's page title. This
makes it easier to identify different Directus projects in the browser.

:::

### Public Pages

In addition to the above global Project Settings, you can also apply the following styling to tailor your project's
[public pages](/guides/projects/#public-pages).

- **Public Foreground** — An image centered in the public page's right-pane. Limited to a maximum width of 400px.
- **Public Background** — An image displayed behind the above foreground image, shown full-bleed within the public
  page's right-pane. When a Public Background image is not set, the Project Color is used instead.
- **Public Note** — A helpful note displayed at the bottom of the public page's right-pane; supports markdown for
  rich-text formatting

### Security

- **Auth Password Policy** — Allows setting a policy requirement for all user's passwords, with the following options:
  - None — Not recommended
  - Weak — Minimum of 8 characters
  - Strong — Uppercase, lowercase, numbers, and special characters
- **Auth Login Attempts** — Sets the number of failed login attempts allowed before a user's account is locked. Once
  locked, an Admin user is required to unlock the account.

### Files & Thumbnails

See [Creating a Thumbnail Preset](/guides/files/#creating-a-thumbnail-preset)

### App Overrides

See [Styles > Custom CSS](/guides/styles/#custom-css)

## Upgrading a Project

1. Backup your project
2. Run `npm update`
3. Run `npx directus database migrate:latest` to update the DB

## Backing-up a Project

1. Make a copy of the **files within each storage adapter**, and store them in a safe place
2. Make a copy of the **Env file** (`/api/.env`), and store it in a safe place
3. Run the **Backup API Endpoint** (`/backup`) to create a SQL dump of your database

## Migrating a Project

Directus doesn't rely on anything besides the database for it's operation. Therefore, migrating your Directus project
can be done by moving the whole database to a new location using a database dump.

::: tip File Storage

If you have files uploaded, make sure to copy those over as well, or use the same storage location in the new location
of Directus.

:::

## Deleting a Project

1. Optional: **Backup any local files** stored within the project's root directory
2. Optional: **Backup any custom code and extensions** within the project's root directory
3. Optional: **Backup your entire database**, only system tables, or only project tables
4. **Delete the project's root directory** from the server
5. **Delete all Directus system tables** (`directus_*`) from the database

::: tip Pure SQL

After completing this process, you will be left with a pure SQL database, with no trace that Directus was ever
installed. Any external services connecting to your database's project tables directly (eg: SQL queries) should continue
working normally.

:::
