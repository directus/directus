---
description: How to host Directus on Docker.
readTime: 3 min read
---

# Docker Guide

::: info Non-Docker Guides

We only publish and maintain self hosting guides using Docker as this removes many environment-specific configuration
problems. If you can't or don't want to use Docker, we also publish an
[npm package](https://www.npmjs.com/package/directus) without guides.

:::

Directus is published to [Docker Hub](https://hub.docker.com/r/directus/directus) under `directus/directus`. To use the
latest Directus image from Docker Hub, run:

```bash
# Make sure to change sensitive values (KEY, SECRET, ...) in production
docker run \
  -p 8055:8055 \
  -e KEY=255d861b-5ea1-5996-9aa3-922530ec40b1 \
  -e SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263 \
  directus/directus
```

### Installing Specific Versions

To stick to a more specific version of Directus you can use one of the following tags:

- Full version, e.g. `10.0.0`
- Minor releases, e.g. `10.0`
- Major releases, e.g. `10`

To use a specific version of Directus, run:

```bash
# Make sure to change sensitive values (KEY, SECRET, ...) in production
docker run \
  -p 8055:8055 \
  -e KEY=255d861b-5ea1-5996-9aa3-922530ec40b1 \
  -e SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263 \
  directus/directus:10.0.0
```

### Configure Admin User

The published Docker image will automatically populate the database and create an admin user. To configure the
email/password for this first user, pass the following env vars:

```bash
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"
```

## Persistence

Containers are ephemeral, and this means that whenever you stop a container, all the data associated with it is going to
be removed [unless you persist them](https://docs.docker.com/storage) when creating your container.

Directus image by default
[will use the following locations](https://github.com/directus/directus/blob/main/docker/Dockerfile#L56-L60) for data
persistence (note that these can be changed through environment variables)

- `/directus/uploads` for uploads
- `/directus/database` (only when using SQLite and not configured to a different folder)
- `/directus/extensions` for loading extensions

## Docker Compose

When using Docker Compose, you can use the following setup to get you started - make sure to change all sensitive values
(`SECRET`, `DB_PASSWORD`, ...) in production:

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
      # By default, uploads are stored in /directus/uploads
      # Always make sure your volumes matches the storage root when using
      # local driver
      - ./uploads:/directus/uploads
      # Make sure to also mount the volume when using SQLite
      # - ./database:/directus/database
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

networks:
  directus:
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

The images will be pulled and the containers recreated. Migrations will happen automatically so once the containers have
started you will be on the latest version (or the version you specified).

### Adding packages to use in Flows scripts

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
