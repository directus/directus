<p align="center"><img alt="Logo" src="https://user-images.githubusercontent.com/522079/127886783-ae6b4ec6-e2ad-4615-8df9-d77c33e92d7e.png"></p>

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

## ⚙️ Installation

Create a new Directus project by running the following npm command:

```
npm init directus-project my-project
```

Or, using yarn:

```
yarn create directus-project my-project
```

Simply follow the setup prompts and the CLI will create your new project directory (eg: `my-project`), configuration
file, and initial database. To get the most out of Directus, and to ensure you have the latest security patches, it is
important to keep your projects up-to-date.

<br>

## 🚀 One-Click Deployments

If you would like to completely avoid the manual installation process, the following self-hosted one-click apps will
handle the heavy-lifting for you. While Directus is always completely free, you will likely need to pay for these
services.

| Google Cloud                                                                                                                                        | Cleavr                                                                                                                                | Cloudron                                                                                                                                  | DigitalOcean                                                                                                                            | Heroku                                                                                                                                                                                              | Platform.sh                                                                                                                                                                                                                                                                                                                                                                             | Zeet                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/directus-community/gcp-example) | <a href="https://docs.cleavr.io/guides/directus"><img src="https://docs.cleavr.io/images/deploy-with-cleavr.png" width="180px" /></a> | <a href="https://cloudron.io/button.html?app=io.directus9.cloudronapp"><img src="https://cloudron.io/img/button.svg" width="180px" /></a> | <a href="https://marketplace.digitalocean.com/apps/directus"><img src="https://www.deploytodo.com/do-btn-blue.svg" width="180px" /></a> | <a href="https://heroku.com/deploy?template=https://github.com/directus-community/heroku-template"><img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy on Heroku" width="180px"></a> | <a href="https://console.platform.sh/projects/create-project?template=https://raw.githubusercontent.com/platformsh/template-builder/master/templates/directus/.platform.template.yaml&utm_content=directus&utm_source=github&utm_medium=button&utm_campaign=deploy_on_platform"><img src="https://platform.sh/images/deploy/lg-blue.svg" alt="Deploy on Platform.sh" width="180px"></a> | <a href="https://deploy.zeet.co/?url=https://github.com/directus-community/heroku-template"><img src="https://deploy.zeet.co/directus.svg" alt="Deploy on Zeet" width="180px"></a> |

<br>

## 📌 Requirements

Directus only requires Node.js and supports most operating systems and SQL database vendors.

- Node.js 12.20+
- npm 6.x+

#### Supported Databases

- PostgreSQL 10+
- MySQL 5.7.8+ / 8+ (with
  [mysql_native_password](https://dev.mysql.com/doc/refman/8.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password-compatible-connectors))
- MariaDB 10.2.7+
- SQLite 3+
- MS SQL 13+<sup>[1]</sup>
- OracleDB 19+<sup>[1]</sup>

<sup>[1]</sup> Older versions may work, but aren't officially supported.

#### Supported OS

- Ubuntu 18.04
- CentOS / RHEL 8
- macOS Catalina or newer
- Windows 10
- Docker ([DockerHub](https://hub.docker.com/r/directus/directus) +
  [Dockerfile](https://github.com/directus/directus/blob/main/docker/Dockerfile))

_Other operating systems may also work, but are not officially supported._

<br>

## 🤔 Community Help

In addition to the [Directus Documentation](https://docs.directus.io), you can also request help via the following
channels:

- [Discord](https://directus.chat) (Live Discussions)
- [GitHub Issues](https://github.com/directus/directus/issues) (Report Bugs)
- [GitHub Discussions](https://github.com/directus/directus/discussions) (Questions, Feature Requests)
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

© 2004-2022, Monospace Inc
