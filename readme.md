<p align="center"><img width="400" alt="Logo" src="https://user-images.githubusercontent.com/522079/89687381-23943700-d8ce-11ea-9a4d-ae3eae136423.png"></p>

<br><br>

## 🐰 Introduction

Directus is a free and open-source platform for managing SQL database content via a real-time API and intuitive App dashboard.

* **Take control over your data.** Manage the content within your new or existing databases.
* **Choose your SQL vendor.** Supports PostgreSQL, MySQL, SQLite, OracleDB, MariaDB and MS-SQL.
* **Self-hosted option.** Integrates into your infrastructure, for 100% transparancy and scale.
* **Completely extensible.** Customize and white-label our modular platform without any limitations.
* **REST and GraphQL API.** Instantly adds a dynamic and feature-rich API to your datastore.
* **Completely extensible.** Customize and white-label our modular platform without any limitations.

**[Learn more about Directus on our website.](https://directus.io)**

## 🚧 Alpha

**DO NOT USE THIS VERSION IN PRODUCTION.**

This is *pre-release* software, therefore migrations will not be provided, breaking changes may occur at any time, and certain features might be missing or broken. You can follow along with [the issue tracker](https://github.com/directus/next/issues) for an in-depth list of upcoming enhancements, with the following notable features still under development:

- [ ] GraphQL Endpoint
- [ ] App Permissions
- [ ] MS SQL Support
- [ ] OracleDB Support
- [ ] Webhooks
- [ ] Import/Export Endpoints
- [ ] Caching
- [ ] Rate Limiting

## ⚙️ Installation

Create a new Directus project by running the following npm command:

```
npx create-directus-project my-project
```

Or, using yarn:

```
yarn create directus-project my-project
```

Follow the prompts and the CLI will create your new project directory (eg: `my-project`), setup the configuration file, and install/seed the database. To get the most out of Directus, and to ensure you have the latest security patches, it is important to keep your projects up-to-date. For more information, view our documentation on [Updates & Migrations](#).

## ✨ Requirements

Directus only requires Node.js — and supports most operating systems and SQL database vendors.

* Node.js 10+
* npm 6.x+

#### Supported Databases

* PostgreSQL 10+
* MySQL 5.6+
* MariaDB 10.1+
* SQLite 3+
* MS-SQL X.X+
* OracleDB X.X+

#### Supported OS

* Ubuntu 18.04
* Windows
* Docker ([DockerHub](https://hub.docker.com/r/directus/directus) + [Docker Repo](https://github.com/directus/docker))

_Other operating systems may also work, but are not officially supported._

## 🔧 Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting Pull Requests.

## 🤔 Community Help

In addition to the [Directus Documentation](https://docs.directus.io), you can also request help via the following channels:

* [Discord](http://discord.gg/directus) (Live Discussions)
* [GitHub Issues](https://github.com/directus/next/issues) (Report Bugs)
* [GitHub Discussions](https://github.com/directus/next/discussions/category_choices) (Questions, Feature Requests)
* [Twitter](https://twitter.com/directus) (Latest News)
* [YouTube](https://www.youtube.com/c/DirectusVideos/featured) (Video Tutorials)

## ❤️ Supporting Directus

Directus is a premium open-source project, with development made possible by support from our core team, contributors, and sponsors. If you would like to help ensure Directus remains free, please consider becoming a sponsor.

* [Support us through GitHub Sponsors](https://github.com/sponsors/directus)
* [One-time donation through PayPal](https://www.paypal.me/supportdirectus)

## 📄 License

Released under [the GPLv3 license](./license); Monospace Inc owns all Directus trademarks and logos on behalf of our project's community.

© 2006-2020, Monospace Inc.
