# Installing with Docker

Directus is published to both [DockerHub](https://hub.docker.com/r/directus/directus) and
[GitHub Packages](https://github.com/orgs/directus/packages/container/package/directus) under `directus/directus`. To
use the Directus image from DockerHub, run:

```bash
docker run -p 8055:8055 directus/directus
```

### Installing Specific Versions

Each released version is available under its own tag (e.g. 9.0.0-rc.85). To use a specific version of Directus, run:

```bash
docker run -p 8055:8055 directus/directus:9.0.0-rc.85
```

::: warning Change In Naming of Docker Tags

Before 9.0.0-rc.84 the Docker tags were prefixed by a "v" - e.g. v9.0.0-rc.83.

:::

### Create admin user using docker

The published Docker image will automatically populate the database, and create a user. To configure the email/password
for this first user, pass the following env vars:

```bash
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"
```

## Persistence

Containers are ephemeral, and this means that whenever you stop a container, all the data associated with it is going to
be removed [unless you persist them](https://docs.docker.com/storage/) when creating your container.

Directus image by default
[will use the following locations](https://github.com/directus/directus/blob/main/docker/Dockerfile#L56-L60) for data
persistence (note that these can be changed through environment variables)

- `/directus/uploads` for uploads
- `/directus/database` (only when using SQLite and not configured to a different folder)
- `/directus/extensions` for extension loadings

## Docker Compose

When using Docker compose, you can use the following setup to get you started - make sure to change all sensitive values
(`SECRET`, `DB_PASSWORD`, ...) in production:

```yaml
version: '3'
services:
  database:
    container_name: database
    image: postgres:12
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
      # (see https://docs.directus.io/reference/environment-variables/#general)
      # PUBLIC_URL: 'https://directus.example.com'

networks:
  directus:
```

### Updating with Docker Compose

If you are not using the `latest` tag for directus you need to adjust your `docker-compose.yml` file to increment the
tag version number, e.g.

```
-   image: directus/directus:9.0.0-rc.89
+   image: directus/directus:9.0.0-rc.90
```

You can then issue the following two commands (from your docker-compose root):

```
docker-compose pull
docker-compose up -d
```

The images will be pulled and the containers recreated. Migrations will happen automatically so once the containers have
started you will be on the newest version (or the version you specified).

## Supported Databases

The Directus Docker Image contains all optional dependencies supported in the API. This means the Docker image can be
used with most of the supported databases and storage adapters without having to create a custom image.

::: warning OracleDB

OracleDB's Node client (`node-oracledb`) requires a couple more native dependencies, and specific configurations in
order to run. The official Directus Docker image does not include these dependencies. See
[https://blogs.oracle.com/opal/dockerfiles-for-node-oracledb-are-easy-and-simple](https://blogs.oracle.com/opal/dockerfiles-for-node-oracledb-are-easy-and-simple)
for more information on what to include for OracleDB.

:::
