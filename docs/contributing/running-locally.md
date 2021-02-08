# Running Locally

> This guide explains how to install the _Development_ version of Directus locally so that you can work on the platform's source code. To install the _Production_ version locally, please follow to our [standard installation guides](/getting-started/installation/).

::: tip Minimum Requirements

You will need to have a **minimum of Node 12+** to _build_ a Development version of Directus, though it is recommended that you are on the [most "current" version of Node.js](https://nodejs.dev/en/about/releases/).

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

## 4. Install the dependencies

```bash
npm install
```

## 5. Setup the Database & Env File

For this step, you'll need to already have a SQL database up-and-running, otherwise you can only use the SQLite driver,
which will create the database for you. Run the following command from within root of the project:

```bash
npm run cli -- init
```

## 6. Start the development server

Run the following command from the root directory.

```bash
npm run dev
```

If you are only looking to work on the Documentation (public website version), you can navigate to the `docs` directory and run the following command:

```bash
npm run dev:site
```

::: tip

If you encounter errors during this installation process, make sure your node version meets the
[minimum requirements](/guides/installation/cli)

:::

## 7. Make your fixes/changes

At this point you are ready to start working on Directus! Before diving in however, it's worth reading through our docs
on [submitting a pull-request](#Submitting-a-Pull-Request).
