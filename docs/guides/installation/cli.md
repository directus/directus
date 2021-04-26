# Installing from CLI

## 1. Confirm Minimum Requirements

Directus requires two things to run: [Node.js](https://nodejs.dev) and a Database. For both these system requirements,
we aim to support the current LTS release (and newer).

To run Directus, you currently need Node 12.12 or newer, and one of the following databases:

| Database      | Version |
| ------------- | ------- |
| PostgreSQL    | 10+     |
| MySQL         | 5.7.8+  |
| SQLite        | 3+      |
| MS-SQL Server | 13.0+   |
| OracleDB      | 19+     |
| MariaDB       | 10.2+   |

::: tip Variants

In addition to the databases above, other variants are also supported, including **AWS Aurora** (MySQL), **AWS
Redshift** (PostgreSQL), and **MariaDB**.

:::

::: tip Apple Silicon

When installing Directus on an Apple-made ARM CPU, make sure you have `libvips` installed. See
[Apple M1](https://sharp.pixelplumbing.com/install#apple-m1).

:::

## 2. Create a Project

Navigate to the directory where you wish to create a new Directus project. The new project and directory will be created
inside the current directory. Create a new Directus project by running the following npm command.

```bash
npx create-directus-project my-project
```

::: warning

Except for SQLite, the database must already be running before creating your Directus project.

:::

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

The default port used by Directus is 8055. To view your project locally, go to
[http://localhost:8055](http://localhost:8055) in your browser.

::: tip Changing Port

If you want to use a different port, use [the `PORT` environment variable](/reference/environment-variables/#general).

:::

::: tip .env Permissions

By default, the `create-directus-project` tool will set the file permissions of the generated `.env` to `-rw-r-----`
(0640). If you run Directus from a separate user on your machine, make sure these permissions are correct.

:::
