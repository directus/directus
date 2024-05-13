---
description:
  Get up and running with Directus in minutes. Learn the basics of building your data model and managing
  permissions.
readTime: 7 min read
---

# Quickstart Guide

> This quickstart guide is designed to get you up and running with a Directus Project in a few minutes. Along the way,
> you will better understand what Directus is, setup your Directus project locally or with Directus Cloud, and get a
> hands-on introduction to the App and API.

## 1. Create a Project

::: tabs

== Directus Cloud

1. Create and login to your [Directus Cloud account](https://directus.cloud)

   The very first time you log in to your Cloud Account, you will be prompted to create a Team. Each Directus Cloud
   Project exists within the scope of one Team. They allow you to organize Team Members, Projects and Project Billing as
   desired.

2. Create a new project

   Once started, it should take around 90 seconds for the Cloud Project to created. During this time, a link will be
   sent to the email associated with your Cloud Account. The email will contain your Project URL as well as an email and
   password to login. If you used GitHub to create your account, this will be your GitHub email.

3. Access your new project

   Login to your new project using the URL in your email inbox or on your Directus Cloud Dashboard.

<sub>Learn more about Directus Cloud Projects in our [User Guide](/user-guide/cloud/projects).</sub>

== Docker Installation

1. Initialize and start a new Directus project

   You will need [Docker](https://docs.docker.com/get-docker/) installed and running on your machine.

   Open up your terminal and run the following command:

   ```shell
   docker run \
   -p 8055:8055 \
   -e SECRET=replace-with-secure-random-value \
   directus/directus
   ```

2. Access your new project

   The initial admin email address and password will be shown in the terminal. Directus should now be available at
   http://localhost:8055 or http://127.0.0.1:8055.

<sub>Learn more about self-hosting Directus in our [Self-Hosted Quickstart](/self-hosted/quickstart).</sub>

== NPM Installation

1. Initialize a new Directus project using the CLI

   Replace `<project-name>` with the name you want to use for the project directory.

   ```shell
   npm init directus-project@latest <project-name>
   ```

   Follow the prompts to configure your database and create your first admin user.

2. Start your new project

   Run the following commands to start the new project locally:

   ```shell
   cd <project-name>
   npx directus start
   ```

<sub>Learn more about self-hosting Directus in our [Self-Hosted CLI Guide](/self-hosted/cli).</sub>

:::danger Docker is Recommended

While this method works and is maintained, it is not recommended. Docker removes environment-specific quirks that can
lead to Directus not running properly in some contexts.

Running Directus without Docker may result in errors as a result of environment-specific characteristics. In such a
case, make sure you have the required system dependencies for `isolated-vm`, `sharp`, and `argon2` installed.

:::

## 2. Create a Collection

Once logged in, you're greeted with the option to create your first
[Collection](/user-guide/overview/glossary#collections).

1. Navigate into the Content Module.
2. Click **"Create Collection"** and a side menu will appear.
3. Fill in a **Name**.\
   For the sake of this demo, we'll call ours `articles`, but feel free to make it your own!
4. Leave the other options at default. Click <span mi btn>arrow_forward</span> and the **"Optional Fields"** menu will
   open.\
   Keep the values in this menu at the default, toggled off, for now. You can adjust them later.
5. Click <span mi btn>check</span> in the menu header.

::: tip Learn More About Collections

- [The Content Module](/user-guide/content-module/content)
- [Create and Manage a Collection](/app/data-model/collections)
- [Build Relationships Between Collections](/app/data-model/relationships)

:::

## 3. Create a Field

With your first Collection created, it's time to start adding some [Fields](/user-guide/overview/glossary#fields).

1. Navigate to **Settings Module > Data Model > `Collection-Name`**.
2. Click the **"Create Field"** button and select the **"Input"** Field type.
3. Fill in a Field name under **Key**. We'll be calling our Field `title`.\
   Directus offers powerful Field customization options, but let's stick to the defaults for now.
4. Select **"Save"**.

::: tip Learn More About Fields

- [Create and Manage Fields in the App](/app/data-model)

:::

## 4. Create an Item

Now that we have a Collection with a Field configured, it's time to add an [Item](/user-guide/overview/glossary#).

1. Navigate to the Content Module.
2. Click <span mi btn>add</span> in the page header to open the Item Page.
3. Fill in the Field Value(s) as desired.
4. Click <span mi btn>check</span> in the top-right to save your Item.

::: tip Learn More About Items

- [The Content Module](/user-guide/content-module/content)
- [The Item Page](/user-guide/content-module/content/items)

:::

## 5. Set Roles & Permissions

Directus comes with two built-in roles: Public and Admin. The Public Role determines what data is returned to
non-authenticated users. Public comes with all permissions turned off and can be reconfigured with fully granular
control to expose exactly what you want unauthenticated Users to see. The Admin role has full permissions and this
cannot be changed. Aside from these built-in Roles, any number of new Roles can be created, all with fully customized,
granular permissions.

By Default, content entered into Directus will be considered private. So permissions always start off set to the default
of <span mi icon dngr>block</span> **No Access**, with full ability to reconfigure as desired. So, in order to have the
API return our Items, let's add some read permissions. For simplicity's sake, we'll do this on the Public Role, instead
of creating a new Role.

1. Navigate to **Settings Module > Access Control > Public**.
2. Click <span mi icon dngr>block</span> under the <span mi icon>visibility</span> icon on the desired Collection.\
   In our case, the Collection name is `articles`.
3. Click **"All Access"** to give the Public Role full read permissions to the Items in this Collection.

::: tip Learn More About Roles & Permissions

- [Users, Roles and Permissions](/user-guide/user-management/users-roles-permissions).

:::

## 6. Connect to the API

Now that your Project has some content in it which is exposed to the Public, it's time to start using this content
externally! Data can be accessed in a number of ways, including the REST and GraphQL API endpoints. In this case, we'll
use the `/items/` [REST API endpoint](/reference/items) to retrieve the Item we just created.

1. Open `http://your-project-url.directus.app/items/articles` in your browser.

_And there it is! The Article Item you just created is being served in beautiful JSON, ready to be used anywhere and
everywhere!_

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

_In this example, we made a super-simple read request with the API, but there's more! The REST and GraphQL APIs provide
exhaustive endpoints for the data model and every single action that you can do in the App can be done via the API. In
fact, the App is just a GUI powered by the API._

::: tip Learn More About The API

- [Intro to the API](/reference/introduction)
- [JavaScript SDK](/guides/sdk/getting-started)

:::
