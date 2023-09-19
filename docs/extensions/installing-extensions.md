---
contributors: Esther Agbaje
description: Discover how to install extensions into your Directus project
---

# Installing Extensions

There are 3 possible ways to install extensions to your Directus instance:

1. Installing through npm
2. Installing through the extensions folder
3. Installing through the marketplace

## Installing through NPM

Before you begin, ensure you have a selfhosted version of Directus via Docker installed on your system.

1. Modify docker-compose.yml

Open the `docker-compose.yml` file of your Directus project and modify the build section:

```yaml
build:
  context: ./
```

This modification allows Docker to build your project with the necessary dependencies.

2. Create a Dockerfile

At the root of your project, create a Dockerfile if one doesn't already exist. Open the `Dockerfile` and add the
following:

```Dockerfile
FROM directus/directus:latest

USER root
RUN corepack enable \
 && corepack prepare pnpm@8.3.1 --activate

USER node
RUN pnpm install directus-extension-package-name
```

Replace directus-extension-package-name with the name of the extension you want to install. You can install multiple
extensions by adding them to the pnpm install command, separated by spaces.

3. Building the Docker Image

To apply the changes and install the extensions, you need to build the Docker image. Open your terminal and navigate to
the root directory of your Directus project that contains the Dockerfile. Run the following command to build the Docker
image:

```bash
docker-compose up --build
```

This command will rebuild your Directus Docker container with the specified extensions installed.

Once the Docker image is built successfully, you can start your Directus instance by running:

```bash
docker-compose up
```

Your Directus instance will now run with the extensions you specified in the Dockerfile.

You could set EXTENSIONS_AUTO_RELOAD=true in order reload the extensions every time you change them without having to
restart Directus.
