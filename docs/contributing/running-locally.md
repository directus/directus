# Running Locally

> This guide explains how to install the _Development_ version of Directus locally so that you can work on the
> platform's source code. To install the _Production_ version locally, please follow to our
> [standard installation guides](/self-hosted/installation/).

::: tip Minimum Requirements

You will need to have [the latest version of Node](https://nodejs.org/en/download/current/) to _build_ a Development
version of Directus.

You can use the JavaScript tool manager [volta](https://volta.sh/) to automatically install the current node and npm
versions.

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
npm install
npm run build
```

## 5. Create a `.env` file

Create an `.env` file under the `api` folder using vars from the online
[config help](https://docs.directus.io/self-hosted/config-options/)

## 6. Initialize the database

For this step, you'll need to already have a SQL database up-and-running, except if you're using the SQLite driver,
which will create the database (file) for you.

To start the initialization run the following command:

```bash
# From within the root of the project
npm run cli bootstrap

# For SQLite you need to run the command in the 'api' context (to ensure the database file is created in the right directory)
npm run cli bootstrap --workspace=api
```

This will set-up the required tables for Directus and make sure all the migrations have run.

## 7. Start the development server

First you need to choose what packages you want to work on. Then, you should run the `dev` script on that package. You
can see their names and list of scripts in their related `package.json`. Example of running APP:

```bash
npm run dev -w @directus/app
```

If you want to work on multiple packages at once, you should create a new instance of your terminal for each package:
Example of running Api, App:

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
npm run dev -w directus
```

  </td>
  <td>

```bash
npm run dev -w @directus/app
```

  </td>
  </tr>
</table>

---

To work on the Documentation (public website version), you should navigate to the `docs` directory and run the following
command:

```bash
npm install
```

<sup>ℹ This is necessary because the way vue-server-renderer imports vue</sup>

Then you should run

```bash
npm run dev:site
```

::: tip

If you encounter errors during this installation process, make sure your node version meets the minimum requirements

:::

## 8. Make your fixes/changes

At this point you are ready to start working on Directus! Before diving in however, it's worth reading through the
introduction to [Contributing](/contributing/introduction).

::: tip Debugging

Check our Wiki for a [guide](https://github.com/directus/directus/wiki/debugging) on debugging the app and api.

:::

## 9. Running tests

Tests run automatically through GitHub Actions. However you may wish to run the tests locally especially when you write
tests.

Install [Docker](https://docs.docker.com/get-docker/) and ensure that the service is running.

```bash
# Ensure that you are testing on the lastest codebase
npm run build

# Clean up in case you ran the tests before
docker compose -f tests/docker-compose.yml down -v

# Start the necessary containers
docker compose -f tests/docker-compose.yml up -d --wait

# Run the tests
npm run test:e2e
```
