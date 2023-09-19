---
contributors: Esther Agbaje
description: Discover how to install extensions into your Directus project.
---

# Installing Extensions

There are 3 possible ways to install extensions to your Directus instance:

1. Installing through npm
2. Installing through the extensions folder
3. Installing through the marketplace

## Installing through NPM

Before you begin, ensure you have a [selfhosted instance of Directus](/self-hosted/quickstart) via Docker installed on
your system.

**1. Modify docker-compose.yml**

Open the `docker-compose.yml` file of your project and modify the build section:

```yaml
build:
  context: ./
```

This modification allows Docker to build your project with the necessary dependencies.

**2. Create a Dockerfile**

At the root of your project, create a Dockerfile if one doesn't already exist. Inside this `Dockerfile`, add the
following:

```Dockerfile
FROM directus/directus:latest

USER root
RUN corepack enable \
 && corepack prepare pnpm@8.3.1 --activate

USER node
RUN pnpm install directus-extension-package-name
```

::: tip Extension Name

Replace `directus-extension-package-name` with the name of the extension you want to install. For example,
`directus-extension-myextension`.

:::

**3. Building the Docker Image**

To apply the changes whenever changes are made in the Dockerfile, build the Docker image by running the following
command:

```bash
docker-compose up --build
```

::: tip Reloading Extensions

To automatically reload extensions every time you make a change, without having to restart Directus, in your
`docker-compose.yml` file, set `EXTENSIONS_AUTO_RELOAD=true`.

:::

Start up your Directus instance to run the extensions you specified:

```bash
docker-compose up
```

## Installing Through the Extensions Folder
