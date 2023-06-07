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

You will also need to have the package manager [pnpm](https://pnpm.io) installed.

:::

## 1. Fork the Directus repository

Go to the [repository](https://github.com/directus/directus) and fork it to your GitHub account. A fork is your copy of
the Directus repository which allows you to freely experiment with changes without affecting the original project.

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
pnpm build
```

## 5. Setup Local Configuration

### Create a `.env` file in `/api`

Create an `.env` file under the `api` folder using vars from the online
[config help](https://docs.directus.io/self-hosted/config-options).

::: tip Config Values

The `KEY`& `SECRET` config options from [Security](https://docs.directus.io/self-hosted/config-options.html#security)
are mandatory.

Also the [Database Configuration](https://docs.directus.io/self-hosted/config-options.html#database) must be specified.
You might want to use the [docker-compose.yml](https://github.com/directus/directus/blob/main/docker-compose.yml) file
to spin up a test database.

:::

### Upload/Extensions Folder

If you are using the local storage driver, your files will upload to `/api/uploads`. If you are locally developing
extensions from the extensions folder, that folder should be located at `/api/extensions`.

## 6. Initialize the database

For this step, you'll need to already have a SQL database up-and-running, except if you're using the SQLite driver,
which will create the database (file) for you.

::: tip Admin Account

Adding the `ADMIN_EMAIL` & `ADMIN_PASSWORD` to the `.env` file before running the `bootstrap` command, will populate the
admin user with the provided credentials instead of random values.

:::

To start the initialization run the following command:

```bash
pnpm --filter api cli bootstrap
```

This will set-up the required tables for Directus and make sure all the migrations have run.

## 7. Start the development server

You can run all packages in development with the following command:

```bash
pnpm --recursive dev
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
pnpm --filter api dev
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
pnpm --filter api dev
```

  </td>
  <td>

```bash
pnpm --filter app dev
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

### Debugging The App

There are several ways to debug the app but the easiest way to do it is with the
[Vue Devtools](https://devtools.vuejs.org/). It's
recommended to use the Vue Devtools with Chrome.

::: tip Computed Debugging

 To debug computed properties, it can be helpful to have a look at this
[Vue Guide](https://vuejs.org/guide/extras/reactivity-in-depth.html#reactivity-debugging).

:::

### Debugging The API in VS Code

To debug the API, we recommend to use [Visual Studio Code](https://code.visualstudio.com/) with it's built in debugger.

1. First you need to setup the config for the debugger. Create the following file `./directus/api/.vscode/launch.json`
   and paste in the following structure.

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"type": "node",
			"request": "launch",
			"name": "Debug Api",
			"skipFiles": ["<node_internals>/**"],
			"cwd": "${workspaceFolder}/api",
			"runtimeExecutable": "pnpm",
			"runtimeArgs": ["run", "dev"]
		}
	]
}
```

2. Make sure that you have caching disabled as it otherwise returns the cached response. To disable this, go to your
   `.env` file in the API and set `CACHE_ENABLED` to `false`.

3. In the `tsconfig.json`, set `sourceMap` to true.

4. Now you can start the API by going to the debugger view in VS Code, select to debug the API and press
   `Start Debugging`. This runs the API and allows you to set breakpoints.

## 9. Running tests

Tests run automatically through GitHub Actions. However you may wish to run the tests locally especially when you write
tests yourself.

Install [Docker](https://docs.docker.com/get-docker) and ensure that the service is running.

```bash
# Ensure that you are testing on the lastest codebase
pnpm build

# Run the unit tests
pnpm test

# Clean up in case you ran the blackbox tests before
docker compose -f tests/blackbox/docker-compose.yml down -v

# Start the necessary containers for the blackbox tests
docker compose -f tests/blackbox/docker-compose.yml up -d --wait

# Run the blackbox tests
pnpm test:blackbox
```
