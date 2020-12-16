# Projects

> Every installation of Directus creates a single project. If you're unfamiliar with Directus
> Projects, please start by reading our [Platform Overview](/concepts/platform-overview).

## Creating a Project

To install Directus, choose one of the following methods.

-   [Command Line Interface (CLI)](/guides/installation/cli.md)
-   [Docker](/guides/installation/docker.md)
-   [Manually](/guides/installation/manual.md)

## Configuring a Project

All project configuration is handled by the `.env` file within the `/api` directory. This file
accepts a number of environment variables, each is explained in the following reference:

-   [Environment Variables](/reference/environment-variables)

## Upgrading a Project

1. Backup your project
2. Run `npm update`
3. Run `directus database migrate:latest` to update the DB

## Backing-up a Project

1. Make a copy of the **files within each storage adapter**, and store them in a safe place
2. Make a copy of the **Env file** (`/api/.env`), and store it in a safe place
3. Run the **Backup API Endpoint** (`/backup`) to create a SQL dump of your database

## Deleting a Project

1. Optional: **Backup any local files** stored within the project's root directory
2. Optional: **Backup any custom code and extensions** within the project's root directory
3. Optional: **Backup your entire database**, only system tables, or only project tables
4. **Delete the project's root directory** from the server
5. **Delete all Directus system tables** (`directus_*`) from the database

<!-- prettier-ignore-start -->
::: tip Pure SQL
After completing this process, you will be left with a pure SQL database, with no trace
that Directus was ever installed. Any external services connecting to your database's project tables
directly (eg: SQL queries) should continue working normally.
:::
<!-- prettier-ignore-end -->
