# Contributing

> Our team truly appreciates every single pull-request, bug report, and feature request made by our community. If you have _any_ questions along the way, please reach out to our Core team on [Discord](https://directus.chat).

## Node Monorepo

Our Node.js repository is located at `directus/directus` and houses the Admin App (vue.js 3), Node.js API, project documentation (markdown), and API Specification (OpenAPI). Directus follows a monorepo design similar to React or Babel — to learn more about our monorepo's design and structure, see our [Codebase Overview](#) below.

To contribute to the project, please follow the instructions located within our GitHub repoitory's [contributing.md file](#).

:::tip PHP API Port
While the Node.js version of Directus defines the official specification and is our team's primary focus, we also support a community-lead PHP API port in Laravel. This secondary codebase is located in a separate git repository at [`directus/php`](#).
:::

## Codebase Overview

### `/api`

@TODO

### `/app`

@TODO

### `/docs`

@TODO

## Feature Requests

Feature requests are a great way to let our team know what should be prioritized next. You can [submit a feature request](https://github.com/directus/next/discussions/category_choices) or upvote [existing submissions](https://github.com/directus/next/discussions) all via our GitHub Discussions board.

:::warning The 80/20 Rule
To keep the Directus codebase as clean and simple as possible, we will only consider approving features that we feel at least 80% of our user-base will find valuable. If your feature request falls within the 20% range, it is considered an edge-case and should be implemented as an extension.
:::

## RFCs

Some Directus features/fixes may require additional design, strategy, and/or discussion before beginning work. For these notable pull-requests, you should first submit an RFC (Request For Comments) to our core team via [Discord](https://discord.gg/directus). This process is relatively informal, but ensures proper alignment, and helps avoid squandered development time by contributors.

## Code of Conduct

The Directus [Code of Conduct](https://github.com/directus/next/blob/main/code_of_conduct.md) is one of the ways we put our values into practice. We expect all of our staff, contractors and contributors to know and follow this code.

## Bug Reporting

@TODO

---
## Prerequisites

@TODO

## Development Workflow

### 1. Fork the Directus repository

Go to the [repository](https://github.com/directus/next) and fork it to your GitHub account.

### 2. Clone from your repository

```bash
git clone git@github.com:YOUR-USERNAME/next.git
```

### 3. Install the dependencies

```bash
npx lerna bootstrap
```

### 4. Start the API development server

```bash
cd directus/api
npm run dev
```

### 5. Start the App development server

```bash
cd directus/app
npm run dev
```

:::tip Reinstalling Dependencies
```bash
npx lerna clean -y && npx lerna bootstrap
```
:::

## Before Submitting a Pull-Request

### 1. Update Relevant Docs

Before submitting any pull-requests, ensure that any relevant documentation (included in this same repo) is updated.
