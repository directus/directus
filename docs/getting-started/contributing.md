

# Contributing

> Our team truly appreciates every single pull-request, bug report, and feature request made by our community. If you
> have _any_ questions along the way, please reach out to our Core team on [Discord](https://directus.chat).

## Node Monorepo

Our Node.js repository is located at `directus/directus` and houses the Admin App (Vue.js 3), Node.js API, project
documentation (Markdown), API Specification (OpenAPI), and other smaller packages used internally. Directus follows a
monorepo design similar to React or Babel — to learn more about our monorepo's design and structure, see our
[Codebase Overview](#codebase-overview) below.

To contribute to the project, please follow the instructions located within our GitHub repository's
[contributing.md file](https://github.com/directus/directus/blob/main/contributing.md).

<!-- prettier-ignore-start -->
::: tip PHP API Port
While the Node.js version of Directus defines the official specification and is
our team's primary focus, we also support a community-lead PHP API port in Laravel. This secondary
codebase is located in a separate git repository at [`directus/php`](https://github.com/directus).
Though the repository is currently hidden, to coordinate contributing, please reach out to our core team via
[Discord](https://directus.chat). 
::: 
<!-- prettier-ignore-end -->

## Feature Requests

Feature requests are a great way to let our team know what should be prioritized next. You can
[submit a feature request](https://github.com/directus/directus/discussions/category_choices) or upvote
[existing submissions](https://github.com/directus/directus/discussions) all via our GitHub Discussions board.

<!-- prettier-ignore-start -->
::: warning The 80/20 Rule
To keep the Directus codebase as clean and simple as possible, we will
only consider approving features that we feel at least 80% of our user-base will find valuable. If
your feature request falls within the 20% range, it is considered an edge-case and should be
implemented as an extension.
:::
<!-- prettier-ignore-end -->

## RFCs

Some Directus features/fixes may require additional design, strategy, and/or discussion before beginning work. For these
notable pull-requests, you should first submit an RFC (Request For Comments) to our core team via
[Discord](https://directus.chat). This process is relatively informal, but ensures proper alignment, and helps avoid
squandered development time by contributors.

## Bug Reporting

Reporting any bugs you come across is an invaluable part of helping keep Directus stable. After confirming a similar
issue doesn't already exist, you can [submit a bug report](https://github.com/directus/directus/issues/new) via GitHub
Issues. Please ensure the following for all submissions:

- You are experiencing an actual bug, not a configuration issue
- You are not asking a question or requesting a new feature
- You have checked that no similar issue already exists
- You have entered a clear and concise title
- You have followed the issue template, with stack details and steps to reproduce
- You have already tried the following troubleshooting steps:
  - You are on the latest version of Directus
  - You have stopped (`CTRL+C`) and restarted the server
  - You have confirmed the issue is not related to your own custom code
  - Dev Only: You have cleared and reinstalled all dependencies

Please make sure to include all information required to reproduce your exact setup and issue in the issue report.

## Reporting Security Vulnerabilities

If you believe you have discovered a security issue within a Directus product or service, please reach out to us
directly over email: [security@directus.io](mailto:security@directus.io). We will then open a
[GitHub Security Advisory](https://github.com/directus/directus/security/advisories) for tracking the fix.

We value the members of the independent security research community who find security vulnerabilities and work with our
team so that proper fixes can be issued to users. Our policy is to credit all researchers in the fix's release notes. In
order to receive credit, security researchers must follow responsible disclosure practices, including:

- They do not publish the vulnerability prior to the Directus team releasing a fix for it
- They do not divulge exact details of the issue, for example, through exploits or proof-of-concepts

## Code of Conduct

The Directus [Code of Conduct](https://github.com/directus/directus/blob/main/code_of_conduct.md) is one of the ways we
put our values into practice. We expect all of our staff, contractors and contributors to know and follow this code.

## Development Workflow

Before getting started, ensure you your local environment meets our [minimum requirements](/guides/installation/cli) and
you are familiar with Git. Please ensure you're on the "current" version of Node.js (see [Node's release schedule](https://nodejs.org/en/about/releases/)).

<!-- prettier-ignore-start -->
::: tip
You will need to have a minimum of Node 12+ to build Directus!
:::
<!-- prettier-ignore-end -->

### 1. Fork the Directus repository

Go to the [repository](https://github.com/directus/directus) and fork it to your GitHub account. A fork is your copy of the Directus repository. 
Forking the repository allows you to freely experiment with changes without affecting the original project.

### 2. Clone from your repository

```bash
git clone git@github.com:YOUR-USERNAME/directus.git
```

### 3. Make a new branch

```bash
git checkout -b YOUR-BRANCH-NAME
```

### 4. Install the dependencies

```bash
npm install
```

### 5. Setup the Database & Env File

For this step, you'll need to already have a SQL database up-and-running, otherwise you can only use the SQLite driver,
which will create the database for you. Run the following command from within root of the project:

```bash
npm run cli -- init
```

### 6. Start the development server

Run the following command from the root directory.

```bash
npm run dev
```

<!-- prettier-ignore-start -->
::: If you encounter errors during this installation process, make sure your node version meets the [minimum requirements](/guides/installation/cli) :::
<!-- prettier-ignore-end -->

### 7. Make your fixes/changes

At this point you are ready to start working on Directus! Before diving in however, it's worth reading through our docs
on [submitting a pull-request](#Submitting-a-Pull-Request).

## Submitting a Pull-Request

### 1. Submit an RFC (if needed)

Please read our docs on the [RFC process](#rfcs).

### 2. Update relevant docs

Before submitting any pull-requests, ensure that any relevant documentation (included in this same repo) is updated.

### 3. Push your changes

```bash
git push -u origin YOUR-BRANCH-NAME
```

### Submit a pull-request

Once you push the changes to your repo, the "Compare & pull request" button will appear in GitHub. 
Click it and you'll be taken to a screen where you can fill in the appropriate details. 
Finally, open the pull request by clicking the "Create pull request" button.

Now our core staff will review your contribution and either merge it, or request that you to make changes.

## Syncing Your Fork with Directus

After you have submitted your pull requests, you would need to sync your fork with Directus to pull all the latest commits before you continue to contribute.

### 1. Add Directus as a Remote

While your fork is your main remote or origin, you will add Directus as the upstream, which generally refers to the original repo that you have forked.

```bash
git remote add upstream git@github.com:directus/directus.git
```

### 2. Fetch the Latest Changes

Depending on your setup, you will need to get the latest commits from the `main` branch of Directus by doing a pull, reset, rebase or fetch.

```bash
git pull upstream main
```

At this point you are ready to continue working on Directus, with the latest commits included! 

<!-- prettier-ignore-start -->
::: tip
Before you begin or resume development, be sure to always sync, if you are going to submit a pull request with your changes!
:::
<!-- prettier-ignore-end -->

## Codebase Overview

### `/api`

Contains the Directus API (REST+GraphQL), written in node.js.

### `/app`

Contains the Directus Admin App, written in Vue.js 3.

### `/docs`

Contains all the platform's documentation, written in markdown with additional VuePress formatting.
