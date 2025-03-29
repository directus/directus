---
description:
  Directus has two command line interfaces (CLI) that you can use for various actions, one for server-side actions and
  another to interact with a Directus instance as you would with an SDK
readTime: 7 min read
---

# Command Line Interface

> Directus has two command line interfaces (CLI) that you can use for various actions. One is used for server-side
> actions that relate to your on-prem instance, like migrating the database or resetting a user, while the other allows
> you to interact with a Directus instance as you would with an SDK.

## Requirements

- Node.js [v22](https://github.com/nodejs/release#release-schedule)

## Server

For server-side CLI, all functionality can be accessed by running `npx directus <command>` in your project folder.

### Initialize a New Project

```bash
npm init directus-project <project-folder>
```

Will setup a new Directus project based on the provided configuration values. The script installs the required database
driver, creates a `.env` file and installs the required dependencies.

### Bootstrap a Project

```bash
npx directus bootstrap
```

Will use an existing `.env` file (or existing environment variables) to either install the database (if it's empty) or
migrate it to the latest version (if it already exists and has missing migrations).

This is very useful to use in environments where you're doing standalone automatic deployments, like a multi-container
Kubernetes configuration.

::: tip First User

You can use the `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_TOKEN` environment variables to automatically provision the
first user on first creation using the `bootstrap` command. See
[Environment Variables](/self-hosted/config-options#general) for more information.

:::

::: tip Skip Admin User/Role

You can pass the `--skipAdminInit` option to `bootstrap`, if you're creating your Admin role/user in another way (with a
custom migration or an external service, for example).

:::

### Install the Database

```bash
npx directus database install
```

Installs the initial Directus system tables on an empty database. Used internally by `bootstrap`.

It should be used only in specific cases, e.g. when you want to run something between `install` and `migrate`. You
probably should call `directus database migrate:latest` afterwards manually.

You may want to use `directus bootstrap` instead.

### Upgrade the Database

```bash
npx directus database migrate:latest
npx directus database migrate:up
npx directus database migrate:down
```

Migrate the database up/down to match the versions of Directus. Once you update Directus itself, make sure to run
`npx directus database migrate:latest` (or `npx directus bootstrap`) to update your database.

### Migrate Schema to a different Environment

This allows you to do things like migrate a schema from development to production. To move your configured data model
between Directus instances, you can use the schema "snapshot" and "apply" commands.

#### Snapshot the Data Model

Directus can automatically generate a snapshot of your current data model in YAML or JSON format. This includes all
collections, fields, and relations, and their configuration. This snapshot can be checked in version control and shared
with your team. To generate the snapshot, run

```bash
npx directus schema snapshot ./snapshot.yaml
```

To run non-interactively (e.g. when running in a CI/CD workflow), run

```bash
npx directus schema snapshot --yes ./snapshot.yaml
```

Note, that this will force overwrite existing snapshot files.

::: tip Date-based snapshots

To keep multiple snapshot organized by date, create a folder `snapshots` in your project root directory add the
following custom script to your `package.json`:

```bash
"create-snapshot": "npx directus schema snapshot ./snapshots/\"$(date \"+%F\")\"-snapshot-\"$(date \"+%s\")\".yaml"
```

When you run the command via `npm run create-snapshot` it will create a new snapshot with the following naming schema:
`[YYYY-MM-DD]-snapshot-[timestamp].yaml`. This command can be run e.g by your deployment pipeline before each deploy on
your server to keep a schema backup.

:::

#### Applying a Snapshot

To make a different instance up to date with the latest changes in your data model, you can apply the snapshot. By
applying the snapshot, Directus will auto-detect the changes required to make the current instance up to date with the
proposed data model in the snapshot file, and will run the required migrations to the database to make it match the
snapshot.

To apply the generated snapshot, run

```bash
npx directus schema apply ./path/to/snapshot.yaml
```

To run non-interactively (e.g. when running in a CI/CD workflow), run

```bash
npx directus schema apply --yes ./path/to/snapshot.yaml
```

To diff the schema and database and print out the planned changes, run

```bash
npx directus schema apply --dry-run ./path/to/snapshot.yaml
```

### Creating Users

To create a new user with a specific role, run

```bash
npx directus users create --email <user-email> --password <password> --role <role-uuid>
```

#### Updating User Password

To update the password of an existing user, run

```bash
npx directus users passwd --email <user-email> --password <new-password>
```

### Creating Roles

To create a new role, run

```bash
npx directus roles create --role <role-name>
```

These roles are created with the
[minimum permissions required](/user-guide/user-management/users-roles-permissions#configure-system-permissions) to
properly access the App by default.

To create a new role with admin access, set the `--admin` flag to `true`, such as

```bash
npx directus roles create --role <role-name> --admin true
```

To create a new role with app access, set the `--app` flag to `true`, such as

```bash
npx directus roles create --role <role-name> --app true
```

### Count Items in a Collection

To count the amount of items in a given collection, run

```bash
npx directus count <collection-name>
```

---

## Client

For the client-side CLI, all functionality can be accessed by running `npx directusctl <command>`. You can also install
`@directus/cli` on your project dependencies or globally on your machine. Note that if you run `directusctl` (installed
globally) in a folder containing a project that has a version of `@directus/cli` installed, the running global CLI will
forward it's execution to the local installed version instead.

### Help & Documentation

The documentation for all commands can be accessed through the CLI itself. You can list all the available commands
through `directusctl --help` command. If you want help for a specific command you can use `directusctl <command> --help`
instead.

### Instances

Most client-side CLI commands needs a running Directus instance in order to work. To connect the CLI to an instance, you
can use `directusctl instance connect` command. These instance's configs are going to be saved on `~/.directus` folder.

To manage the connected instances, you can use `directusctl instance <command>` commands.

#### Selecting instances

By default, commands will try using an instance named `default` when executing commands.

If you want to change which instance you want to use, either pass `--instance <name>` to the command, or configure
`instance` variable on your project's Directus config file.

For example:

> .directus.yml

```yaml
instance: my-project
```

### I/O

The CLI is designed with ease of use and automation in mind, this means that you can change the way the output is made
by setting how you want the data to be written to the terminal. We currently support three formats, `table` (the default
one), `json` and `yaml`.

This makes it easier to parse and use data from Directus with other tools like `jq`, `yq`, `grep` or any other tools
that accepts data from `stdin`

It's also worth mentioning that everything is data. Try for example running `directusctl --help --format=json`.

#### Table

The default output format. This is the "pretty" output, you'll most likely want to use this if you're not dealing with
data in a way you need to pipe it to another command and/or store it for parsing.

This output will output colors and highlight content if it detects you're running in TTL.

#### JSON

This format will output JSON notation strings to your terminal. By default if TTY is detected, it will highlight (can be
turned off with special flags) and prettify the output to make it easier to read.

Useful when you need to parse data using tools like `jq` for example.

#### YAML

This format will output YAML strings to your terminal. By default if TTY is detected, it will highlight (can be turned
off with special flags) and prettify the output to make it easier to read.

Useful when you need to parse data using tools like `jq` for example.

<!-- ### Extending

To find how you can extend the CLI and write custom commands, check how we make Directus highly extensible on our
[extensions overview page](/concepts/extensions). -->
