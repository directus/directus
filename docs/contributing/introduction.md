# Contributing

> Our team truly appreciates every single contributor, community member, GitHub star, pull-request, bug report, and
> feature request. Keeping Directus completely free and open-source is our way of saying: **Thank you!**

::: tip We're here to help!

If you have _any_ questions along your contributor journey, please feel free to come chat with us on our
[Discord Community](https://directus.chat).

:::

::: tip Technical Contributor Docs

Technical documentation for contributing to the core codebase is located on the main `directus/directus`
[GitHub repository's Wiki](https://github.com/directus/directus/wiki).

:::

## Code of Conduct

**The Directus [Code of Conduct](https://github.com/directus/directus/blob/main/code_of_conduct.md) is one of the ways
we put our values into practice. We expect all of our staff, contractors and contributors to know and follow this
code.**

**Our contributors and maintainers work extremely hard to build Directus as premium open-source software. Please be
respectful of those efforts throughout our ecosystem. Trolling, harassing, insulting, or other unacceptable behavior by
participants will not be tolerated.**

In the interest of fostering an open and welcoming environment, we as pledge to make participation in our project and
community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex
characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality,
personal appearance, race, religion, or sexual identity and orientation.

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Before continuing, please take a moment to read our full
[Code of Conduct](https://github.com/directus/directus/blob/main/contributing.md).**

## Wait — Before you Begin

When contributing to this repository, it is important to first discuss the change you wish to make with the owners of
this repository. This can be done via [GitHub Issue](https://github.com/directus/directus/issues),
[GitHub Discussions](https://github.com/directus/directus/discussions), [Discord](https://directus.chat),
[email](mailto:info@directus.io), or any other method.

Following this rule will help avoid wasted time caused by multiple people working on the same issue or writing code that
will not be merged.

## Feature Requests

Feature requests are a great way to let our team know what should be prioritized next. You can
[submit a new feature request](https://github.com/directus/directus/discussions/new) or
[vote on existing submissions](https://github.com/directus/directus/discussions) via GitHub Discussions.

::: warning The 80/20 Rule

To keep the Directus codebase as clean and simple as possible, we will only consider approving features that we feel at
least 80% of our user-base will find valuable. If your feature request falls within the 20% range, it is considered an
edge-case and should be implemented as an extension.

:::

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
- You are using the official (pre-built) version of directus and not a fork
- You are not asking a question or requesting a new feature
- You have checked that no similar issue (or discussion) already exists
- You have entered a clear and concise title
- You have followed the issue template, with stack details and steps to reproduce
- You have already completed all [troubleshooting steps](/getting-started/support#troubleshooting-steps)

## Reporting Security Vulnerabilities

If you believe you have discovered a security issue within a Directus product or service, please reach out to us
directly over email: [security@directus.io](mailto:security@directus.io). We will then open a
[GitHub Security Advisory](https://github.com/directus/directus/security/advisories) for tracking the fix.

We value the members of the independent security research community who find security vulnerabilities and work with our
team so that proper fixes can be issued to users. Our policy is to credit all researchers in the fix's release notes. In
order to receive credit, security researchers must follow responsible disclosure practices, including:

- They do not publish the vulnerability prior to the Directus team releasing a fix for it
- They do not divulge exact details of the issue, eg: through exploits or proof-of-concepts

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

Once you push the changes to your repo, the "Compare & pull request" button will appear in GitHub. Click it and you'll
be taken to a screen where you can fill in the appropriate details. Finally, open the pull request by clicking the
"Create pull request" button.

Now our core staff will review your contribution and either merge it, or request that you to make changes.

## Syncing Your Fork with Directus

After you have submitted your pull requests, you would need to sync your fork with Directus to pull all the latest
commits before you continue to contribute.

### 1. Add Directus as a Remote

While your fork is your main remote or origin, you will add Directus as the upstream, which generally refers to the
original repo that you have forked.

```bash
git remote add upstream git@github.com:directus/directus.git
```

### 2. Fetch the Latest Changes

Depending on your setup, you will need to get the latest commits from the `main` branch of Directus by doing a pull,
reset, rebase or fetch.

```bash
git pull upstream main
```

At this point you are ready to continue working on Directus, with the latest commits included!

::: tip

Before you begin or resume development, be sure to always sync, if you are going to submit a pull request with your
changes!

:::
