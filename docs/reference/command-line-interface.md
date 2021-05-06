# Command Line Interface

> Directus ships with a command line interface (CLI) that you can use for various actions. All functionality can be
> accessed by running `npx directus <command>` in your project folder.

[[toc]]

## Initialize a New Project

```
npx directus init
```

Will install the required database driver, and create a `.env` file based on the inputted values.

## Bootstrap a Project

```
npx directus bootstrap
```

Will use an existing `.env` file (or existing environment variables) to either install the database (if it's empty) or
migrate it to the latest version (if it already exists and has missing migrations).

This is very useful to use in environments where you're doing standalone automatic deployments, like a multi-container
Kubernetes configuration, or a similar approach on
[DigitalOcean App Platform](/guides/installation/digitalocean-app-platform/) or
[AWS Elastic Beanstalk](/guides/installation/aws/)

::: tip First User

You can use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables to automatically provision the first user on
first creation using the `bootstrap` command. See [Environment Variables](/reference/environment-variables/) for more
information.

:::

## Install the Database

```
npx directus database install
```

Installs the Directus system tables on an empty database. Used internally by `bootstrap`

## Upgrade the Database

```
npx directus database migrate:latest
npx directus database migrate:up
npx directus database migrate:down
```

Migrate the database up/down to match the versions of Directus. Once you update Directus itself, make sure to run
`npx directus database migrate:latest` (or `npx directus bootstrap`) to update your database.
