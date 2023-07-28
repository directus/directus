---
description:
  A Project is a complete instance of Directus, including its **Database**, config file, asset storage, and any custom
  extensions.
readTime: 4 min read
---

# Upgrades & Migrations

> A Project is a complete instance of Directus, including its **Database**, config file, asset storage, and any custom
> extensions. [Learn more about Projects](/user-guide/overview/glossary#projects).

## Upgrading / Updating a Project

1. Backup your project
2. Run `npm update`
3. Run `npx directus database migrate:latest` to update the DB

## Backing-up a Project

1. Make a copy of the **files within each storage adapter**, and store them in a safe place.
2. Make a copy of the `/api/.env` file, and store it in a safe place.
3. Create a database dump.

## Migrating a Project

Directus doesn't rely on anything besides the database for it's operation. Therefore, migrating your Directus project
can be done by moving the whole database to a new location using a database dump.

::: tip File Storage

If you have files uploaded, make sure to copy those over as well, or use the same storage location in the new location
of Directus.

:::

## Downgrading a Project

Directus can be reverted to an earlier version by going to your terminal, navigating into your project folder and
running `npm install directus@<version>`.

If you ran any database migrations for a newer version, you can revert those by running
`npx directus database migrate:down`

## Deleting a Project

1. Optional: **Backup any local files** stored within the project's root directory
2. Optional: **Backup any custom code and extensions** within the project's root directory
3. Optional: **Backup your entire database**, only system tables, or only project tables
4. **Delete the project's root directory** from the server
5. **Delete all Directus system tables** (`directus_*`) from the database

::: tip Pure SQL

After completing this process, you will be left with a pure SQL database, with no trace that Directus was ever
installed. Any external services connecting to your database's project tables directly (e.g., SQL queries) should
continue working normally.

:::

## Manual Database Export/Import

#### 1) Setup a Fresh v10 Instance

By installing Directus "fresh", you're ensured your system tables are up-to-date and ready to go.

#### 2) Migrate your Data

Using a tool like [Sequel Pro](http://sequelpro.com) or [TablePlus](https://tableplus.com), export your tables and
import them into your database.

Directus v10 will automatically recognize your tables, and you'll be ready to get started.

**Note:** If you have references to users and files, make sure to update them to the new UUID format.

#### 3) Configure Directus

Once the tables are in, you can start configuring the details of the schema. This includes choosing the correct
interfaces, displays, and their options for your fields.

This would also be a good time to reconfigure your permissions, to ensure they are accurate.
