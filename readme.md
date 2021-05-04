<br>

<p align="center"><img width="400" alt="Logo" src="https://user-images.githubusercontent.com/522079/89687381-23943700-d8ce-11ea-9a4d-ae3eae136423.png"></p>

<br>

## 🐰 Introduction

Directus is a real-time API and App dashboard for managing SQL database content.

- **Free & open-source.** No artificial limitations, vendor lock-in, or hidden pricing.
- **REST & GraphQL API.** Instantly adds a blazingly fast Node.js API layer to your database.
- **Manage pure SQL.** Works with existing SQL databases, or helps build new architectures from scratch.
- **Choose your database.** Supports PostgreSQL, MySQL, SQLite, OracleDB, MariaDB and MS-SQL.
- **Allows self-hosting.** Choose your hosting and infrastructure, run locally, or deeply integrate on-premises.
- **Completely extensible.** Built to white-label, it is easy to customize our modular platform.
- **A modern dashboard.** A Vue.js Admin App so safe and intuitive, non-technical users require no training.

**[Learn more about Directus on our website.](https://directus.io)**

<br>

## 🚧 Release Candidate

This is _pre-release_ software. While we're providing migrations between versions, changes may occur at any time, and
certain features might be missing or broken. You can follow along with
[the issue tracker](https://github.com/directus/directus/issues) for an in-depth list of upcoming enhancements, with the
following notable features still under development:

- [ ] Import/Export Endpoints

<br>

## ⚙️ Installation

Create a new Directus project by running the following npm command:

```
npx create-directus-project my-project
```

Or, using yarn:

```
yarn create directus-project my-project
```

Simply follow the setup prompts and the CLI will create your new project directory (eg: `my-project`), configuration
file, and initial database. To get the most out of Directus, and to ensure you have the latest security patches, it is
important to keep your projects up-to-date.

<br>

## :rocket: Deploy on Platform.sh

An empty [Directus project](https://github.com/platformsh-templates/directus) repository is maintained by
[Platform.sh](https://platform.sh) that you can quickly deploy using the button below.

<p align="center">
<a href="https://console.platform.sh/projects/create-project?template=https://raw.githubusercontent.com/platformsh/template-builder/master/templates/directus/.platform.template.yaml&utm_content=directus&utm_source=github&utm_medium=button&utm_campaign=deploy_on_platform">
    <img src="https://platform.sh/images/deploy/lg-blue.svg" alt="Deploy on Platform.sh" width="180px" />
</a>
</p>

## :rocket: Deploy on Heroku

You can quickly deploy a project on Heroku using our community maintained template.

<p align="center">
    <a href="https://heroku.com/deploy?template=https://github.com/directus-community/heroku-template">
        <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
    </a>
</p>

## 📌 Requirements

Directus only requires Node.js and supports most operating systems and SQL database vendors.

- Node.js 10+
- npm 6.x+

#### Supported Databases

- PostgreSQL 10+
- MySQL 5.7.8+ (8.* with mysql_native_password [here](https://dev.mysql.com/doc/refman/8.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password-compatible-connectors))
- MariaDB 10.2+
- SQLite 3+
- MS-SQL X.X+
- OracleDB X.X+

#### Supported OS

- Ubuntu 18.04
- CentOS / RHEL 8
- macOS Catalina or newer
- Windows 10
- Docker ([DockerHub](https://hub.docker.com/r/directus/directus) +
  [Dockerfile](https://github.com/directus/directus/blob/43f4e63179b7c370ceee721c0a5ca0f616f30c58/.github/actions/build-images/Dockerfile))

_Other operating systems may also work, but are not officially supported._

<br>

## 🤔 Community Help

In addition to the [Directus Documentation](https://docs.directus.io), you can also request help via the following
channels:

- [Discord](http://discord.gg/directus) (Live Discussions)
- [GitHub Issues](https://github.com/directus/directus/issues) (Report Bugs)
- [GitHub Discussions](https://github.com/directus/directus/discussions/category_choices) (Questions, Feature Requests)
- [Twitter](https://twitter.com/directus) (Latest News)
- [YouTube](https://www.youtube.com/c/DirectusVideos/featured) (Video Tutorials)

<br>

## ❤️ Contributing & Sponsoring

Please read our [Contributing Guide](./contributing.md) before submitting Pull Requests.

All security vulnerabilities should be reported in accordance with our
[Security Policy](https://docs.directus.io/contributing/introduction/#reporting-security-vulnerabilities).

Directus is a premium open-source ([GPLv3](./license)) project, made possible with support from our passionate core
team, talented contributors, and amazing [GitHub Sponsors](https://github.com/sponsors/directus). Thank you all!

<br>

© 2004-2021, Monospace Inc
