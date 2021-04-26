# Installing with Docker

Directus is published to both [DockerHub](https://hub.docker.com/r/directus/directus) and
[GitHub Packages](https://github.com/orgs/directus/packages/container/package/directus) under `directus/directus`. To
run Directus straight from DockerHub, run:

```bash
docker run -p 8055:8055 directus/directus
```

### Installing Specific Versions

For every version we release, we update/publish three tags. This allows you to use the latest released version, the
latest minor (eg v9.1) or a specific version (eg v9.1.2). To run Directus on a specific version, run:

```bash
docker run -p 8055:8055 directus/directus:v9
# OR
docker run -p 8055:8055 directus/directus:v9.1
# OR
docker run -p 8055:8055 directus/directus:v9.1.2
```

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
[will use the following locations](https://github.com/directus/directus/blob/main/.github/actions/build-images/rootfs/directus/images/main/Dockerfile#L93-L96)
for data persistence (note that these can be changed through environment variables)

- `/directus/uploads` for uploads
- `/directus/database` (only when using SQLite and not configured to a different folder)
- `/directus/extensions` for extension loadings

## Docker Compose

When using Docker compose, you can use the following setup to get you started:

```yaml
version: '3.2'
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
    image: directus/directus:v9.0.0-rc.24
    ports:
      - 8055:8055
    volumes:
      # By default, Directus images writes uploads to /directus/uploads
      # Always make sure your volumes matches the storage root when using
      # local driver
      - ./uploads:/directus/uploads
      # Make sure to also mount the volume When using SQLite
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

networks:
  directus:
```
