---
description:
  This guide explains how to install the _Development_ version of Directus locally so that you can work on the
  platform's source code.
readTime: 4 min read
---

# Running Locally

> This guide explains how to install the _Development_ version of Directus locally so that you can work on the
> platform's source code. To install the _Production_ version locally, please follow to our
> [Docker Guide](/self-hosted/docker-guide).

::: tip Minimum Requirements

You will need to have [the latest version of Node](https://nodejs.org/en/download/current) to _build_ a Development
version of Directus.

You can use the JavaScript tool manager [volta](https://volta.sh) to automatically install the current node and npm
versions.

You will also need to have the package manager [pnpm](https://pnpm.io) installed. You can install pnpm using the
following command: `npm install -g pnpm`.

:::

## 1. Fork the Directus repository

Go to the [repository](https://github.com/directus/directus) and fork it to your GitHub account. A fork is your copy of
the Directus repository. Forking the repository allows you to freely experiment with changes without affecting the
original project.

## 2. Clone from your repository

```bash
git clone git@github.com:YOUR-USERNAME/directus.git
```

## 3. Make a new branch

```bash
git checkout -b YOUR-BRANCH-NAME
```

## 4. Install the dependencies and build the project

```bash
pnpm install
pnpm -r build
```

## 5. Create a `.env` file

Create an `.env` file under the `api` folder using vars from the online
[config help](https://docs.directus.io/self-hosted/config-options)

## 6. Initialize the database

For this step, you'll need to already have a SQL database up-and-running, except if you're using the SQLite driver,
which will create the database (file) for you.

To start the initialization run the following command:

```bash
# Run the command in the 'api' context (to ensure the database file is created in the right directory)
pnpm --dir api cli bootstrap
```

This will set-up the required tables for Directus and make sure all the migrations have run.

## 7. Start the development server

You can run all packages in development with the following command:

```bash
pnpm -r dev
```

::: warning Race Conditions

When running multiple or all packages, sometimes `ts-node` may not start up the API properly because of race conditions
due to changes happening to other packages. You can either rerun the command to restart the API or opt to choose what
packages to work on as described below.

:::

If you wish to choose what packages to work on, you should run the `dev` script for that package. You can see their
names and list of scripts in their related `package.json`.

Example of running the API only:

```bash
pnpm --filter directus dev
```

If you want to work on multiple packages at once, you should create a new instance of your terminal for each package.
Example of running both the API and App at the same time:

<table>
  <tr>
  <th>
  Terminal 1 [Api]
  </th>
  <th>
  Terminal 2 [App]
  </th>
  </tr>
  <tr>
  <td>

```bash
pnpm --filter directus dev
```

  </td>
  <td>

```bash
pnpm --filter @directus/app dev
```

  </td>
  </tr>
</table>

---

::: tip

If you encounter errors during this installation process, make sure your node version meets the minimum requirements

:::

## 8. Make your fixes/changes

At this point you are ready to start working on Directus! Before diving in however, it's worth reading through the
introduction to [Contributing](/contributing/introduction).

::: tip Debugging

Check our Wiki for a [guide](https://github.com/directus/directus/wiki/debugging) on debugging the app and API.

:::

## 9. Running tests

Tests run automatically through GitHub Actions. However you may wish to run the tests locally especially when you write
tests yourself.

Install [Docker](https://docs.docker.com/get-docker) and ensure that the service is running.

```bash
# Ensure that you are testing on the lastest codebase
pnpm -r build

# Run the unit tests
pnpm -r test

# Clean up in case you ran the blackbox tests before
docker compose -f tests-blackbox/docker-compose.yml down -v

# Start the necessary containers for the blackbox tests
docker compose -f tests-blackbox/docker-compose.yml up -d --wait

# Run the blackbox tests
pnpm test:blackbox
```
