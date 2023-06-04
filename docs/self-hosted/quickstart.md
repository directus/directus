---
description:
  If you're looking for the fastest way to get up-and-running with Directus, this guide will walk you through getting
  things installed, configured, and modeled.
readTime: 5 min read
---

# Quickstart Guide

> If you're looking for the fastest way to get up-and-running with Directus, this guide will walk you through getting
> things installed, configured, and modeled.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (often included with newer Docker installations)

It can be easy to under-provision resources to run a self-hosted instance of Directus. For Directus' container resources, the required minimum system requirements are 1x 0.25 vCPU / 512 MB, although the recommended minimum is 2x 1 vCPU / 2GB.

## 1. Installation

You can use the following configuration to get started using Docker Compose. Make sure to change all sensitive values
like `KEY`, `SECRET`, `ADMIN_PASSWORD`, _etc._

```yaml
version: '3'
services:
  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - ./uploads:/directus/uploads
      - ./database:/directus/database
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'

      DB_CLIENT: 'sqlite3'
      DB_FILENAME: './database/data.db'

      ADMIN_EMAIL: 'admin@example.com'
      ADMIN_PASSWORD: 'd1r3ctu5'
```

Save this in your project as a file named `docker-compose.yml` and run:

```
docker-compose up -d
```

::: tip More Info on Docker

To learn more, visit the [Docker Guide](/self-hosted/docker-guide).

:::

## 2. Login to App

With the server running, you're now able to login to your new Directus project and start using it.

Our start command stated that the server started at port `8055`, which means we can navigate to `http://localhost:8055`
to open Directus in the browser.

Login using the admin credentials you configured during the installation in Step 1.

## 3. Create a Collection

Once logged in, you're greeted with the option to create your first Collection:

![Directus Empty State](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/empty-state-20220217A.webp)

Follow the prompts and create a Collection. For the sake of this demo, we'll be calling ours `articles`, but feel free
to make it your own!

::: tip More Info on Collections

To learn more, see our documentation [Collections](/app/content/collections).

:::

## 4. Create a Field

With the Collection created, it's time to start adding some Fields. Click the **"Create Field"** button, and select
**"Input"**:

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/add-field-20220217A.mp4" type="video/mp4" />
</video>

We'll be calling our Field `title`. While Directus offers a range of powerful field customization options, we'll be
sticking to the defaults for now. These defaults use the "String" datatype.

::: tip More Info on Fields

To learn more, see our documentation on [Fields](/getting-started/glossary#fields).

:::

## 5. Create an Item

Now that we have a Collection with a Field configured, it's time to start adding some content. Navigate to the Content
Module (top left), and click <span mi btn>add</span> in the top-right to get started. This will take you to the
Create/Edit Item page:

![Directus Create Item](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/create-item-20220217A.webp)

Once you're happy with your creation, click <span mi btn>check</span> in the top-right to save your Item to the
database.

::: tip More Info on Items

To learn more, see our documentation on [Items](/app/content/items).

:::

## 6. Set Role/Public Permissions

By default, all content entered into Directus is considered private. This means that no data will be returned by the
API, unless requested by an authenticated user that has the correct permissions. In order to have the API return our
items, we'll have to setup some permissions. Navigate to **Settings Module <span mi icon dark>chevron_right</span> Roles
& Permissions**.

Directus ships with a special **"Public"** role that controls what data is returned to non-authenticated users. Select
the Public Role, find your Collection, and click the icon under the <span mi icon>visibility</span> icon (read/view
permission) to allow the Public Role to read the Items in your Collection.

![Directus Permissions](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/permissions-20220217A.webp)

::: tip More Info on Roles & Permissions

Roles & Permissions are extremely powerful and can get pretty in-depth. To learn all about the nuances in setting these
up, see [Roles](/reference/system/roles) & [Permissions](/reference/system/permissions).

:::

## 7. Connect to the API

Now that your project has some content in it, it's time to start using this content externally. Data can be accessed in
a number of ways, including the REST API, GraphQL, the CLI, or even straight from the database. In this case, we'll use
[the `/items/` REST API endpoint](/reference/items) to retrieve the item we just created.

Use your browser or an API tool like [Postman](http://postman.com) or [Paw](https://paw.cloud) to open
`http://localhost:8055/items/articles`.

And there it is! The Article Item you just created is being served in beautiful JSON, ready to be used anywhere and
everywhere!

```json
{
	"data": [
		{
			"id": 1,
			"title": "Hello World!"
		}
	]
}
```
