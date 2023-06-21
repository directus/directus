---
description: How to host Directus on Docker.
readTime: 3 min read
---

# Docker Guide

::: info Non-Docker Guides

We only publish and maintain self-hosting guides using Docker as this removes many environment-specific configuration
problems. If you can't or don't want to use Docker, we also publish an
[npm package](https://www.npmjs.com/package/directus) without guides.

:::

Directus is published to [Docker Hub](https://hub.docker.com/r/directus/directus) under `directus/directus`. If you're just getting started, check out our [Self-Hosting Quickstart](/self-hosted/quickstart.html).

## Installing Specific Versions

To stick to a more specific version of Directus you can use one of the following tags:

- Full version, e.g. `10.0.0`
- Minor releases, e.g. `10.0`
- Major releases, e.g. `10`

To use a specific version of Directus, include the version number in your `services.directus.image` value:

```yml
services:
  directus:
    image: directus/directus // [!code --]
    image: directus/directus:10.0.0 // [!code ++]
```

## Configure Admin User

The `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables, while shown in the quickstart, are optional. If omitted, the published Docker image will automatically populate the database and create an admin user. To configure the
email/password for this first user, include the following environment variables:

```bash
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"
```

## Persistence

Containers are ephemeral, and this means that whenever you stop a container, all the data associated with it is going to be removed [unless you persist them](https://docs.docker.com/storage) when creating your container.

Directus image by default will use the following locations for data persistence (note that these can be changed through environment variables):

- `/directus/uploads` for uploads
- `/directus/database` (only when using SQLite and not configured to a different folder)
- `/directus/extensions` for loading extensions

The `services.directus.volumes` section in your docker-compose.yml is optional. To persist data to your local machine, include a list of persisted directories:

```yml
services:
  directus:
    volumes:
      - ./database:/directus/database
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
```

## Example Docker Compose

Whiel the [Self-Hosting Quickstart](/self-hosted/quickstart.html) aims to show you the minimum-viable `docker-compose.yml` file, here is a more complete one that spins up a Postgres database, Redis cache, and Directus project:

```yaml
version: '3'
services:
  database:
    container_name: database
    image: postgis/postgis:13-master
    # Required when running on platform other than amd64, like Apple M1/M2:
    # platform: linux/amd64
    volumes:
      - ./data/database:/var/lib/postgresql/data
    networks:
      - directus
    environment:
      POSTGRES_USER: 'directus'
      POSTGRES_PASSWORD: 'directus'
      POSTGRES_DB: 'directus'

  cache:
    container_name: cache
    image: redis:6
    networks:
      - directus

  directus:
    container_name: directus
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - ./uploads:/directus/uploads
      # If you want to load extensions from the host
      # - ./extensions:/directus/extensions
    networks:
      - directus
    depends_on:
      - cache
      - database
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'

      DB_CLIENT: 'pg'
      DB_HOST: 'database'
      DB_PORT: '5432'
      DB_DATABASE: 'directus'
      DB_USER: 'directus'
      DB_PASSWORD: 'directus'

      CACHE_ENABLED: 'true'
      CACHE_STORE: 'redis'
      CACHE_REDIS: 'redis://cache:6379'

      ADMIN_EMAIL: 'admin@example.com'
      ADMIN_PASSWORD: 'd1r3ctu5'

      # Make sure to set this in production
      # (see https://docs.directus.io/self-hosted/config-options#general)
      # PUBLIC_URL: 'https://directus.example.com'
```

### Updating With Docker Compose

If you are not using the `latest` tag for the Directus image you need to adjust your `docker-compose.yml` file to
increment the tag version number, e.g.:

```diff
-   image: directus/directus:10.0.0
+   image: directus/directus:10.1.0
```

You can then issue the following two commands (from your docker-compose root):

```bash
docker-compose pull
docker-compose up -d
```

The images will be pulled and the containers recreated. Migrations will happen automatically so once the containers have started you will be on the latest version (or the version you specified).

### Adding Packages to Use in Flows Scripts

If you need third-party packages in a script of one of your flows, the recommended way is to create a new Docker image
extending from the official image and installing the packages there.

First create a file called `Dockerfile` with a content like this:

```docker
FROM directus/directus:10.0.0

USER root
RUN corepack enable \
  && corepack prepare pnpm@8.3.1 --activate

USER node
RUN pnpm install moment uuid
```

Then build the image based on that file:

```bash
docker build -t my-custom-directus-image .
```

And update the image reference in the `docker-compose.yml` file:

```diff
-    image: directus/directus:latest
+    image: my-custom-directus-image:latest
```

:::tip Don't forget to provide `FLOWS_EXEC_ALLOWED_MODULES` variable

In your `docker-compose.yml` file, you will need to add:

```diff
    environment:
+     FLOWS_EXEC_ALLOWED_MODULES=array:moment,uuid
```

For more information, please see the config section on
[Flows](https://docs.directus.io/self-hosted/config-options.html#flows)

:::

## Supported Databases

The Directus Docker Image contains all optional dependencies supported in the API. This means the Docker image can be
used with most of the supported databases and storage adapters without having to create a custom image.

To run Directus, you currently need one of the following databases:

| Database                              | Version     |
| ------------------------------------- | ----------- |
| PostgreSQL                            | 10+         |
| MySQL <sup>[1]</sup>                  | 5.7.8+ / 8+ |
| SQLite                                | 3+          |
| MS SQL Server                         | 13+         |
| MariaDB <sup>[2]</sup>                | 10.2.7+     |
| CockroachDB <sup>[2]</sup>            | 21.1.13+    |
| OracleDB<sup>[2]</sup> <sup>[3]</sup> | 19+         |

<sup>[1]</sup> MySQL 8+ requires
[mysql_native_password](https://dev.mysql.com/doc/refman/8.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password-compatible-connectors)
to be enabled\
<sup>[2]</sup> Older versions may work, but aren't officially supported. Use at your own risk. \
<sup>[3]</sup> Make sure to install `node-oracledb` and it's system dependencies when using OracleDB

::: warning OracleDB

OracleDB's Node client (`node-oracledb`) requires a couple more native dependencies, and specific configurations in
order to run. The official Directus Docker image does not include these dependencies. See
[https://blogs.oracle.com/opal/dockerfiles-for-node-oracledb-are-easy-and-simple](https://blogs.oracle.com/opal/dockerfiles-for-node-oracledb-are-easy-and-simple)
for more information on what to include for OracleDB.

:::

## Requirements

It can be easy to under-provision resources to run a self-hosted instance of Directus. For Directus' container resources, the required minimum system requirements are 1x 0.25 vCPU / 512 MB, although the recommended minimum is 2x 1 vCPU / 2GB.
