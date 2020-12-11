# Installing from CLI

## 1. Confirm Minimum Requirements are Met

**The only requirements for Directus is an actively maintained version of
[Node.js](https://nodejs.org/en/about/releases/).** Currently that is v10+, however in April 2021, node v10 will leave
_Maintenance Long-Term Support (LTS)_ status, and node v12+ will become the new minimum requirement.

### Databases

Directus currently supports the following databases, with our minimum version being based on each vendor's official
support/LTS.

| Database      | Version |
| ------------- | ------- |
| PostgreSQL    | 10+     |
| MySQL         | 5.7.8+  |
| SQLite        | 3+      |
| MS-SQL Server | 13.0+   |
| OracleDB      | TBD     |
| MariaDB       | 10.2+   |

<!-- prettier-ignore-start -->
::: tip
Variants In addition to the databases above, other variants are also supported, including **AWS Aurora** (MySQL), and **AWS Redshift** (PostgreSQL).
:::
<!-- prettier-ignore-end -->

## 2. Create a Project

Create a new Directus project by running the following npm command.

```bash
npx create-directus-project my-project
```

<!-- prettier-ignore-start -->
::: warning
Except for SQLite, the database must already be running before creating your Directus
project.
:::
<!-- prettier-ignore-end -->

## 3. Start your Project

To start Directus, simply run the following command in your project directory.

```bash
npx directus start
```
