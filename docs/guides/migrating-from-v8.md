# Migrating from v8

There are two ways to migrate from an existing Directus 8.X instance:

- [Automated Script](#automated-script) (recommended)
- [Manual Database Export/Import](#manual-database-export-import)

## Automated Script

We created a (community maintained) script, that will automatically copy over the schema, content, files, users, and
roles from an existing v8 instance to a new v9 instance. This is the most hands-off approach to moving from a v8 to a v9
instance, and is the recommended way of migrating your v8 instance.

::: tip

The script, and instructions on how to run it, can be found on the\
[`directus-community/migration-tool`](https://github.com/directus-community/migration-tool) repo.

:::

This tool will copy over:

- Schema (collections / fields)
- Files (including file contents)
- User data (eg all items in all collections)
- Roles
- Users

Due to significant differences in data structure between versions, this tool will **NOT** copy over:

- Interface/display configurations
- Permissions
- Activity / revisions

## Manual Database Export/Import

::: warning Automated

We highly recommend using the automated migration tool mentioned above. If that's not possible, you can perform the
following steps to migrate your v8 instance.

:::

Directus v9 is a breaking change coming from v8 (hence the major version bump), so you won't be able to just use your
existing v8 database and run v9 on top of it. However, due to the database-mirroring approach of Directus, it's fairly
straightforward to migrate your content from v8 to v9.

#### 1) Setup a Fresh v9 Instance

By installing Directus "fresh", you're ensured your system tables are up-to-date and ready to go.

#### 2) Migrate your Data

Using a tool like [Sequel Pro](http://sequelpro.com) or [TablePlus](https://tableplus.com), export your v8 user-tables
and import them into your v9 database.

Directus v9 will automatically recognize your tables, and you'll be ready to get started in v9.

**Note:** If you have references to users and files, make sure to update them to the new UUID format.

#### 3) Configure Directus

Once the tables are in, you can start configuring the details of the schema. This includes choosing the correct
interfaces, displays, and their options for your fields.

This would also be a good time to reconfigure your permissions, to ensure they are accurate.
