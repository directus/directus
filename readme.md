<p align="center"><img alt="Directus Logo" src="https://user-images.githubusercontent.com/522079/158864859-0fbeae62-9d7a-4619-b35e-f8fa5f68e0c8.png"></p>

<br />

## 🐰 Introduction

Directus is a real-time API and App dashboard for managing SQL database content.

- **Free & open-source.** No artificial limitations, vendor lock-in, or hidden paywalls.
- **REST & GraphQL API.** Instantly layers a blazingly fast Node.js API on top of any SQL database.
- **Manage pure SQL.** Works with new or existing SQL databases, no migration required.
- **Choose your database.** Supports PostgreSQL, MySQL, SQLite, OracleDB, CockroachDB, MariaDB, and MS-SQL.
- **On-Prem or Cloud.** Run locally, install on-premises, or use our
  [self-service Cloud service](https://directus.io/pricing).
- **Completely extensible.** Built to white-label, it is easy to customize our modular platform.
- **A modern dashboard.** Our no-code Vue.js app is safe and intuitive for non-technical users, no training required.

**[Learn more about Directus](https://directus.io)** • **[Documentation](https://docs.directus.io)**

<br />

## 🚀 Directus Cloud

[Directus Cloud](https://directus.io/pricing) allows you to create projects, hosted by the Directus team, in 90 seconds.

- **No product limitations or service usage quotas (unlimited users, API requests, etc)**
- A modern self-service dashboard to create and monitor all your projects in one place
- End-to-end solution: Directus, database, serverless auto-scaling, storage, and a global CDN
- Select your desired region and provision a new project in ~90 seconds

**[Create a Directus Cloud Project](https://directus.cloud)**

<br />

## 🤔 Community Help

[The Directus Documentation](https://docs.directus.io) is a great place to start, or explore these other channels:

- [Discord](https://directus.chat) (Questions, Live Discussions)
- [GitHub Issues](https://github.com/directus/directus/issues) (Report Bugs)
- [GitHub Discussions](https://github.com/directus/directus/discussions) (Feature Requests)
- [Twitter](https://twitter.com/directus) (Latest News)
- [YouTube](https://www.youtube.com/c/DirectusVideos/featured) (Video Tutorials)

<br />

## Local Development

<!-- Directus API Service -->

1. Run `pnpm i` at the root `directus` folder.
2. Run `pnpm -r build` at the root `directus` folder.
3. Navigate to `/api`
4. Create a ENV file named `.env`
   - You can populate the environment variables from
     [Configuration Files](https://docs.directus.io/self-hosted/config-options.html#configuration-files)
     - **Note:** You will need to add at the Database config variables, along with the `KEY` & `SECRET`.
5. Run `pnpm cli database install`
6. Run `pnpm cli database migrate:latest` to run all migrations for the database.
7. Run `pnpm cli roles create --role Administrator --admin` to create an admin role. This will return the id value for
   the role created.
8. Run `pnpm cli users create --email <email> --password <password> --role <role_id>` to create a new admin user and
   return the user id.
   - Example:
     `pnpm cli users create --email email@directus.io --password secret_password --role b0600d5c-b768-4bbc-a8e4-49e89d35748a `
9. Run `pnpm dev` to start the API service.

<!-- Directus Admin App -->

1. Navigate to `/app`.
2. Create a ENV file named `.env.development`.
   - You can populate the environment variables from
     [Configuration Files](https://docs.directus.io/self-hosted/config-options.html#configuration-files)
3. Run `pnpm -r run build` to build all required package dependencies.
4. Navigate to `/app` and run `pnpm dev`.
5. Navigate to your local Directus URL, and login with the credentials you just created.

### Changing Local Database with Docker

- To change from a local `sqlite` database, you can use anyone of the supported databases in the root
  [docker-compose.yml](./docker-compose.yml) by running `docker compose up -d postgres redis minio`.

**Note:** If you are trying to run `postgres` on a M1/M2 MacBook (arm64), you will need to change the postgres image to
be `image: ghcr.io/baosystems/postgis:13-3.3` and include `platform: linux/arm64`. (This is not officially supported,
but provided as a work around).

## ❤️ Contributing & Sponsoring

Please read our [Contributing Guide](./contributing.md) before submitting Pull Requests.

All security vulnerabilities should be reported in accordance with our
[Security Policy](https://docs.directus.io/contributing/introduction/#reporting-security-vulnerabilities).

Directus is a premium open-source ([GPLv3](./license)) project, made possible with support from our passionate core
team, talented contributors, and amazing [GitHub Sponsors](https://github.com/sponsors/directus). Thank you all!

<br />

© 2004-2023, Monospace Inc
