# Contributing

> Our team truly appreciates every single pull-request, bug report, and feature request made by our community. If you have _any_ questions along the way, please reach out to our Core team on [Discord](https://directus.chat).

## Node Monorepo

Our Node.js repository is located at `directus/directus` and houses the Admin App (vue.js 3), Node.js API, project documentation (markdown), and API Specification (OpenAPI). Directus follows a monorepo design similar to React or Babel — to learn more about our monorepo's design and structure, see our [Codebase Overview](#) below.

To contribute to the project, please follow the instructions located within our GitHub repoitory's [contributing.md file](#).

:::tip PHP API Port
While our team's primary focus is the Node.js version, we do also support a community-lead PHP API port in Laravel. This secondary codebase is located in a separate git repository at `directus/php`.
:::

## Codebase Overview

### `/api`
### `/app`
### `/docs`

---
@TODO
## Feature Requests
## The 80/20 Rule
To keep the Directus codebase as clean and simple as possible, we will only consider approving features that we feel at least 80% of our user-base will find valuable. If your feature request falls within the 20% range, it is considered an edge-case and should be implemented as an extension.
## RFCs
## Code of Conduct
## Documentation
Update any relevant docs with an PRs
## Bug Reporting
---
## Prerequisites
## Development Workflow

1) Clone the repo
2) Run `npx lerna bootstrap`

In case of unexpected weirdness, reinstall the dependencies by running

```
npx lerna clean -y && npx lerna bootstrap
```

You can run a dev server for the app and api by running `npm run dev` in the app or api folder respectively.

## Before Submitting a Pull-Request
