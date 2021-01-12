
# Installing from CLI

> A command line interface (CLI) is a text-based user interface (UI) used to view and manage computer files. Common CLI clients are [Windows Terminal](https://en.wikipedia.org/wiki/Windows_Terminal) and [MacOS Terminal](https://en.wikipedia.org/wiki/Terminal_(macOS)).
> [Learn More about CLI](/reference/command-line-interface)

## 1. Confirm the Minimum Requirements are met

**The only language or script requirement for Directus is an actively maintained version of
[Node.js](https://nodejs.org/en/about/releases/).** 
Currently that is v10+, however in April 2021, node v10 will leave
_Maintenance Long-Term Support (LTS)_ status, and node v12+ will become the new minimum requirement.

### Databases

Directus currently supports the following databases, with our minimum version being based on each vendor's official support/LTS.

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

Navigate to the directory where you wish to create a new Directus project.
The new project and directory will be created inside the current directory.
Create a new Directus project by running the following npm command.

```bash
npx create-directus-project my-project
```

_my-project_ will also be the name of the new Directus project directory.

<!-- prettier-ignore-start -->
::: warning
Except for SQLite, the database must already be running before creating your Directus
project.
:::
<!-- prettier-ignore-end -->

## 3. Start your Project

To start Directus, navigate to the project directory, _my-project_.

```bash
cd my-project
```

Run the following command in your project directory.

```bash
npx directus start
```

## 4. View your Project
The default port used by Directus is 8055.
To view your project locally, enter `http://localhost:8055` in your browser.

<!-- prettier-ignore-start -->
::: tip
You can confirm the port by looking for the message in your _terminal_ or _cli client_: 
**Server started at port 8055**
:::
<!-- prettier-ignore-end -->
